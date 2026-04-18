import express from 'express';
import userController from '../controllers/userController.js';

const router = express.Router();

router.get('/', userController.getAllUsers.bind(userController));

router.get('/search', userController.searchUsers.bind(userController));


router.post('/', userController.createUser.bind(userController));

router.put('/:id', userController.updateUser.bind(userController));

router.delete('/:id', userController.deleteUser.bind(userController));

export default router;
