import type { User, UserRole, Paginated } from '$lib/types/api';
import { usersMock, type UserListParams } from '$lib/mocks/users';

export type { User, UserRole } from '$lib/types/api';

/**
 * Users API client.
 *
 * Saat ini masih menggunakan mock data di-memory + localStorage.
 * Untuk produksi, ganti body fungsi di bawah dengan `request<...>('/admin/users', ...)`.
 * Signature & return type dijaga identik agar swap hanya di satu tempat.
 */

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
		return usersMock.list(params);
	},

	get(id: number): Promise<User | null> {
		return usersMock.get(id);
	},

	create(data: UserFormData): Promise<User> {
		return usersMock.create(data);
	},

	update(id: number, data: UserUpdateData): Promise<User> {
		return usersMock.update(id, data);
	},

	remove(id: number): Promise<void> {
		return usersMock.remove(id);
	},

	setActive(id: number, is_active: boolean): Promise<User> {
		return usersMock.setActive(id, is_active);
	},

	resetPassword(id: number): Promise<{ temporary_password: string }> {
		return usersMock.resetPassword(id);
	},

	reset(): Promise<void> {
		return usersMock.reset();
	}
};
