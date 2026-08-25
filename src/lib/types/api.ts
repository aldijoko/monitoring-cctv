export type UserRole = 'superadmin' | 'admin' | 'viewer';

export interface User {
	id: number;
	username: string;
	email?: string;
	role: UserRole;
	is_active: boolean;
	created_at: string;
}

export interface LoginRequest {
	username: string;
	password: string;
}

export interface LoginResponse {
	access_token: string;
	refresh_token: string;
	user: User;
}

export interface Edge {
	id: number;
	code: string;
	name: string;
	hostname?: string;
	ip_address?: string;
	location?: string;
	camera_count?: number;
	last_camera_uptime?: string;
	status: 'online' | 'offline' | 'pending';
	last_heartbeat?: string;
	created_at: string;
}

export interface Camera {
	id: number;
	edge_id: number;
	name: string;
	rtsp_url?: string;
	enabled: boolean;
	record_enabled: boolean;
	retention_days: number;
}

export type CameraStatus = 'online' | 'offline' | 'recording' | 'error';
export type StreamProtocol = 'hls' | 'webrtc' | 'mjpeg';

export interface LiveCamera {
	id: number;
	edge_id: number;
	edge_code: string;
	edge_name: string;
	name: string;
	channel: number;
	/** RTSP source dikonfigurasi admin, tidak pernah dikirim ke browser. */
	source_url?: string;
	/** URL HLS hasil transcode (mediamtx), inilah yang diputar frontend. */
	stream_url: string;
	stream_protocol: StreamProtocol;
	resolution: string;
	fps: number;
	codec: string;
	storage_days: number;
	status: CameraStatus;
	enabled: boolean;
	last_seen_at: string | null;
	created_at: string;
}

export interface Tile {
	id: string;
	camera_id: number;
	camera_name: string;
	edge_name: string;
	stream_url: string;
	stream_protocol: StreamProtocol;
	muted: boolean;
}

export type GridSize = 1 | 2 | 4 | 6 | 9 | 12 | 16;

export interface GridConfig {
	size: GridSize;
	columns: number;
	label: string;
}

export const GRID_PRESETS: GridConfig[] = [
	{ size: 1, columns: 1, label: '1×1' },
	{ size: 2, columns: 2, label: '2×1' },
	{ size: 4, columns: 2, label: '2×2' },
	{ size: 6, columns: 3, label: '3×2' },
	{ size: 9, columns: 3, label: '3×3' },
	{ size: 12, columns: 4, label: '4×3' },
	{ size: 16, columns: 4, label: '4×4' }
];

export interface Recording {
	id: number;
	edge_id: number;
	edge_code: string;
	camera_id: number;
	camera_name: string;
	filename: string;
	started_at: string;
	ended_at: string;
	size_bytes: number;
	storage_path?: string;
	duration_seconds?: number;
	thumbnail_url?: string;
	playback_url?: string;
}

export interface DashboardSummary {
	total_edges: number;
	online_edges: number;
	offline_edges: number;
	pending_edges: number;
	total_cameras: number;
	active_cameras: number;
	storage_used_bytes: number;
	storage_total_bytes: number;
	uptime_avg: number;
}

export interface StorageReport {
	edge_id: number;
	edge_name: string;
	edge_code: string;
	used_bytes: number;
	total_bytes: number;
	recordings_count: number;
	last_recording_at?: string;
}

export interface Paginated<T> {
	items: T[];
	total: number;
	limit: number;
	offset: number;
}

export interface ApiError {
	code: string;
	message: string;
	details?: Record<string, string>;
}
