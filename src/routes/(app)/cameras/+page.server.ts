import type { PageServerLoad } from './$types';
import { serverApiFetch } from '$lib/server/api';
import type { CameraStatus, LiveCamera } from '$lib/types/api';

const PAGE_SIZE = 10;

export const load: PageServerLoad = async (event) => {
	const { url } = event;
	const search = url.searchParams.get('search') ?? '';
	const status = (url.searchParams.get('status') ?? '') as CameraStatus | '';
	const page = Math.max(1, Number(url.searchParams.get('page') ?? '1') || 1);

	const res = await serverApiFetch<{ cameras: LiveCamera[]; total: number }>(event, '/cameras', {
		query: {
			q: search || undefined,
			status: status || undefined,
			limit: PAGE_SIZE,
			offset: (page - 1) * PAGE_SIZE
		}
	});

	return {
		cameras: res.cameras,
		total: res.total,
		filters: { search, status, page, pageSize: PAGE_SIZE }
	};
};
