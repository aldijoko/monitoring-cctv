import type { PageServerLoad } from './$types';
import { serverApiFetch } from '$lib/server/api';
import type { Edge, Paginated } from '$lib/types/api';

const PAGE_SIZE = 10;

type SortKey = 'code' | 'name' | 'status' | 'last_heartbeat' | 'created_at';

export const load: PageServerLoad = async (event) => {
	const { url } = event;
	const search = url.searchParams.get('search') ?? '';
	const status = url.searchParams.get('status') ?? 'all';
	const sort = (url.searchParams.get('sort') ?? 'created_at') as SortKey;
	const order = (url.searchParams.get('order') ?? 'desc') as 'asc' | 'desc';
	const page = Math.max(1, Number(url.searchParams.get('page') ?? '1') || 1);

	const res = await serverApiFetch<Paginated<Edge>>(event, '/edges', {
		query: {
			search: search || undefined,
			status: status === 'all' ? undefined : status,
			sort,
			order,
			limit: PAGE_SIZE,
			offset: (page - 1) * PAGE_SIZE
		}
	});

	return {
		edges: res,
		filters: { search, status, sort, order, page, pageSize: PAGE_SIZE }
	};
};
