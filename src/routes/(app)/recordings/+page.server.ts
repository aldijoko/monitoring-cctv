import type { PageServerLoad } from './$types';
import { serverApiFetch } from '$lib/server/api';
import type { Edge, Paginated, Recording } from '$lib/types/api';
import type { CameraOption } from '$lib/api/recordings';

const PAGE_SIZE = 10;

type SortKey = 'started_at' | 'size_bytes' | 'duration_seconds' | 'edge_code';

export const load: PageServerLoad = async (event) => {
	const { url } = event;
	const search = url.searchParams.get('search') ?? '';
	const edgeId = url.searchParams.get('edge_id') ?? 'all';
	const cameraId = url.searchParams.get('camera_id') ?? 'all';
	const dateFrom = url.searchParams.get('date_from') ?? '';
	const dateTo = url.searchParams.get('date_to') ?? '';
	const sort = (url.searchParams.get('sort') ?? 'started_at') as SortKey;
	const order = (url.searchParams.get('order') ?? 'desc') as 'asc' | 'desc';
	const page = Math.max(1, Number(url.searchParams.get('page') ?? '1') || 1);

	const [recordings, edgesPage, cameras] = await Promise.all([
		serverApiFetch<Paginated<Recording>>(event, '/recordings', {
			query: {
				search: search || undefined,
				edge_id: edgeId === 'all' ? undefined : edgeId,
				camera_id: cameraId === 'all' ? undefined : cameraId,
				date_from: dateFrom || undefined,
				date_to: dateTo || undefined,
				sort,
				order,
				limit: PAGE_SIZE,
				offset: (page - 1) * PAGE_SIZE
			}
		}),
		serverApiFetch<Paginated<Edge>>(event, '/edges', { query: { limit: 100 } }),
		serverApiFetch<CameraOption[]>(event, '/recordings/cameras')
	]);

	return {
		recordings,
		edges: edgesPage.items,
		cameras,
		filters: {
			search,
			edgeId,
			cameraId,
			dateFrom,
			dateTo,
			sort,
			order,
			page,
			pageSize: PAGE_SIZE
		}
	};
};
