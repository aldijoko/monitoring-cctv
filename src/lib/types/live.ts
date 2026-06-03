export type CameraStatus = 'online' | 'offline' | 'recording' | 'error';
export type StreamProtocol = 'hls' | 'webrtc' | 'mjpeg';

export interface Camera {
	id: number;
	edge_id: number;
	edge_code: string;
	edge_name: string;
	name: string;
	channel: number;
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
