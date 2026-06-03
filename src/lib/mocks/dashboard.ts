// Mock data generator for dashboard — produces 24h of metrics
import type {
	DashboardData,
	DashboardSummary,
	EdgeMetrics,
	CameraHealthBucket,
	TimeseriesPoint
} from '$lib/types/dashboard';

function makeSeries(
	name: string,
	unit: string,
	color: string,
	baseline: number,
	amplitude: number,
	hours = 24,
	end = Date.now()
): EdgeMetrics['cpu'] {
	const data: TimeseriesPoint[] = [];
	const start = end - hours * 3600_000;
	const step = (hours * 3600_000) / 47; // ~48 points
	for (let t = start; t <= end; t += step) {
		const phase = (t - start) / 3600_000;
		const noise = Math.sin(phase * 0.7) * amplitude * 0.3;
		const wave = Math.sin(phase * 0.4) * amplitude;
		const value = Math.max(
			0,
			Math.min(100, baseline + wave + noise + (Math.random() - 0.5) * amplitude * 0.2)
		);
		data.push({
			timestamp: new Date(t).toISOString(),
			value: Number(value.toFixed(2))
		});
	}
	return { name, unit, color, data };
}

export function generateMockDashboard(): DashboardData {
	const now = Date.now();

	const edges: EdgeMetrics[] = [
		{
			edge_id: 'KPL-119',
			edge_name: 'Polda Metro Lobby',
			tenant_id: 'polda-metro',
			cpu: makeSeries('CPU', '%', '#3b82f6', 38, 18, 24, now),
			memory: makeSeries('Memory', '%', '#8b5cf6', 62, 12, 24, now),
			disk: makeSeries('Disk', '%', '#f59e0b', 71, 5, 24, now),
			network_in: makeSeries('Net In', 'Mbps', '#10b981', 45, 25, 24, now),
			network_out: makeSeries('Net Out', 'Mbps', '#ef4444', 38, 18, 24, now),
			uptime_pct: 99.87,
			days_online: 142,
			cameras_online: 24,
			cameras_total: 24
		},
		{
			edge_id: 'KPL-120',
			edge_name: 'Polda Basement',
			tenant_id: 'polda-metro',
			cpu: makeSeries('CPU', '%', '#3b82f6', 52, 22, 24, now),
			memory: makeSeries('Memory', '%', '#8b5cf6', 58, 8, 24, now),
			disk: makeSeries('Disk', '%', '#f59e0b', 43, 4, 24, now),
			network_in: makeSeries('Net In', 'Mbps', '#10b981', 32, 18, 24, now),
			network_out: makeSeries('Net Out', 'Mbps', '#ef4444', 28, 14, 24, now),
			uptime_pct: 98.42,
			days_online: 87,
			cameras_online: 12,
			cameras_total: 12
		},
		{
			edge_id: 'KPL-121',
			edge_name: 'Polda Pos Satpam',
			tenant_id: 'polda-metro',
			cpu: makeSeries('CPU', '%', '#3b82f6', 28, 14, 24, now),
			memory: makeSeries('Memory', '%', '#8b5cf6', 41, 6, 24, now),
			disk: makeSeries('Disk', '%', '#f59e0b', 88, 3, 24, now),
			network_in: makeSeries('Net In', 'Mbps', '#10b981', 18, 8, 24, now),
			network_out: makeSeries('Net Out', 'Mbps', '#ef4444', 14, 6, 24, now),
			uptime_pct: 92.15,
			days_online: 23,
			cameras_online: 5,
			cameras_total: 6
		}
	];

	const summary: DashboardSummary = {
		edges_total: 3,
		edges_online: 3,
		edges_offline: 0,
		cameras_total: 42,
		cameras_online: 41,
		cameras_offline: 1,
		storage_used_gb: 1840,
		storage_total_gb: 2400,
		storage_pct: 76.67,
		bandwidth_in_mbps: 95.3,
		bandwidth_out_mbps: 80.2,
		recording_hours_today: 1008,
		motion_events_today: 1847
	};

	const camera_health: CameraHealthBucket[] = [
		{ range: '0-25', count: 2, color: '#10b981' },
		{ range: '26-50', count: 8, color: '#84cc16' },
		{ range: '51-75', count: 14, color: '#f59e0b' },
		{ range: '76-100', count: 17, color: '#ef4444' }
	];

	return {
		summary,
		edges,
		camera_health,
		generated_at: new Date(now).toISOString()
	};
}
