
import prisma from '../../lib/prisma.js';
import {
  AuthorizationError,
  ConflictError,
  NotFoundError,
} from '../utils/errors.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;


export const syncVendorProfileCertificationStatus = async (vendorProfileId) => {
  const certs = await prisma.sustainabilityCert.findMany({
    where: { vendorId: vendorProfileId },
    select: { status: true },
  });

  if (certs.length === 0) {
    await prisma.vendorProfile.update({
      where: { id: vendorProfileId },
      data: { certificationStatus: 'PENDING' },
    });
    return;
  }

  const hasApproved = certs.some((c) => c.status === 'APPROVED');
  const hasPending = certs.some((c) => c.status === 'PENDING');

  let next;
  if (hasApproved) {
    next = 'APPROVED';
  } else if (hasPending) {
    next = 'PENDING';
  } else {
    next = 'REJECTED';
  }

  await prisma.vendorProfile.update({
    where: { id: vendorProfileId },
    data: { certificationStatus: next },
  });
};


const getVendorProfileForUserOrThrow = async (userId) => {
  const profile = await prisma.vendorProfile.findUnique({
    where: { userId },
  });
  if (!profile) {
    throw new NotFoundError('Vendor profile');
  }
  return profile;
};

export const createVendorProfile = async (userId, data) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError('User');
  }
  if (user.role !== 'VENDOR') {
    throw new AuthorizationError('Only vendor accounts can create a vendor profile');
  }

  const existing = await prisma.vendorProfile.findUnique({
    where: { userId },
  });
  if (existing) {
    throw new ConflictError('Vendor profile already exists');
  }

  const profile = await prisma.vendorProfile.create({
    data: {
      userId,
      farmName: data.farmName,
      farmLocation: data.farmLocation,
      lat: data.lat ?? null,
      lng: data.lng ?? null,
      certificationStatus: 'PENDING',
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
        },
      },
    },
  });

  return profile;
};


export const getVendorPublicById = async (vendorProfileId) => {
  const vendor = await prisma.vendorProfile.findUnique({
    where: { id: vendorProfileId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
      sustainabilityCerts: {
        select: {
          id: true,
          certifyingAgency: true,
          status: true,
          certificationDate: true,
          expiryDate: true,
        },
        orderBy: { createdAt: 'desc' },
      },
      _count: {
        select: { produce: true },
      },
    },
  });

  if (!vendor) {
    throw new NotFoundError('Vendor');
  }

  const { _count, ...rest } = vendor;
  return {
    vendor: rest,
    produceCount: _count.produce,
  };
};


export const updateVendorProfileForUser = async (userId, data) => {
  await getVendorProfileForUserOrThrow(userId);

  const profile = await prisma.vendorProfile.update({
    where: { userId },
    data: {
      ...(data.farmName !== undefined && { farmName: data.farmName }),
      ...(data.farmLocation !== undefined && { farmLocation: data.farmLocation }),
      ...(data.lat !== undefined && { lat: data.lat }),
      ...(data.lng !== undefined && { lng: data.lng }),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
        },
      },
    },
  });

  return profile;
};

export const submitSustainabilityCertification = async (userId, data) => {
  const profile = await getVendorProfileForUserOrThrow(userId);

  const cert = await prisma.sustainabilityCert.create({
    data: {
      vendorId: profile.id,
      certifyingAgency: data.certifyingAgency,
      certificationDate: data.certificationDate,
      expiryDate: data.expiryDate,
      documentUrl: data.documentUrl ?? null,
      status: 'PENDING',
    },
  });

  await syncVendorProfileCertificationStatus(profile.id);

  return cert;
};


export const listVendorsForAdmin = async (query) => {
  const page = Math.min(
    Math.max(parseInt(query.page, 10) || DEFAULT_PAGE, 1),
    1_000_000
  );
  const limit = Math.min(
    Math.max(parseInt(query.limit, 10) || DEFAULT_LIMIT, 1),
    MAX_LIMIT
  );
  const skip = (page - 1) * limit;

  const where = {};
  if (query.certificationStatus) {
    where.certificationStatus = query.certificationStatus;
  }

  const [items, total] = await Promise.all([
    prisma.vendorProfile.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
            role: true,
            createdAt: true,
          },
        },
        _count: {
          select: { produce: true, sustainabilityCerts: true },
        },
      },
    }),
    prisma.vendorProfile.count({ where }),
  ]);

  const data = items.map(({ _count, ...vp }) => ({
    ...vp,
    produceCount: _count.produce,
    certificationsCount: _count.sustainabilityCerts,
  }));

  return { data, page, limit, total };
};


export const updateVendorUserStatus = async (vendorUserId, status) => {
  const user = await prisma.user.findUnique({
    where: { id: vendorUserId },
    include: { vendorProfile: true },
  });

  if (!user) {
    throw new NotFoundError('User');
  }
  if (user.role !== 'VENDOR') {
    throw new AuthorizationError('Target user is not a vendor');
  }

  const updated = await prisma.user.update({
    where: { id: vendorUserId },
    data: { status },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      updatedAt: true,
    },
  });

  return updated;
};


export const updateCertificationStatus = async (certId, status) => {
  const cert = await prisma.sustainabilityCert.findUnique({
    where: { id: certId },
  });

  if (!cert) {
    throw new NotFoundError('Certification');
  }

  const updated = await prisma.sustainabilityCert.update({
    where: { id: certId },
    data: { status },
  });

  await syncVendorProfileCertificationStatus(cert.vendorId);

  return updated;
};
