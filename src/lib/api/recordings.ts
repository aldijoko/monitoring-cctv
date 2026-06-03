import { recordingsMock, type ListParams, type CameraOption } from '$lib/mocks/recordings';
import type { Paginated, Recording } from '$lib/types/api';

export interface ArchiveResult {
	archive_url: string;
	size_bytes: number;
	expires_at: string;
	item_count: number;
}

export const recordingsApi = {
	list(params?: ListParams): Promise<Paginated<Recording>> {
		return recordingsMock.list(params);
	},
	get(id: number): Promise<Recording | null> {
		return recordingsMock.get(id);
	},
	cameras(): Promise<CameraOption[]> {
		return recordingsMock.cameras();
	},
	archiveBulk(ids: number[], format: 'mp4' | 'zip' = 'mp4'): Promise<ArchiveResult> {
		return recordingsMock.archiveBulk(ids, format);
	}
};
