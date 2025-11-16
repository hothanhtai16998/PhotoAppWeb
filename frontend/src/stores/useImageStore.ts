import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { toast } from 'sonner';
import { imageService } from '@/services/imageService';
import type {
	ImageState,
	UploadImageData,
} from '@/types/store';

export const useImageStore = create(
	immer<ImageState>((set) => ({
		images: [],
		loading: false,
		error: null,
		pagination: null,
		uploadProgress: 0,
		uploadImage: async (
			data: UploadImageData
		) => {
			set((state) => {
				state.loading = true;
				state.error = null;
				state.uploadProgress = 0;
			});
			try {
				const response =
					await imageService.uploadImage(
						data,
						(progress) => {
							set((state) => {
								// Progress tracks HTTP upload (0-90%)
								state.uploadProgress = progress;
							});
						}
					);
				// HTTP upload to backend complete (85%)
				// Now backend is uploading to Cloudinary - show 85-95% range
				set((state) => {
					state.uploadProgress = 90; // Show we're processing
				});
				
				// Backend response received = Cloudinary upload AND processing complete
				// The response only comes after Cloudinary finishes
				set((state) => {
					state.images.unshift(
						response.image
					);
					// Now set to 100% - everything is complete
					state.uploadProgress = 100;
					state.loading = false;
				});
				toast.success(
					'Image uploaded successfully!'
				);
			} catch (error: unknown) {
				const message =
					(
						error as {
							response?: {
								data?: {
									message?: string;
								};
							};
						}
					)?.response?.data?.message ||
					'Failed to upload image. Please try again.';
				set((state) => {
					state.loading = false;
					state.error = message;
					state.uploadProgress = 0;
				});
				toast.error(message);
			}
		},
		fetchImages: async (params?: {
			page?: number;
			limit?: number;
			search?: string;
			category?: string;
		}) => {
			set((state) => {
				state.loading = true;
				state.error = null;
			});
			try {
				const response =
					await imageService.fetchImages(
						params
					);
				set((state) => {
					// Handle both array response and object with images property
					if (Array.isArray(response)) {
						state.images = response;
						state.pagination = null;
					} else {
						state.images =
							response.images || [];
						state.pagination =
							response.pagination ||
							null;
					}
					state.loading = false;
				});
			} catch (error: unknown) {
				const message =
					(
						error as {
							response?: {
								data?: {
									message?: string;
								};
							};
						}
					)?.response?.data?.message ||
					'Failed to fetch images. Please try again.';
				set((state) => {
					state.loading = false;
					state.error = message;
				});
				toast.error(message);
			}
		},
	}))
);
