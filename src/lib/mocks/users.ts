import { browser } from '$app/environment';
import type { User, UserRole, Paginated } from '$lib/types/api';

const STORAGE_KEY = 'cctv.mock.users';
const LATENCY = 250;

function delay<T>(value: T, ms = LATENCY): Promise<T> {
	return new Promise((r) => setTimeout(() => r(value), ms));
}

function nowIso() {
	return new Date().toISOString();
}

function seed(): User[] {
	return [
		{
			id: 1,
			username: 'admin',
			email: 'admin@pelni.co.id',
			role: 'admin',
			tenant_id: 1,
			is_active: true,
			created_at: '2026-01-15T08:00:00Z'
		},
		{
			id: 2,
			username: 'operator-jkt',
			email: 'jakarta@pelni.co.id',
			role: 'operator',
			tenant_id: 1,
			is_active: true,
			created_at: '2026-02-10T08:00:00Z'
		},
		{
			id: 3,
			username: 'operator-sby',
			email: 'surabaya@pelni.co.id',
			role: 'operator',
			tenant_id: 1,
			is_active: true,
			created_at: '2026-03-05T08:00:00Z'
		},
		{
			id: 4,
			username: 'viewer-mks',
			email: 'makassar@pelni.co.id',
			role: 'viewer',
			tenant_id: 1,
			is_active: false,
			created_at: '2026-04-20T08:00:00Z'
		}
	];
}

let cache: User[] | null = null;

function load(): User[] {
	if (cache) return cache;
	if (!browser) {
		cache = seed();
		return cache;
	}
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) {
			cache = seed();
			localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
			return cache;
		}
		cache = JSON.parse(raw) as User[];
		return cache;
	} catch {
		cache = seed();
		return cache;
	}
}

function save(list: User[]) {
	cache = list;
	if (browser) {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
	}
}

function nextId(list: User[]): number {
	return list.length === 0 ? 1 : Math.max(...list.map((u) => u.id)) + 1;
}

export interface UserListParams {
	search?: string;
	role?: UserRole | 'all';
	is_active?: 'all' | 'active' | 'inactive';
	limit?: number;
	offset?: number;
	sort?: 'username' | 'email' | 'role' | 'created_at';
	order?: 'asc' | 'desc';
}

export const usersMock = {
	async list(params: UserListParams = {}): Promise<Paginated<User>> {
		const {
			search = '',
			role = 'all',
			is_active = 'all',
			limit = 10,
			offset = 0,
			sort = 'created_at',
			order = 'desc'
		} = params;
		const all = load();

		let filtered = all;
		if (search) {
			const q = search.toLowerCase();
			filtered = filtered.filter(
				(u) =>
					u.username.toLowerCase().includes(q) || (u.email ?? '').toLowerCase().includes(q)
			);
		}
		if (role !== 'all') {
			filtered = filtered.filter((u) => u.role === role);
		}
		if (is_active !== 'all') {
			const target = is_active === 'active';
			filtered = filtered.filter((u) => u.is_active === target);
		}

		filtered = [...filtered].sort((a, b) => {
			const va = a[sort] ?? '';
			const vb = b[sort] ?? '';
			if (va < vb) return order === 'asc' ? -1 : 1;
			if (va > vb) return order === 'asc' ? 1 : -1;
			return 0;
		});

		const items = filtered.slice(offset, offset + limit);
		return delay({ items, total: filtered.length, limit, offset });
	},

	async get(id: number): Promise<User | null> {
		const u = load().find((x) => x.id === id);
		return delay(u ?? null);
	},

	async create(data: {
		username: string;
		email?: string;
		role: UserRole;
		password: string;
		is_active?: boolean;
	}): Promise<User> {
		const list = load();
		const uname = data.username.trim().toLowerCase();
		if (list.some((u) => u.username.toLowerCase() === uname)) {
			throw new Error('Username sudah digunakan');
		}
		const newUser: User = {
			id: nextId(list),
			username: data.username.trim(),
			email: data.email?.trim() || undefined,
			role: data.role,
			tenant_id: 1,
			is_active: data.is_active ?? true,
			created_at: nowIso()
		};
		save([newUser, ...list]);
		return delay(newUser);
	},

	async update(
		id: number,
		data: { email?: string; role: UserRole; is_active: boolean }
	): Promise<User> {
		const list = load();
		const idx = list.findIndex((u) => u.id === id);
		if (idx === -1) throw new Error('User tidak ditemukan');
		const updated: User = {
			...list[idx],
			email: data.email?.trim() || undefined,
			role: data.role,
			is_active: data.is_active
		};
		list[idx] = updated;
		save(list);
		return delay(updated);
	},

	async remove(id: number): Promise<void> {
		const list = load();
		const target = list.find((u) => u.id === id);
		if (target?.username === 'admin') {
			throw new Error('User admin tidak dapat dihapus');
		}
		save(list.filter((u) => u.id !== id));
		return delay(undefined);
	},

	async setActive(id: number, is_active: boolean): Promise<User> {
		const list = load();
		const idx = list.findIndex((u) => u.id === id);
		if (idx === -1) throw new Error('User tidak ditemukan');
		list[idx] = { ...list[idx], is_active };
		save(list);
		return delay(list[idx]);
	},

	async resetPassword(id: number): Promise<{ temporary_password: string }> {
		const list = load();
		const target = list.find((u) => u.id === id);
		if (!target) throw new Error('User tidak ditemukan');
		const tempPwd =
			'CCTV-' + Math.random().toString(36).slice(2, 8).toUpperCase();
		return delay({ temporary_password: tempPwd });
	},

	async reset(): Promise<void> {
		save(seed());
		return delay(undefined);
	}
};
