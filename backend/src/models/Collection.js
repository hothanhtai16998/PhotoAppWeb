import mongoose from 'mongoose';

const collectionSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        description: {
            type: String,
            maxlength: 500,
            trim: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        images: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Image',
            },
        ],
        isPublic: {
            type: Boolean,
            default: false,
        },
        coverImage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Image',
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster queries
collectionSchema.index({ user: 1, createdAt: -1 });
collectionSchema.index({ isPublic: 1, createdAt: -1 });

// Virtual for image count
collectionSchema.virtual('imageCount').get(function () {
    return this.images ? this.images.length : 0;
});

// Ensure virtuals are included in JSON
collectionSchema.set('toJSON', { virtuals: true });
collectionSchema.set('toObject', { virtuals: true });

const Collection = mongoose.model('Collection', collectionSchema);

export default Collection;

