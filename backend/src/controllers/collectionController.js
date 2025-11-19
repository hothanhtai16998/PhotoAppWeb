import Collection from '../models/Collection.js';
import Image from '../models/Image.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { logger } from '../utils/logger.js';

// Get user's collections
export const getCollections = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const collections = await Collection.find({ user: userId })
        .populate('images', 'imageUrl thumbnailUrl imageTitle')
        .populate('coverImage', 'imageUrl thumbnailUrl')
        .sort({ createdAt: -1 })
        .lean();

    res.status(200).json({
        collections,
    });
});

// Get public collections
export const getPublicCollections = asyncHandler(async (req, res) => {
    const collections = await Collection.find({ isPublic: true })
        .populate('user', 'username displayName avatarUrl')
        .populate('images', 'imageUrl thumbnailUrl imageTitle')
        .populate('coverImage', 'imageUrl thumbnailUrl')
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

    res.status(200).json({
        collections,
    });
});

// Get collection by ID
export const getCollectionById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    const collection = await Collection.findOne({
        _id: id,
        $or: [{ user: userId }, { isPublic: true }],
    })
        .populate('user', 'username displayName avatarUrl')
        .populate('images')
        .populate('coverImage', 'imageUrl thumbnailUrl')
        .lean();

    if (!collection) {
        return res.status(404).json({
            message: 'Collection not found',
        });
    }

    res.status(200).json({
        collection,
    });
});

// Create new collection
export const createCollection = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { name, description, isPublic } = req.body;

    if (!name || name.trim() === '') {
        return res.status(400).json({
            message: 'Collection name is required',
        });
    }

    const collection = await Collection.create({
        name: name.trim(),
        description: description?.trim() || '',
        user: userId,
        isPublic: isPublic || false,
        images: [],
    });

    await collection.populate('images', 'imageUrl thumbnailUrl imageTitle');

    res.status(201).json({
        message: 'Collection created successfully',
        collection,
    });
});

// Update collection
export const updateCollection = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;
    const { name, description, isPublic, coverImage } = req.body;

    const collection = await Collection.findOne({ _id: id, user: userId });

    if (!collection) {
        return res.status(404).json({
            message: 'Collection not found',
        });
    }

    if (name !== undefined) collection.name = name.trim();
    if (description !== undefined) collection.description = description?.trim() || '';
    if (isPublic !== undefined) collection.isPublic = isPublic;
    if (coverImage !== undefined) collection.coverImage = coverImage;

    await collection.save();
    await collection.populate('images', 'imageUrl thumbnailUrl imageTitle');
    await collection.populate('coverImage', 'imageUrl thumbnailUrl');

    res.status(200).json({
        message: 'Collection updated successfully',
        collection,
    });
});

// Delete collection
export const deleteCollection = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    const collection = await Collection.findOneAndDelete({ _id: id, user: userId });

    if (!collection) {
        return res.status(404).json({
            message: 'Collection not found',
        });
    }

    res.status(200).json({
        message: 'Collection deleted successfully',
    });
});

// Add image to collection
export const addImageToCollection = asyncHandler(async (req, res) => {
    const { id, imageId } = req.params;
    const userId = req.user._id;

    // Verify collection belongs to user
    const collection = await Collection.findOne({ _id: id, user: userId });

    if (!collection) {
        return res.status(404).json({
            message: 'Collection not found',
        });
    }

    // Verify image exists
    const image = await Image.findById(imageId);
    if (!image) {
        return res.status(404).json({
            message: 'Image not found',
        });
    }

    // Check if image is already in collection
    if (collection.images.includes(imageId)) {
        return res.status(400).json({
            message: 'Image already in collection',
        });
    }

    // Add image to collection
    collection.images.push(imageId);

    // Set as cover image if collection is empty
    if (!collection.coverImage) {
        collection.coverImage = imageId;
    }

    await collection.save();
    await collection.populate('images', 'imageUrl thumbnailUrl imageTitle');
    await collection.populate('coverImage', 'imageUrl thumbnailUrl');

    res.status(200).json({
        message: 'Image added to collection',
        collection,
    });
});

// Remove image from collection
export const removeImageFromCollection = asyncHandler(async (req, res) => {
    const { id, imageId } = req.params;
    const userId = req.user._id;

    const collection = await Collection.findOne({ _id: id, user: userId });

    if (!collection) {
        return res.status(404).json({
            message: 'Collection not found',
        });
    }

    // Remove image from collection
    collection.images = collection.images.filter(
        (imgId) => imgId.toString() !== imageId
    );

    // Remove cover image if it was the removed image
    if (collection.coverImage?.toString() === imageId) {
        collection.coverImage = collection.images[0] || null;
    }

    await collection.save();
    await collection.populate('images', 'imageUrl thumbnailUrl imageTitle');
    await collection.populate('coverImage', 'imageUrl thumbnailUrl');

    res.status(200).json({
        message: 'Image removed from collection',
        collection,
    });
});

