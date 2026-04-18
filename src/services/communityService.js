
import prisma from '../../lib/prisma.js';
import { AuthorizationError, NotFoundError, ValidationError } from '../utils/errors.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

const toPublicAuthor = (user) => (user ? { id: user.id, name: user.name } : null);

const mapPostWithAuthor = (row) => {
  const { user, ...rest } = row;
  return {
    ...rest,
    author: toPublicAuthor(user),
  };
};

export const listCommunityPosts = async (query) => {
  const page = Math.min(
    Math.max(parseInt(query.page, 10) || DEFAULT_PAGE, 1),
    1_000_000
  );
  const limit = Math.min(
    Math.max(parseInt(query.limit, 10) || DEFAULT_LIMIT, 1),
    MAX_LIMIT
  );
  const skip = (page - 1) * limit;

  const [rows, total] = await Promise.all([
    prisma.communityPost.findMany({
      skip,
      take: limit,
      orderBy: { postDate: 'desc' },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    }),
    prisma.communityPost.count(),
  ]);

  const data = rows.map(mapPostWithAuthor);
  return { data, page, limit, total };
};

export const getCommunityPostById = async (id) => {
  const post = await prisma.communityPost.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, name: true },
      },
    },
  });

  if (!post) {
    throw new NotFoundError('Post');
  }

  return { post: mapPostWithAuthor(post) };
};

export const createCommunityPost = async (userId, body) => {
  const content = String(body.postContent ?? '').trim();
  if (content.length < 10) {
    throw new ValidationError('postContent must be at least 10 characters');
  }

  const post = await prisma.communityPost.create({
    data: {
      userId,
      title: String(body.title).trim(),
      postContent: content,
    },
    include: {
      user: {
        select: { id: true, name: true },
      },
    },
  });

  return mapPostWithAuthor(post);
};


export const updateCommunityPost = async (postId, userId, body) => {
  const existing = await prisma.communityPost.findUnique({
    where: { id: postId },
  });

  if (!existing) {
    throw new NotFoundError('Post');
  }

  if (existing.userId !== userId) {
    throw new AuthorizationError('You can only edit your own posts');
  }

  const data = {};
  if (body.title !== undefined) {
    data.title = String(body.title).trim();
    if (data.title.length === 0) {
      throw new ValidationError('title cannot be empty');
    }
  }
  if (body.postContent !== undefined) {
    const content = String(body.postContent).trim();
    if (content.length < 10) {
      throw new ValidationError('postContent must be at least 10 characters');
    }
    data.postContent = content;
  }

  if (Object.keys(data).length === 0) {
    throw new ValidationError('Provide title and/or postContent to update');
  }

  const post = await prisma.communityPost.update({
    where: { id: postId },
    data,
    include: {
      user: {
        select: { id: true, name: true },
      },
    },
  });

  return mapPostWithAuthor(post);
};


export const deleteCommunityPost = async (postId, user) => {
  const existing = await prisma.communityPost.findUnique({
    where: { id: postId },
  });

  if (!existing) {
    throw new NotFoundError('Post');
  }

  const isOwner = existing.userId === user.id;
  const isAdmin = user.role === 'ADMIN';

  if (!isOwner && !isAdmin) {
    throw new AuthorizationError('You can only delete your own posts');
  }

  await prisma.communityPost.delete({
    where: { id: postId },
  });

  return { id: postId, deleted: true };
};
