import type { PageServerLoad } from './$types';
import { serverApiFetch } from '$lib/server/api';
import type { DashboardData } from '$lib/types/dashboard';

export const load: PageServerLoad = async (event) => {
	const dashboard = await serverApiFetch<DashboardData>(event, '/admin/summary');
	return { dashboard };
};
