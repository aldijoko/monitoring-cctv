// Dashboard types — mirrors the metrics emitted by the cctv edge agent
// and shapes the response of /api/v1/dashboard (central API).

export type TimeseriesPoint = {
	timestamp: string; // ISO
	value: number;
};

export type MetricSeries = {
	name: string;
	unit: string;
	color: string;
	data: TimeseriesPoint[];
};

export type EdgeMetrics = {
	edge_id: string;
	edge_name: string;
	cpu: MetricSeries;
	memory: MetricSeries;
	disk: MetricSeries;
	network_in: MetricSeries;
	network_out: MetricSeries;
	uptime_pct: number;
	days_online: number;
	cameras_online: number;
	cameras_total: number;
};

export type CameraHealthBucket = {
	range: string; // "0-25", "26-50", ...
	count: number;
	color: string;
};

export type DashboardSummary = {
	edges_total: number;
	edges_online: number;
	edges_offline: number;
	cameras_total: number;
	cameras_online: number;
	cameras_offline: number;
	storage_used_gb: number;
	storage_total_gb: number;
	storage_pct: number;
	bandwidth_in_mbps: number;
	bandwidth_out_mbps: number;
	recording_hours_today: number;
	motion_events_today: number;
};

export type DashboardData = {
	summary: DashboardSummary;
	edges: EdgeMetrics[];
	camera_health: CameraHealthBucket[];
	generated_at: string;
};

// ─────────────────────────────────────────────────────────────
// Front-end projection shapes (used directly by /dashboard page).
// These are derived from the canonical types above but expose
// the flat, render-ready objects consumed by KPI cards, the
// performance line chart, the uptime bar chart, and the alerts
// list. The derivation happens in `$lib/api/dashboard.ts`.
// ─────────────────────────────────────────────────────────────

export type Kpi = {
	id: string;
	label: string;
	value: string;
	unit: string;
	delta: number; // % change vs previous window (positive = worse for outages)
	deltaLabel: string;
	color: string;
	sparkline: number[];
};

export type EdgeHealth = {
	code: string;
	name: string;
	uptimePct: number;
	onlineCameras: number;
	totalCameras: number;
	status: 'online' | 'degraded' | 'offline';
	lastHeartbeat: string; // ISO
};

export type CameraAlert = {
	id: string;
	edgeCode: string;
	cameraName: string;
	severity: 'critical' | 'warning' | 'info';
	message: string;
	timestamp: string; // ISO
};

export type PerformanceSeries = {
	name: string;
	unit: string;
	color: string;
	values: { t: string; v: number }[];
};

export type DashboardView = {
	kpis: Kpi[];
	performanceSeries: PerformanceSeries[];
	uptimeDistribution: CameraHealthBucket[];
	edgeHealth: EdgeHealth[];
	recentAlerts: CameraAlert[];
};
