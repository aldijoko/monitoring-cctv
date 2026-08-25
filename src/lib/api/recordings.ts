import { apiGet, apiPost } from './client';
import type { Paginated, Recording } from '$lib/types/api';

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

export interface ArchiveResult {
	archive_url: string;
	size_bytes: number;
	expires_at: string;
	item_count: number;
}

export const recordingsApi = {
	list(params?: ListParams): Promise<Paginated<Recording>> {
		return apiGet<Paginated<Recording>>('/recordings', {
			search: params?.search,
			edge_id: params?.edge_id === 'all' ? undefined : params?.edge_id,
			camera_id: params?.camera_id === 'all' ? undefined : params?.camera_id,
			date_from: params?.date_from,
			date_to: params?.date_to,
			limit: params?.limit,
			offset: params?.offset
		});
	},
	get(id: number): Promise<Recording | null> {
		return apiGet<Recording>(`/recordings/${id}`);
	},
	cameras(): Promise<CameraOption[]> {
		return apiGet<CameraOption[]>('/recordings/cameras');
	},
	archiveBulk(ids: number[], format: 'mp4' | 'zip' = 'mp4'): Promise<ArchiveResult> {
		return apiPost<ArchiveResult, { ids: number[]; format: string }>('/recordings/archive-bulk', {
			ids,
			format
		});
	}
};
