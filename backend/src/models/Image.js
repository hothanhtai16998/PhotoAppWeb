import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema(
    {
        publicId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        imageTitle: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        imageUrl: {
            type: String,
            required: true,
        },
        imageCategory: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        location: {
            type: String,
            trim: true,
            index: true,
        },
        cameraModel: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for common queries
imageSchema.index({ uploadedBy: 1, createdAt: -1 });
imageSchema.index({ imageCategory: 1, createdAt: -1 });

const Image = mongoose.model('Image', imageSchema);

export default Image;