import type { User } from './user';

export interface Image {
    _id: string;
    publicId: string;
    imageTitle: string;
    imageUrl: string;
    imageCategory: string;
    uploadedBy: User;
    location?: string;
    cameraModel?: string;
    createdAt: string;
    updatedAt: string;
}
