import type {
	StreamInfo,
	LivestreamToken,
	LiveLayout,
	EdgeStatus,
	Camera
} from '$lib/types/livestream';

export const mockLiveLayouts: LiveLayout[] = [
	{ id: '1x1', name: 'Single', columns: 1, rows: 1 },
	{ id: '2x2', name: '2×2 Grid', columns: 2, rows: 2 },
	{ id: '3x3', name: '3×3 Grid', columns: 3, rows: 3 },
	{ id: '4x4', name: '4×4 Grid', columns: 4, rows: 4 }
];

export const mockStreams: StreamInfo[] = [
	{
		id: 'cam-kpl-a1',
		edge_id: 'KPL-001',
		edge_name: 'Kantor Pusat Lt.1',
		camera_id: 'cam-a1',
		camera_name: 'Lobby Utama',
		location: 'Lantai 1 — Lobby',
		protocol: 'hls',
		stream_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
		thumbnail_url: '',
		status: 'online',
		viewers: 3,
		resolution: '1920x1080',
		fps: 25,
		bitrate_kbps: 2048,
		codec: 'h264',
		started_at: '2026-06-03T07:00:00Z',
		last_frame_at: '2026-06-03T09:14:12Z'
	},
	{
		id: 'cam-kpl-a2',
		edge_id: 'KPL-001',
		edge_name: 'Kantor Pusat Lt.1',
		camera_id: 'cam-a2',
		camera_name: 'Resepsionis',
		location: 'Lantai 1 — Resepsionis',
		protocol: 'hls',
		stream_url: 'https://test-streams.mux.dev/test_001/stream.m3u8',
		thumbnail_url: '',
		status: 'online',
		viewers: 1,
		resolution: '1280x720',
		fps: 15,
		bitrate_kbps: 1024,
		codec: 'h264',
		started_at: '2026-06-03T07:00:00Z',
		last_frame_at: '2026-06-03T09:14:11Z'
	},
	{
		id: 'cam-kpl-b1',
		edge_id: 'KPL-001',
		edge_name: 'Kantor Pusat Lt.1',
		camera_id: 'cam-b1',
		camera_name: 'Ruang Server',
		location: 'Lantai 2 — Server Room',
		protocol: 'hls',
		stream_url: 'https://test-streams.mux.dev/pts_shift/master.m3u8',
		thumbnail_url: '',
		status: 'offline',
		viewers: 0,
		resolution: '1920x1080',
		fps: 30,
		bitrate_kbps: 4096,
		codec: 'h264',
		started_at: '2026-06-02T08:00:00Z',
		last_frame_at: '2026-06-03T03:22:05Z'
	},
	{
		id: 'cam-cab-bgr',
		edge_id: 'KPL-002',
		edge_name: 'Cabang Bogor',
		camera_id: 'cam-bgr-1',
		camera_name: 'Pintu Masuk',
		location: 'Cabang Bogor — Entrance',
		protocol: 'hls',
		stream_url: 'https://test-streams.mux.dev/dai-discontinuity-deltatre/manifest.m3u8',
		thumbnail_url: '',
		status: 'connecting',
		viewers: 0,
		resolution: '1920x1080',
		fps: 25,
		bitrate_kbps: 1536,
		codec: 'h264',
		started_at: '2026-06-03T09:00:00Z',
		last_frame_at: '2026-06-03T09:13:58Z'
	}
];

export const mockLivestreamToken: LivestreamToken = {
	token: 'mock-jwt-token-abcd1234efgh5678',
	expires_at: '2026-06-03T10:14:30Z',
	stream_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
	webrtc_url: 'wss://demo.example.com/live/cam-1',
	ttl_seconds: 3600
};

export const mockEdgeStatus: EdgeStatus[] = [
	{
		edge_id: 'KPL-001',
		edge_name: 'Kantor Pusat Lt.1',
		online: true,
		cpu_pct: 23.4,
		mem_pct: 41.2,
		disk_pct: 67.8,
		uptime_pct: 99.7,
		days_online: 124,
		days_no_heartbeat: 0,
		camera_count: 6,
		cameras_online: 5,
		location: 'Jakarta Pusat',
		updated_at: '2026-06-03T09:14:00Z'
	},
	{
		edge_id: 'KPL-002',
		edge_name: 'Cabang Bogor',
		online: true,
		cpu_pct: 67.1,
		mem_pct: 78.5,
		disk_pct: 82.0,
		uptime_pct: 98.1,
		days_online: 67,
		days_no_heartbeat: 0,
		camera_count: 4,
		cameras_online: 3,
		location: 'Bogor',
		updated_at: '2026-06-03T09:14:00Z'
	}
];

export const mockCameras: Camera[] = [
	{
		id: 'cam-a1',
		edge_id: 'KPL-001',
		edge_name: 'Kantor Pusat Lt.1',
		name: 'Lobby Utama',
		location: 'Lantai 1 — Lobby',
		rtsp_url: 'rtsp://admin:***@192.168.1.10:554/stream1',
		enabled: true,
		recording_enabled: true,
		resolution: '1920x1080',
		fps: 25,
		has_audio: true
	},
	{
		id: 'cam-a2',
		edge_id: 'KPL-001',
		edge_name: 'Kantor Pusat Lt.1',
		name: 'Resepsionis',
		location: 'Lantai 1 — Resepsionis',
		rtsp_url: 'rtsp://admin:***@192.168.1.11:554/stream1',
		enabled: true,
		recording_enabled: true,
		resolution: '1280x720',
		fps: 15,
		has_audio: true
	},
	{
		id: 'cam-b1',
		edge_id: 'KPL-001',
		edge_name: 'Kantor Pusat Lt.1',
		name: 'Ruang Server',
		location: 'Lantai 2 — Server Room',
		rtsp_url: 'rtsp://admin:***@192.168.1.12:554/stream1',
		enabled: true,
		recording_enabled: false,
		resolution: '1920x1080',
		fps: 30,
		has_audio: false
	},
	{
		id: 'cam-bgr-1',
		edge_id: 'KPL-002',
		edge_name: 'Cabang Bogor',
		name: 'Pintu Masuk',
		location: 'Cabang Bogor — Entrance',
		rtsp_url: 'rtsp://admin:***@10.10.1.20:554/stream1',
		enabled: true,
		recording_enabled: true,
		resolution: '1920x1080',
		fps: 25,
		has_audio: true
	}
];
