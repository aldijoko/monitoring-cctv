import { browser } from '$app/environment';
import type { Paginated, Recording } from '$lib/types/api';

const STORAGE_KEY = 'cctv.mock.recordings';
const LATENCY = 250; // ms

function delay<T>(value: T, ms = LATENCY): Promise<T> {
	return new Promise((r) => setTimeout(() => r(value), ms));
}

interface SeedInput {
	id: number;
	edge_id: number;
	edge_code: string;
	camera_id: number;
	camera_name: string;
	hours_ago: number;
	duration_seconds: number;
	size_mb: number;
}

function isoMinusHours(h: number): string {
	return new Date(Date.now() - h * 3600 * 1000).toISOString();
}

function seed(): Recording[] {
	const inputs: SeedInput[] = [
		// KPL-119 — 4 cameras
		{ id: 1, edge_id: 1, edge_code: 'KPL-119', camera_id: 1, camera_name: 'Lobby Utama', hours_ago: 1, duration_seconds: 3600, size_mb: 240 },
		{ id: 2, edge_id: 1, edge_code: 'KPL-119', camera_id: 1, camera_name: 'Lobby Utama', hours_ago: 2, duration_seconds: 3600, size_mb: 235 },
		{ id: 3, edge_id: 1, edge_code: 'KPL-119', camera_id: 2, camera_name: 'Resepsionis', hours_ago: 1, duration_seconds: 3600, size_mb: 180 },
		{ id: 4, edge_id: 1, edge_code: 'KPL-119', camera_id: 2, camera_name: 'Resepsionis', hours_ago: 5, duration_seconds: 3600, size_mb: 175 },
		{ id: 5, edge_id: 1, edge_code: 'KPL-119', camera_id: 3, camera_name: 'Ruang Tunggu', hours_ago: 3, duration_seconds: 3600, size_mb: 220 },
		{ id: 6, edge_id: 1, edge_code: 'KPL-119', camera_id: 4, camera_name: 'Pintu Belakang', hours_ago: 8, duration_seconds: 3600, size_mb: 250 },
		// KPL-204 — 2 cameras
		{ id: 7, edge_id: 2, edge_code: 'KPL-204', camera_id: 5, camera_name: 'Parkiran Timur', hours_ago: 2, duration_seconds: 3600, size_mb: 195 },
		{ id: 8, edge_id: 2, edge_code: 'KPL-204', camera_id: 5, camera_name: 'Parkiran Timur', hours_ago: 12, duration_seconds: 3600, size_mb: 200 },
		{ id: 9, edge_id: 2, edge_code: 'KPL-204', camera_id: 6, camera_name: 'Pos Satpam', hours_ago: 4, duration_seconds: 3600, size_mb: 165 },
		// KPL-318 — 1 camera
		{ id: 10, edge_id: 3, edge_code: 'KPL-318', camera_id: 7, camera_name: 'Pintu Masuk SBY', hours_ago: 6, duration_seconds: 3600, size_mb: 185 },
		{ id: 11, edge_id: 3, edge_code: 'KPL-318', camera_id: 7, camera_name: 'Pintu Masuk SBY', hours_ago: 18, duration_seconds: 3600, size_mb: 190 },
		// KPL-512 — 3 cameras
		{ id: 12, edge_id: 5, edge_code: 'KPL-512', camera_id: 8, camera_name: 'Ruang Server A', hours_ago: 1, duration_seconds: 3600, size_mb: 145 },
		{ id: 13, edge_id: 5, edge_code: 'KPL-512', camera_id: 8, camera_name: 'Ruang Server A', hours_ago: 7, duration_seconds: 3600, size_mb: 150 },
		{ id: 14, edge_id: 5, edge_code: 'KPL-512', camera_id: 9, camera_name: 'Ruang Server B', hours_ago: 1, duration_seconds: 3600, size_mb: 140 },
		{ id: 15, edge_id: 5, edge_code: 'KPL-512', camera_id: 10, camera_name: 'Koridor', hours_ago: 9, duration_seconds: 3600, size_mb: 155 },
		{ id: 16, edge_id: 1, edge_code: 'KPL-119', camera_id: 1, camera_name: 'Lobby Utama', hours_ago: 24, duration_seconds: 3600, size_mb: 245 },
		{ id: 17, edge_id: 1, edge_code: 'KPL-119', camera_id: 2, camera_name: 'Resepsionis', hours_ago: 24, duration_seconds: 3600, size_mb: 182 },
		{ id: 18, edge_id: 2, edge_code: 'KPL-204', camera_id: 5, camera_name: 'Parkiran Timur', hours_ago: 36, duration_seconds: 3600, size_mb: 198 }
	];

	return inputs.map((i) => {
		const started = isoMinusHours(i.hours_ago);
		const ended = new Date(new Date(started).getTime() + i.duration_seconds * 1000).toISOString();
		const startCompact = started.replace(/[-:T.Z]/g, '').slice(0, 14);
		return {
			id: i.id,
			edge_id: i.edge_id,
			edge_code: i.edge_code,
			camera_id: i.camera_id,
			camera_name: i.camera_name,
			filename: `${i.edge_code}_cam${i.camera_id}_${startCompact}.mp4`,
			started_at: started,
			ended_at: ended,
			size_bytes: i.size_mb * 1024 * 1024,
			duration_seconds: i.duration_seconds,
			storage_path: `/var/lib/cctv-${i.edge_code.toLowerCase()}/recordings/`,
			thumbnail_url: undefined,
			playback_url: `/api/v1/recordings/${i.id}/playback.m3u8`
		};
	});
}

let cache: Recording[] | null = null;

function load(): Recording[] {
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
		cache = JSON.parse(raw) as Recording[];
		return cache;
	} catch {
		cache = seed();
		return cache;
	}
}

function save(list: Recording[]) {
	cache = list;
	if (browser) {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
	}
}

export interface ListParams {
	search?: string;
	edge_id?: number | 'all';
	camera_id?: number | 'all';
	date_from?: string;
	date_to?: string;
	limit?: number;
	offset?: number;
	sort?: 'started_at' | 'size_bytes' | 'duration_seconds' | 'edge_code';
	order?: 'asc' | 'desc';
}

export interface CameraOption {
	id: number;
	name: string;
	edge_id: number;
	edge_code: string;
}

export const recordingsMock = {
	async list(params: ListParams = {}): Promise<Paginated<Recording>> {
		const {
			search = '',
			edge_id = 'all',
			camera_id = 'all',
			date_from,
			date_to,
			limit = 10,
			offset = 0,
			sort = 'started_at',
			order = 'desc'
		} = params;
		const all = load();

		let filtered = all;
		if (search) {
			const q = search.toLowerCase();
			filtered = filtered.filter(
				(r) =>
					r.filename.toLowerCase().includes(q) ||
					r.edge_code.toLowerCase().includes(q) ||
					r.camera_name.toLowerCase().includes(q)
			);
		}
		if (edge_id !== 'all') {
			filtered = filtered.filter((r) => r.edge_id === edge_id);
		}
		if (camera_id !== 'all') {
			filtered = filtered.filter((r) => r.camera_id === camera_id);
		}
		if (date_from) {
			const from = new Date(date_from).getTime();
			filtered = filtered.filter((r) => new Date(r.started_at).getTime() >= from);
		}
		if (date_to) {
			const to = new Date(date_to).getTime();
			filtered = filtered.filter((r) => new Date(r.started_at).getTime() <= to);
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

	async get(id: number): Promise<Recording | null> {
		const r = load().find((x) => x.id === id);
		return delay(r ?? null);
	},

	async cameras(): Promise<CameraOption[]> {
		const map = new Map<string, CameraOption>();
		for (const r of load()) {
			const key = `${r.edge_id}-${r.camera_id}`;
			if (!map.has(key)) {
				map.set(key, {
					id: r.camera_id,
					name: r.camera_name,
					edge_id: r.edge_id,
					edge_code: r.edge_code
				});
			}
		}
		return delay(Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name)));
	},

	async archiveBulk(
		ids: number[],
		format: 'mp4' | 'zip'
	): Promise<{ archive_url: string; size_bytes: number; expires_at: string; item_count: number }> {
		const all = load();
		const items = all.filter((r) => ids.includes(r.id));
		if (items.length === 0) {
			throw new Error('Tidak ada recording yang dipilih');
		}
		const size = items.reduce((s, r) => s + r.size_bytes, 0);
		return delay({
			archive_url: `/api/v1/recordings/archive-bulk/download?token=mock-${Date.now()}&format=${format}`,
			size_bytes: size,
			expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
			item_count: items.length
		});
	},

	async reset(): Promise<void> {
		save(seed());
		return delay(undefined);
	}
};
