import express from 'express';
import {
    getAllImages,
    uploadImage,
    getImagesByUserId,
} from '../controllers/imageController.js';
import { singleUpload } from '../middlewares/multerMiddleware.js';
import { protectedRoute } from '../middlewares/authMiddleware.js';
import { uploadLimiter } from '../middlewares/rateLimiter.js';
import { validateImageUpload, validateGetImages, validateUserId } from '../middlewares/validationMiddleware.js';

const router = express.Router();

// Public route - get all images (with optional search/category filters)
router.get('/', validateGetImages, getAllImages);

// Protected routes
router.post('/upload', protectedRoute, uploadLimiter, singleUpload, validateImageUpload, uploadImage);
router.get('/user/:userId', protectedRoute, validateUserId, validateGetImages, getImagesByUserId);

export default router;