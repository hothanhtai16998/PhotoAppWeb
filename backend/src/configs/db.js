import mongoose from 'mongoose';
import { env } from '../libs/env.js';
import { logger } from '../utils/logger.js';

/**
 * Connects to MongoDB database
 */
export const CONNECT_DB = async () => {
    try {
        const options = {
            // Use new URL parser and unified topology
            // These are defaults in newer versions but explicit for clarity
        };

        await mongoose.connect(env.MONGODB_URI, options);
        logger.info('✅ MongoDB connected successfully');

        // Handle connection events
        mongoose.connection.on('error', (err) => {
            logger.error('❌ MongoDB connection error', err);
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('⚠️ MongoDB disconnected');
        });

        // Graceful shutdown
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            logger.info('MongoDB connection closed through app termination');
            process.exit(0);
        });
    } catch (error) {
        logger.error(`❌ Error connecting to MongoDB: ${error.message}`, error);
        process.exit(1);
    }
};