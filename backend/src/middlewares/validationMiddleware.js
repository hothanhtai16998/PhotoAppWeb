import { body, param, query, validationResult } from 'express-validator';
import { asyncHandler } from './asyncHandler.js';

/**
 * Middleware to check validation results
 */
export const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation error',
            errors: errors.array(),
        });
    }
    next();
};

/**
 * Validation rules for authentication
 */
export const validateSignUp = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 20 })
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username must be 3-20 characters and contain only letters, numbers, and underscores'),
    body('email')
        .trim()
        .isEmail()
        .normalizeEmail()
        .withMessage('Invalid email format'),
    body('password')
        .isLength({ min: 8 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must be at least 8 characters with uppercase, lowercase, and a number'),
    body('firstName')
        .trim()
        .notEmpty()
        .withMessage('First name is required'),
    body('lastName')
        .trim()
        .notEmpty()
        .withMessage('Last name is required'),
    validate,
];

export const validateSignIn = [
    body('username')
        .trim()
        .notEmpty()
        .withMessage('Username is required'),
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
    validate,
];

/**
 * Validation rules for image operations
 */
export const validateImageUpload = [
    body('imageTitle')
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Image title must be between 1 and 200 characters'),
    body('imageCategory')
        .trim()
        .notEmpty()
        .withMessage('Image category is required'),
    body('location')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Location must be less than 200 characters'),
    body('cameraModel')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Camera model must be less than 100 characters'),
    validate,
];

export const validateGetImages = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    query('search')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Search query must be less than 100 characters'),
    query('category')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Category must be less than 50 characters'),
    validate,
];

export const validateUserId = [
    param('userId')
        .isMongoId()
        .withMessage('Invalid user ID format'),
    validate,
];

