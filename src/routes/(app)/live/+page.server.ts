import type { PageServerLoad } from './$types';
import { serverApiFetch } from '$lib/server/api';
import type { LiveCamera } from '$lib/types/api';

export const load: PageServerLoad = async (event) => {
	const res = await serverApiFetch<{ cameras: LiveCamera[]; total: number }>(event, '/cameras');
	return { cameras: res.cameras.filter((c) => c.enabled) };
};
