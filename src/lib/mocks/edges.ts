import { browser } from '$app/environment';
import type { Edge, Paginated } from '$lib/types/api';

const STORAGE_KEY = 'cctv.mock.edges';
const LATENCY = 250; // ms — simulasi network

function delay<T>(value: T, ms = LATENCY): Promise<T> {
	return new Promise((r) => setTimeout(() => r(value), ms));
}

function nowIso() {
	return new Date().toISOString();
}

function seed(): Edge[] {
	return [
		{
			id: 1,
			tenant_id: 1,
			code: 'KPL-119',
			name: 'Pelni Pusat - Lobby Utama',
			hostname: 'cctv-pusat-01',
			ip_address: '192.168.1.10',
			status: 'online',
			last_heartbeat: nowIso(),
			created_at: '2026-04-12T08:00:00Z'
		},
		{
			id: 2,
			tenant_id: 1,
			code: 'KPL-204',
			name: 'Pelni Pusat - Parkiran Timur',
			hostname: 'cctv-pusat-02',
			ip_address: '192.168.1.11',
			status: 'online',
			last_heartbeat: nowIso(),
			created_at: '2026-04-15T08:00:00Z'
		},
		{
			id: 3,
			tenant_id: 1,
			code: 'KPL-318',
			name: 'Cabang Surabaya - Pintu Masuk',
			hostname: 'cctv-sby-01',
			ip_address: '10.20.30.40',
			status: 'offline',
			last_heartbeat: '2026-06-02T14:22:00Z',
			created_at: '2026-05-01T08:00:00Z'
		},
		{
			id: 4,
			tenant_id: 1,
			code: 'KPL-401',
			name: 'Cabang Makassar - Gudang',
			hostname: 'cctv-mks-01',
			ip_address: '10.30.40.50',
			status: 'pending',
			last_heartbeat: undefined,
			created_at: '2026-06-01T08:00:00Z'
		},
		{
			id: 5,
			tenant_id: 1,
			code: 'KPL-512',
			name: 'Pelni Pusat - Ruang Server',
			hostname: 'cctv-pusat-03',
			ip_address: '192.168.1.12',
			status: 'online',
			last_heartbeat: nowIso(),
			created_at: '2026-03-20T08:00:00Z'
		}
	];
}

let cache: Edge[] | null = null;

function load(): Edge[] {
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
		cache = JSON.parse(raw) as Edge[];
		return cache;
	} catch {
		cache = seed();
		return cache;
	}
}

function save(list: Edge[]) {
	cache = list;
	if (browser) {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
	}
}

function nextId(list: Edge[]): number {
	return list.length === 0 ? 1 : Math.max(...list.map((e) => e.id)) + 1;
}

function genCode(list: Edge[]): string {
	const n = list.length + 100 + Math.floor(Math.random() * 900);
	return `KPL-${n}`;
}

export interface ListParams {
	search?: string;
	status?: Edge['status'] | 'all';
	limit?: number;
	offset?: number;
	sort?: 'code' | 'name' | 'status' | 'created_at' | 'last_heartbeat';
	order?: 'asc' | 'desc';
}

export const edgesMock = {
	async list(params: ListParams = {}): Promise<Paginated<Edge>> {
		const { search = '', status = 'all', limit = 10, offset = 0, sort = 'created_at', order = 'desc' } = params;
		const all = load();

		let filtered = all;
		if (search) {
			const q = search.toLowerCase();
			filtered = filtered.filter(
				(e) =>
					e.code.toLowerCase().includes(q) ||
					e.name.toLowerCase().includes(q) ||
					(e.hostname ?? '').toLowerCase().includes(q) ||
					(e.ip_address ?? '').toLowerCase().includes(q)
			);
		}
		if (status !== 'all') {
			filtered = filtered.filter((e) => e.status === status);
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

	async get(id: number): Promise<Edge | null> {
		const e = load().find((x) => x.id === id);
		return delay(e ?? null);
	},

	async create(data: { name: string; hostname?: string; ip_address?: string }): Promise<Edge> {
		const list = load();
		const newEdge: Edge = {
			id: nextId(list),
			code: genCode(list),
			name: data.name,
			hostname: data.hostname,
			ip_address: data.ip_address,
			status: 'pending',
			created_at: nowIso()
		};
		save([newEdge, ...list]);
		return delay(newEdge);
	},

	async update(id: number, data: { name: string; hostname?: string; ip_address?: string }): Promise<Edge> {
		const list = load();
		const idx = list.findIndex((e) => e.id === id);
		if (idx === -1) throw new Error('Edge tidak ditemukan');
		const updated: Edge = {
			...list[idx],
			name: data.name,
			hostname: data.hostname,
			ip_address: data.ip_address
		};
		list[idx] = updated;
		save(list);
		return delay(updated);
	},

	async remove(id: number): Promise<void> {
		const list = load();
		save(list.filter((e) => e.id !== id));
		return delay(undefined);
	},

	async reset(): Promise<void> {
		save(seed());
		return delay(undefined);
	}
};
