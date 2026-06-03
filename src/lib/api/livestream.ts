import { apiGet, apiPost } from './client';
import type {
	StreamInfo,
	LivestreamToken,
	LiveLayout,
	EdgeStatus,
	Camera
} from '$lib/types/livestream';
import { mockStreams, mockLiveLayouts, mockEdgeStatus, mockCameras } from '$lib/mocks/livestream';

const USE_MOCK = true;

export async function getStreams(edgeId?: string): Promise<StreamInfo[]> {
	if (USE_MOCK) {
		await new Promise((r) => setTimeout(r, 200));
		return edgeId ? mockStreams.filter((s) => s.edge_id === edgeId) : mockStreams;
	}
	const q = edgeId ? { edge_id: edgeId } : undefined;
	return apiGet<StreamInfo[]>('/api/v1/admin/streams', q);
}

export async function getStream(streamId: string): Promise<StreamInfo> {
	if (USE_MOCK) {
		await new Promise((r) => setTimeout(r, 200));
		const stream = mockStreams.find((s) => s.id === streamId);
		if (!stream) throw new Error(`Stream ${streamId} not found`);
		return stream;
	}
	return apiGet<StreamInfo>(`/api/v1/admin/streams/${streamId}`);
}

export async function getLivestreamToken(streamId: string): Promise<LivestreamToken> {
	if (USE_MOCK) {
		await new Promise((r) => setTimeout(r, 150));
		return mockLivestreamToken;
	}
	return apiPost<LivestreamToken>(`/api/v1/livestream/${streamId}/token`);
}

export async function getLiveLayouts(): Promise<LiveLayout[]> {
	if (USE_MOCK) return mockLiveLayouts;
	return apiGet<LiveLayout[]>('/api/v1/admin/livestream/layouts');
}

export async function saveLiveLayouts(layouts: LiveLayout[]): Promise<LiveLayout[]> {
	if (USE_MOCK) return layouts;
	return apiPost<LiveLayout[]>('/api/v1/admin/livestream/layouts', { layouts });
}

export async function getEdgeStatus(): Promise<EdgeStatus[]> {
	if (USE_MOCK) {
		await new Promise((r) => setTimeout(r, 200));
		return mockEdgeStatus;
	}
	return apiGet<EdgeStatus[]>('/api/v1/admin/edges/status');
}

export async function getCameras(edgeId?: string): Promise<Camera[]> {
	if (USE_MOCK) {
		await new Promise((r) => setTimeout(r, 200));
		return edgeId ? mockCameras.filter((c) => c.edge_id === edgeId) : mockCameras;
	}
	const q = edgeId ? { edge_id: edgeId } : undefined;
	return apiGet<Camera[]>('/api/v1/admin/cameras', q);
}
