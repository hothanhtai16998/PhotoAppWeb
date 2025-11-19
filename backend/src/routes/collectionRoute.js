import express from 'express';
import {
    createCollection,
    getCollections,
    getCollectionById,
    updateCollection,
    deleteCollection,
    addImageToCollection,
    removeImageFromCollection,
    getPublicCollections,
} from '../controllers/collectionController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { apiLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

// All collection routes require authentication
router.use(authenticate);

// Get user's collections
router.get('/', apiLimiter, getCollections);

// Get public collections
router.get('/public', apiLimiter, getPublicCollections);

// Get collection by ID
router.get('/:id', apiLimiter, getCollectionById);

// Create new collection
router.post('/', apiLimiter, createCollection);

// Update collection
router.patch('/:id', apiLimiter, updateCollection);

// Delete collection
router.delete('/:id', apiLimiter, deleteCollection);

// Add image to collection
router.post('/:id/images/:imageId', apiLimiter, addImageToCollection);

// Remove image from collection
router.delete('/:id/images/:imageId', apiLimiter, removeImageFromCollection);

export default router;

