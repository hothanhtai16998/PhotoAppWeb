import Category from '../models/Category.js';
import Image from '../models/Image.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';

export const getAllCategories = asyncHandler(async (req, res) => {
    const categories = await Category.find({ isActive: true })
        .select('_id name description')
        .sort({ name: 1 })
        .lean();

    res.status(200).json({
        categories,
    });
});

export const getAllCategoriesAdmin = asyncHandler(async (req, res) => {
    // Check permission (super admin or admin with manageCategories permission)
    if (!req.user.isSuperAdmin && req.adminRole && !req.adminRole.permissions.manageCategories) {
        return res.status(403).json({
            message: 'Permission denied: manageCategories required',
        });
    }

    const categories = await Category.find()
        .sort({ name: 1 })
        .lean();

    // Get image count for each category
    const categoriesWithCounts = await Promise.all(
        categories.map(async (category) => {
            const count = await Image.countDocuments({ imageCategory: category._id });
            return {
                ...category,
                imageCount: count,
            };
        })
    );

    res.status(200).json({
        categories: categoriesWithCounts,
    });
});

export const createCategory = asyncHandler(async (req, res) => {
    // Check permission (super admin or admin with manageCategories permission)
    if (!req.user.isSuperAdmin && req.adminRole && !req.adminRole.permissions.manageCategories) {
        return res.status(403).json({
            message: 'Permission denied: manageCategories required',
        });
    }

    const { name, description } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({
            message: 'Category name is required',
        });
    }

    // Check if category already exists
    const existingCategory = await Category.findOne({
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
    });

    if (existingCategory) {
        return res.status(400).json({
            message: 'Category already exists',
        });
    }

    const category = await Category.create({
        name: name.trim(),
        description: description?.trim() || '',
        isActive: true,
    });

    res.status(201).json({
        message: 'Category created successfully',
        category,
    });
});

export const updateCategory = asyncHandler(async (req, res) => {
    // Check permission (super admin or admin with manageCategories permission)
    if (!req.user.isSuperAdmin && req.adminRole && !req.adminRole.permissions.manageCategories) {
        return res.status(403).json({
            message: 'Permission denied: manageCategories required',
        });
    }

    const { categoryId } = req.params;
    const { name, description, isActive } = req.body;

    const category = await Category.findById(categoryId);

    if (!category) {
        return res.status(404).json({
            message: 'Category not found',
        });
    }

    const updateData = {};

    // Update name if provided
    if (name !== undefined && name.trim() !== category.name) {
        const newName = name.trim();

        // Check if new name already exists
        const existingCategory = await Category.findOne({
            name: { $regex: new RegExp(`^${newName}$`, 'i') },
            _id: { $ne: categoryId },
        });

        if (existingCategory) {
            return res.status(400).json({
                message: 'Category name already exists',
            });
        }

        // When category name changes, we need to update the category document itself
        // Images are already linked by reference, so they will automatically use the new name
        // No need to update images - they reference the category by ID, not name

        updateData.name = newName;
    }

    if (description !== undefined) {
        updateData.description = description.trim() || '';
    }

    if (isActive !== undefined) {
        updateData.isActive = isActive;
    }

    const updatedCategory = await Category.findByIdAndUpdate(
        categoryId,
        updateData,
        { new: true, runValidators: true }
    );

    res.status(200).json({
        message: 'Category updated successfully',
        category: updatedCategory,
    });
});

export const deleteCategory = asyncHandler(async (req, res) => {
    // Check permission (super admin or admin with manageCategories permission)
    if (!req.user.isSuperAdmin && req.adminRole && !req.adminRole.permissions.manageCategories) {
        return res.status(403).json({
            message: 'Permission denied: manageCategories required',
        });
    }

    const { categoryId } = req.params;

    const category = await Category.findById(categoryId);

    if (!category) {
        return res.status(404).json({
            message: 'Category not found',
        });
    }

    // Check if category is used by any images
    const imageCount = await Image.countDocuments({ imageCategory: category._id });

    if (imageCount > 0) {
        return res.status(400).json({
            message: `Cannot delete category. ${imageCount} image(s) are using this category. Please update or delete those images first.`,
        });
    }

    await Category.findByIdAndDelete(categoryId);

    res.status(200).json({
        message: 'Category deleted successfully',
    });
});

