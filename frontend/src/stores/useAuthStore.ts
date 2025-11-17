import { create } from 'zustand';
import { toast } from 'sonner';
import { authService } from '@/services/authService';
import type { AuthState } from '@/types/store';

export const useAuthStore =
	create<AuthState>((set, get) => ({
		accessToken: null,
		user: null,
		loading: false,
		isInitializing: true,

		setAccessToken: (accessToken) => {
			set({ accessToken });
		},
		clearState: () => {
			set({
				accessToken: null,
				user: null,
				loading: false,
			});
		},

		signUp: async (
			username,
			password,
			email,
			firstName,
			lastName,
			phone,
			bio
		) => {
			try {
				set({ loading: true });

				//  gọi api
				await authService.signUp(
					username,
					password,
					email,
					firstName,
					lastName,
					phone,
					bio
				);

				toast.success(
					'Đăng ký thành công! Bạn sẽ được chuyển sang trang đăng nhập.'
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
					'Registration failed. Please try again.';
				toast.error(message);
			} finally {
				set({ loading: false });
			}
		},

		signIn: async (
			username,
			password
		) => {
			try {
				set({ loading: true });

				const response =
					await authService.signIn(
						username,
						password
					);

				// Set access token
				if (response.accessToken) {
					get().setAccessToken(
						response.accessToken
					);
				}

				// Set user if provided in response, otherwise fetch it
				if (response.user) {
					set({ user: response.user });
				} else {
					await get().fetchMe();
				}

				toast.success(
					'Chào mừng bạn quay lại với Moji 🎉'
				);
			} catch (error: unknown) {
				const errorResponse = error as {
					response?: {
						data?: {
							message?: string;
							errors?: Array<{
								msg?: string;
								message?: string;
							}>;
						};
					};
				};

				// Handle validation errors (express-validator format)
				if (
					errorResponse.response?.data
						?.errors &&
					Array.isArray(
						errorResponse.response.data
							.errors
					)
				) {
					const validationErrors =
						errorResponse.response.data.errors
							.map(
								(err: {
									msg?: string;
									message?: string;
								}) =>
									err.msg ||
									err.message ||
									'Validation failed'
							)
							.join(', ');
					toast.error(
						`Validation error: ${validationErrors}`
					);
				} else {
					const message =
						errorResponse.response?.data
							?.message ||
						'Login failed. Please check your credentials.';
					toast.error(message);
				}
				// Re-throw error so form can handle navigation
				throw error;
			} finally {
				set({ loading: false });
			}
		},

		signOut: async () => {
			try {
				get().clearState();
				await authService.signOut();
				toast.success(
					'Logout thành công!'
				);
			} catch {
				// Don't show error toast on logout failure
				// User is already logged out locally
				// Log error silently
			}
		},

		fetchMe: async () => {
			try {
				set({ loading: true });
				const user =
					await authService.fetchMe();

				set({ user });
			} catch {
				set({
					user: null,
					accessToken: null,
				});
				// Don't show error toast on fetchMe failure during initialization
				// It's expected if user is not logged in
			} finally {
				set({ loading: false });
			}
		},

		refresh: async () => {
			try {
				const {
					user,
					fetchMe,
					setAccessToken,
				} = get();
				const accessToken =
					await authService.refresh();

				setAccessToken(accessToken);

				if (!user) {
					await fetchMe();
				}
			} catch (error: unknown) {
				const errorStatus = (
					error as {
						response?: {
							status?: number;
						};
					}
				)?.response?.status;
				// Only show error if it's not a 401/403 (expected when not logged in)
				if (
					errorStatus !== 401 &&
					errorStatus !== 403
				) {
					toast.error(
						'Session expired. Please log in again.'
					);
				}
				get().clearState();
			}
		},

		initializeApp: async () => {
			try {
				await get().refresh();
			} catch {
				// Silently handle initialization errors
				// User might not be logged in
			} finally {
				set({ isInitializing: false });
			}
		},
	}));
