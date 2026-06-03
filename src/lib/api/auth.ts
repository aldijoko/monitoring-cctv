import { request } from './client';
import type { LoginRequest, LoginResponse } from '$lib/types/api';

export const authApi = {
	login: (data: LoginRequest) =>
		request<LoginResponse>('/auth/login', { method: 'POST', body: data }),

	logout: () => request<void>('/auth/logout', { method: 'POST' }),

	refresh: (refresh_token: string) =>
		request<{ access_token: string; refresh_token: string }>('/auth/refresh', {
			method: 'POST',
			body: { refresh_token }
		})
};
