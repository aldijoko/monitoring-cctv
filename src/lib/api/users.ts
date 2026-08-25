import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from './client';
import type { User, UserRole, Paginated } from '$lib/types/api';

export type { User, UserRole } from '$lib/types/api';

export interface UserListParams {
	search?: string;
	role?: UserRole | 'all';
	is_active?: boolean;
	limit?: number;
	offset?: number;
	sort?: 'username' | 'email' | 'role' | 'created_at';
	order?: 'asc' | 'desc';
}

export interface UserFormData {
	username: string;
	email?: string;
	role: UserRole;
	password: string;
	is_active?: boolean;
}

export interface UserUpdateData {
	email?: string;
	role: UserRole;
	is_active: boolean;
}

export const usersApi = {
	list(params: UserListParams = {}): Promise<Paginated<User>> {
		return apiGet<Paginated<User>>('/users', {
			search: params.search,
			role: params.role === 'all' ? undefined : params.role,
			is_active: params.is_active,
			limit: params.limit,
			offset: params.offset
		});
	},

	get(id: number): Promise<User | null> {
		return apiGet<User>(`/users/${id}`);
	},

	create(data: UserFormData): Promise<User> {
		return apiPost<User, UserFormData>('/users', data);
	},

	update(id: number, data: UserUpdateData): Promise<User> {
		return apiPut<User, UserUpdateData>(`/users/${id}`, data);
	},

	remove(id: number): Promise<void> {
		return apiDelete(`/users/${id}`);
	},

	setActive(id: number, is_active: boolean): Promise<User> {
		return apiPatch<User, { is_active: boolean }>(`/users/${id}/active`, { is_active });
	},

	resetPassword(id: number): Promise<{ temporary_password: string }> {
		return apiPost<{ temporary_password: string }>(`/users/${id}/reset-password`);
	}
};
