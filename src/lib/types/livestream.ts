/**
 * Live streaming types — mirrors /api/v1/livestream and /api/v1/admin/streams
 * plus edge /api/v1/status shape.
 */

export type StreamStatus = 'online' | 'offline' | 'connecting' | 'error';
export type StreamProtocol = 'hls' | 'webrtc' | 'rtsp' | 'mjpeg';

export interface StreamInfo {
	id: string;
	edge_id: string;
	edge_name: string;
	camera_id: string;
	camera_name: string;
	location?: string;
	protocol: StreamProtocol;
	stream_url: string;
	webrtc_url?: string;
	thumbnail_url?: string;
	status: StreamStatus;
	viewers: number;
	resolution?: string;
	fps?: number;
	bitrate_kbps?: number;
	codec?: string;
	started_at?: string;
	last_frame_at?: string;
}

export interface LivestreamToken {
	token: string;
	expires_at: string;
	stream_url: string;
	webrtc_url?: string;
	ttl_seconds: number;
}

export interface LiveLayout {
	id: string;
	name: string;
	columns: number;
	rows: number;
}

export interface EdgeStatus {
	edge_id: string;
	edge_name: string;
	online: boolean;
	cpu_pct: number;
	mem_pct: number;
	disk_pct: number;
	uptime_pct: number;
	days_online: number;
	days_no_heartbeat: number;
	camera_count: number;
	cameras_online: number;
	location?: string;
	updated_at: string;
}

export interface Camera {
	id: string;
	edge_id: string;
	edge_name: string;
	name: string;
	location?: string;
	rtsp_url: string;
	username?: string;
	password?: string;
	enabled: boolean;
	recording_enabled: boolean;
	resolution?: string;
	fps?: number;
	has_audio: boolean;
}
