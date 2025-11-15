import api from '@/lib/axios';

export const userService = {
	changePassword: async (
		password: string,
		newPassword: string,
		newPasswordMatch: string
	) => {
		const res = await api.put(
			'/users/change-password',
			{
				password,
				newPassword,
				newPasswordMatch,
			},
			{ withCredentials: true }
		);
		return res.data;
	},
};
