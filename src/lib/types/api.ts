export type UserRole = 'admin' | 'operator' | 'viewer';

export interface User {
	id: number;
	username: string;
	email?: string;
	role: UserRole;
	tenant_id: number;
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
