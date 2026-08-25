import type { PageServerLoad } from './$types';
import { serverApiFetch } from '$lib/server/api';
import type { CameraStatus, LiveCamera } from '$lib/types/api';

export const load: PageServerLoad = async (event) => {
	const { url } = event;
	const search = url.searchParams.get('search') ?? '';
	const status = (url.searchParams.get('status') ?? '') as CameraStatus | '';

	const res = await serverApiFetch<{ cameras: LiveCamera[]; total: number }>(event, '/cameras', {
		query: {
			q: search || undefined,
			status: status || undefined
		}
	});

	return {
		cameras: res.cameras,
		filters: { search, status }
	};
};
