import User from '../models/User.js';
import Image from '../models/Image.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { logger } from '../utils/logger.js';
import cloudinary from '../libs/cloudinary.js';

// Statistics
export const getDashboardStats = asyncHandler(async (req, res) => {
    const [totalUsers, totalImages, recentUsers, recentImages] = await Promise.all([
        User.countDocuments(),
        Image.countDocuments(),
        User.find().sort({ createdAt: -1 }).limit(5).select('username email displayName createdAt isAdmin').lean(),
        Image.find().sort({ createdAt: -1 }).limit(10).populate('uploadedBy', 'username displayName').select('imageTitle imageCategory createdAt uploadedBy').lean(),
    ]);

    // Count images by category
    const categoryStats = await Image.aggregate([
        { $group: { _id: '$imageCategory', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
    ]);

    res.status(200).json({
        stats: {
            totalUsers,
            totalImages,
            categoryStats,
        },
        recentUsers,
        recentImages,
    });
});

// User Management
export const getAllUsers = asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(Math.max(1, parseInt(req.query.limit) || 20), 100);
    const skip = (page - 1) * limit;
    const search = req.query.search?.trim();

    const query = {};
    if (search) {
        query.$or = [
            { username: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { displayName: { $regex: search, $options: 'i' } },
        ];
    }

    const [users, total] = await Promise.all([
        User.find(query)
            .select('-hashedPassword')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        User.countDocuments(query),
    ]);

    res.status(200).json({
        users,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    });
});

export const getUserById = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const user = await User.findById(userId).select('-hashedPassword').lean();

    if (!user) {
        return res.status(404).json({
            message: 'User not found',
        });
    }

    // Get user's image count
    const imageCount = await Image.countDocuments({ uploadedBy: userId });

    res.status(200).json({
        user: {
            ...user,
            imageCount,
        },
    });
});

export const updateUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { displayName, email, bio, isAdmin } = req.body;

    const user = await User.findById(userId);

    if (!user) {
        return res.status(404).json({
            message: 'User not found',
        });
    }

    const updateData = {};

    if (displayName !== undefined) {
        updateData.displayName = displayName.trim();
    }

    if (email !== undefined && email !== user.email) {
        const existingUser = await User.findOne({
            email: email.toLowerCase().trim(),
            _id: { $ne: userId },
        });

        if (existingUser) {
            return res.status(400).json({
                message: 'Email already exists',
            });
        }

        updateData.email = email.toLowerCase().trim();
    }

    if (bio !== undefined) {
        updateData.bio = bio.trim() || undefined;
    }

    if (isAdmin !== undefined) {
        updateData.isAdmin = isAdmin;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
        new: true,
        runValidators: true,
    }).select('-hashedPassword');

    res.status(200).json({
        message: 'User updated successfully',
        user: updatedUser,
    });
});

export const deleteUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
        return res.status(404).json({
            message: 'User not found',
        });
    }

    // Prevent deleting yourself
    if (userId === req.user._id.toString()) {
        return res.status(400).json({
            message: 'Cannot delete your own account',
        });
    }

    // Get all user's images
    const userImages = await Image.find({ uploadedBy: userId }).select('publicId');

    // Delete images from Cloudinary
    for (const image of userImages) {
        try {
            await cloudinary.uploader.destroy(image.publicId);
        } catch (error) {
            logger.warn(`Failed to delete image ${image.publicId} from Cloudinary:`, error);
        }
    }

    // Delete images from database
    await Image.deleteMany({ uploadedBy: userId });

    // Delete user
    await User.findByIdAndDelete(userId);

    res.status(200).json({
        message: 'User deleted successfully',
    });
});

// Image Management
export const getAllImagesAdmin = asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(Math.max(1, parseInt(req.query.limit) || 20), 100);
    const skip = (page - 1) * limit;
    const search = req.query.search?.trim();
    const category = req.query.category?.trim();
    const userId = req.query.userId?.trim();

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

    if (userId) {
        query.uploadedBy = userId;
    }

    const [images, total] = await Promise.all([
        Image.find(query)
            .populate('uploadedBy', 'username displayName email')
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

export const deleteImage = asyncHandler(async (req, res) => {
    const { imageId } = req.params;

    const image = await Image.findById(imageId);

    if (!image) {
        return res.status(404).json({
            message: 'Image not found',
        });
    }

    // Delete from Cloudinary
    try {
        await cloudinary.uploader.destroy(image.publicId);
    } catch (error) {
        logger.warn(`Failed to delete image ${image.publicId} from Cloudinary:`, error);
    }

    // Delete from database
    await Image.findByIdAndDelete(imageId);

    res.status(200).json({
        message: 'Image deleted successfully',
    });
});

