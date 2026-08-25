// Dashboard API — proxy to /api/v1/admin/summary
import { apiGet } from './client';
import type { DashboardData } from '$lib/types/dashboard';

export async function fetchDashboard(signal?: AbortSignal): Promise<DashboardData> {
	return apiGet<DashboardData>('/admin/summary', undefined, signal);
}
