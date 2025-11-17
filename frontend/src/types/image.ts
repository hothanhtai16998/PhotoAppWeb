import type { User } from './user';

export interface Category {
	_id: string;
	name: string;
	description?: string;
}

export interface Image {
	_id: string;
	publicId: string;
	imageTitle: string;
	imageUrl: string;
	// Multiple image sizes for progressive loading (like Unsplash)
	thumbnailUrl?: string; // Small thumbnail for blur-up effect
	smallUrl?: string; // Small size for grid view
	regularUrl?: string; // Regular size for detail view
	// imageCategory can be a string (legacy) or populated Category object
	imageCategory: string | Category;
	uploadedBy: User;
	location?: string;
	cameraModel?: string;
	createdAt: string;
	updatedAt: string;
}
