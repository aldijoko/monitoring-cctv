import { apiGet, apiPatch, apiDelete } from './client';
import { USE_MOCKS } from '$lib/mocks/config';
import { delay, mockCameras } from '$lib/mocks/live';
import type { LiveCamera } from '$lib/types/api';

export interface CameraListResponse {
	cameras: LiveCamera[];
	total: number;
}

export interface CameraFilters {
	edge_id?: number;
	status?: string;
	q?: string;
}

export async function listCameras(params?: CameraFilters): Promise<CameraListResponse> {
	if (USE_MOCKS) {
		await delay(200);
		let result = [...mockCameras];
		if (params?.edge_id !== undefined) result = result.filter((c) => c.edge_id === params.edge_id);
		if (params?.status) result = result.filter((c) => c.status === params.status);
		if (params?.q) {
			const q = params.q.toLowerCase();
			result = result.filter(
				(c) => c.name.toLowerCase().includes(q) || c.edge_name.toLowerCase().includes(q)
			);
		}
		return { cameras: result, total: result.length };
	}
	return apiGet<CameraListResponse>('/api/v1/cameras', {
		edge_id: params?.edge_id,
		status: params?.status,
		q: params?.q
	});
}

export async function getCamera(id: number): Promise<LiveCamera> {
	if (USE_MOCKS) {
		await delay(150);
		const cam = mockCameras.find((c) => c.id === id);
		if (!cam) throw new Error('Kamera tidak ditemukan');
		return cam;
	}
	return apiGet<LiveCamera>(`/api/v1/cameras/${id}`);
}

export async function updateCamera(id: number, patch: Partial<LiveCamera>): Promise<LiveCamera> {
	if (USE_MOCKS) {
		await delay(150);
		const idx = mockCameras.findIndex((c) => c.id === id);
		if (idx === -1) throw new Error('Kamera tidak ditemukan');
		mockCameras[idx] = { ...mockCameras[idx], ...patch };
		return mockCameras[idx];
	}
	return apiPatch<LiveCamera>(`/api/v1/cameras/${id}`, patch);
}

export async function deleteCamera(id: number): Promise<void> {
	if (USE_MOCKS) {
		await delay(150);
		const idx = mockCameras.findIndex((c) => c.id === id);
		if (idx !== -1) mockCameras.splice(idx, 1);
		return;
	}
	return apiDelete(`/api/v1/cameras/${id}`);
}

export interface CameraFormPayload {
	edge_id: number;
	name: string;
	channel: number;
	stream_url: string;
	stream_protocol: 'hls' | 'webrtc' | 'mjpeg';
	resolution: string;
	fps: number;
	codec: string;
	storage_days: number;
	enabled: boolean;
}

export async function createCamera(payload: CameraFormPayload): Promise<LiveCamera> {
	if (USE_MOCKS) {
		await delay(200);
		const next = mockCameras.reduce((m, c) => Math.max(m, c.id), 0) + 1;
		const newCam: LiveCamera = {
			id: next,
			edge_code: '',
			edge_name: '',
			last_seen_at: new Date().toISOString(),
			created_at: new Date().toISOString(),
			status: 'offline',
			...payload
		};
		mockCameras.push(newCam);
		return newCam;
	}
	const { apiPost } = await import('./client');
	return apiPost<Camera, CameraFormPayload>('/api/v1/cameras', payload);
}
