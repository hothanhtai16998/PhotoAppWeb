import cloudinary from '../libs/cloudinary.js';
import Image from '../models/Image.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { logger } from '../utils/logger.js';
import { PAGINATION } from '../utils/constants.js';
import { Readable } from 'stream';

export const getAllImages = asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE);
    const limit = Math.min(
        Math.max(1, parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT),
        PAGINATION.MAX_LIMIT
    );
    const skip = (page - 1) * limit;
    const search = req.query.search?.trim();
    const category = req.query.category?.trim();

    // Build query
    const query = {};
    let useTextSearch = false;

    if (search) {
        // Use text search for better performance (requires text index)
        // Text search is much faster than regex for large collections
        // Note: If text index doesn't exist, MongoDB will throw an error
        // In that case, the error handler will catch it and you should create the index
        query.$text = { $search: search };
        useTextSearch = true;
    }
    if (category) {
        query.imageCategory = category;
    }

    // Get images with pagination
    // Use estimatedDocumentCount for better performance on large collections
    // Only use countDocuments if we need exact count (e.g., with filters)
    const [images, total] = await Promise.all([
        Image.find(query)
            .populate('uploadedBy', 'username displayName avatarUrl')
            // Sort by text relevance score if using text search, otherwise by date
            .sort(useTextSearch ? { score: { $meta: 'textScore' }, createdAt: -1 } : { createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        // For filtered queries, we need exact count. For unfiltered, estimated is faster
        Object.keys(query).length > 0
            ? Image.countDocuments(query)
            : Image.estimatedDocumentCount(),
    ]);

    // Set cache headers for better performance (like Unsplash)
    // Cache API responses for 5 minutes, images themselves are cached by Cloudinary
    res.set('Cache-Control', 'public, max-age=300'); // 5 minutes

    res.status(200).json({
        images,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    });
});

export const uploadImage = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { imageTitle, imageCategory, location, cameraModel } = req.body;

    if (!req.file) {
        return res.status(400).json({
            message: 'Image file is required',
        });
    }

    if (!imageTitle || !imageCategory) {
        return res.status(400).json({
            message: 'Title and category are required',
        });
    }

    // Validate file type
    if (!req.file.mimetype.startsWith('image/')) {
        return res.status(400).json({
            message: 'File must be an image',
        });
    }

    let uploadResponse;
    try {
        // Upload directly from buffer stream (more efficient than base64)
        // Convert buffer to readable stream for better performance with large files
        const bufferStream = Readable.from(req.file.buffer);

        uploadResponse = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'photo-app-images',
                    resource_type: 'image',
                    // Generate multiple sizes for progressive loading (like Unsplash)
                    eager: [
                        // Thumbnail: 200px width, low quality for blur-up effect
                        { width: 200, quality: 'auto:low', fetch_format: 'auto', crop: 'limit' },
                        // Small: 400px width for grid view
                        { width: 400, quality: 'auto:good', fetch_format: 'auto', crop: 'limit' },
                        // Regular: 1080px width for detail view
                        { width: 1080, quality: 'auto:good', fetch_format: 'auto', crop: 'limit' },
                    ],
                    // Main image transformation
                    transformation: [
                        { quality: 'auto:good' },
                        { fetch_format: 'auto' },
                    ],
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );

            // Pipe buffer stream to upload stream
            bufferStream.pipe(uploadStream);
        });

        // Extract different size URLs from eager transformations
        const thumbnailUrl = uploadResponse.eager?.[0]?.secure_url || uploadResponse.secure_url;
        const smallUrl = uploadResponse.eager?.[1]?.secure_url || uploadResponse.secure_url;
        const regularUrl = uploadResponse.eager?.[2]?.secure_url || uploadResponse.secure_url;

        // Save to database with multiple image sizes
        const newImage = await Image.create({
            imageUrl: uploadResponse.secure_url, // Full size (original)
            thumbnailUrl, // Small thumbnail for blur-up
            smallUrl, // Small size for grid
            regularUrl, // Regular size for detail
            publicId: uploadResponse.public_id,
            imageTitle: imageTitle.trim(),
            imageCategory: imageCategory.trim(),
            uploadedBy: userId,
            location: location?.trim() || undefined,
            cameraModel: cameraModel?.trim() || undefined,
        });

        // Populate user info
        await newImage.populate('uploadedBy', 'username displayName avatarUrl');

        res.status(201).json({
            message: 'Image uploaded successfully',
            image: newImage,
        });
    } catch (error) {
        // Rollback Cloudinary upload if DB save failed
        if (uploadResponse?.public_id) {
            try {
                await cloudinary.uploader.destroy(uploadResponse.public_id);
            } catch (rollbackError) {
                logger.error('Failed to rollback Cloudinary upload', rollbackError);
            }
        }
        throw error;
    }
});

export const getImagesByUserId = asyncHandler(async (req, res) => {
    const userId = req.params.userId;
    const page = Math.max(1, parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE);
    const limit = Math.min(
        Math.max(1, parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT),
        PAGINATION.MAX_LIMIT
    );
    const skip = (page - 1) * limit;

    const [images, total] = await Promise.all([
        Image.find({ uploadedBy: userId })
            .populate('uploadedBy', 'username displayName avatarUrl')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Image.countDocuments({ uploadedBy: userId }),
    ]);

    // Set cache headers for better performance
    res.set('Cache-Control', 'public, max-age=300'); // 5 minutes

    res.status(200).json({
        images,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    });
});
