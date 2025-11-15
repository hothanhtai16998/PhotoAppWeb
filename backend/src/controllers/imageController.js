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
    if (search) {
        query.$or = [
            { imageTitle: { $regex: search, $options: 'i' } },
            { location: { $regex: search, $options: 'i' } },
        ];
    }
    if (category) {
        query.imageCategory = category;
    }

    // Get images with pagination
    const [images, total] = await Promise.all([
        Image.find(query)
            .populate('uploadedBy', 'username displayName avatarUrl')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Image.countDocuments(query),
    ]);

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
                    // Optimize images: auto-format and quality for faster uploads
                    transformation: [
                        { quality: 'auto:good' }, // Auto quality optimization (reduces file size)
                        { fetch_format: 'auto' }, // Auto format (WebP when supported, smaller files)
                    ],
                    // Note: Eager transformations removed for faster uploads
                    // Can be added back if pre-generated sizes are needed
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );

            // Pipe buffer stream to upload stream
            bufferStream.pipe(uploadStream);
        });

        // Save to database (don't wait for populate, do it in parallel if possible)
        const newImage = await Image.create({
            imageUrl: uploadResponse.secure_url,
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
