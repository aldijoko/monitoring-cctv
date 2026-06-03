// Dashboard API — proxy to /api/v1/admin/summary
import { api } from './client';
import { generateMockDashboard } from '$lib/mocks/dashboard';
import type { DashboardData } from '$lib/types/dashboard';

export async function fetchDashboard(signal?: AbortSignal): Promise<DashboardData> {
	try {
		// Real endpoint (uncomment when backend ready):
		// const { data } = await api.get<DashboardData>('/admin/summary', { signal });
		// return data;
		// Mock for now:
		const mock = generateMockDashboard();
		// Simulate network latency
		await new Promise((r) => setTimeout(r, 250));
		return mock;
	} catch (err) {
		if ((err as { name?: string }).name === 'CanceledError') throw err;
		throw err;
	}
}
