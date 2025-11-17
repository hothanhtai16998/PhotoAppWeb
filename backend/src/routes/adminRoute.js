import express from 'express';
import {
    getDashboardStats,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    getAllImagesAdmin,
    deleteImage,
} from '../controllers/adminController.js';
import { protectedRoute } from '../middlewares/authMiddleware.js';
import { adminRoute } from '../middlewares/adminMiddleware.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protectedRoute);
router.use(adminRoute);

// Dashboard
router.get('/dashboard/stats', getDashboardStats);

// User Management
router.get('/users', getAllUsers);
router.get('/users/:userId', getUserById);
router.put('/users/:userId', updateUser);
router.delete('/users/:userId', deleteUser);

// Image Management
router.get('/images', getAllImagesAdmin);
router.delete('/images/:imageId', deleteImage);

export default router;

