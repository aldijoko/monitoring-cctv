import { apiGet, apiPost, apiPatch, apiDelete } from './client';
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
	return apiGet<CameraListResponse>('/cameras', {
		edge_id: params?.edge_id,
		status: params?.status,
		q: params?.q
	});
}

export async function getCamera(id: number): Promise<LiveCamera> {
	return apiGet<LiveCamera>(`/cameras/${id}`);
}

export async function updateCamera(id: number, patch: Partial<LiveCamera>): Promise<LiveCamera> {
	return apiPatch<LiveCamera>(`/cameras/${id}`, patch);
}

export async function deleteCamera(id: number): Promise<void> {
	return apiDelete(`/cameras/${id}`);
}

export interface CameraFormPayload {
	edge_id: number;
	name: string;
	channel: number;
	/** RTSP source yang di-pull backend (mis. rtsp://user:pass@host:port/path). */
	source_url: string;
	stream_protocol: 'hls' | 'webrtc' | 'mjpeg';
	resolution: string;
	fps: number;
	codec: string;
	storage_days: number;
	enabled: boolean;
}

export async function createCamera(payload: CameraFormPayload): Promise<LiveCamera> {
	return apiPost<LiveCamera, CameraFormPayload>('/cameras', payload);
}
