import express from 'express';
import {
    signUp,
    signIn,
    signOut,
    refreshToken,
} from '../controllers/authController.js';
import { authLimiter } from '../middlewares/rateLimiter.js';
import { validateSignUp, validateSignIn } from '../middlewares/validationMiddleware.js';

const router = express.Router();

// Apply strict rate limiting and validation to auth endpoints
router.post('/signup', authLimiter, validateSignUp, signUp);
router.post('/signin', authLimiter, validateSignIn, signIn);
router.post('/signout', signOut);
router.post('/refresh', refreshToken);

export default router;