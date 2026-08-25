import type { PageServerLoad } from './$types';
import { serverApiFetch } from '$lib/server/api';
import type { Paginated, User } from '$lib/types/api';

const PAGE_SIZE = 10;

export const load: PageServerLoad = async (event) => {
	// Auth is already enforced by (app)/+layout.server.ts.
	const { url } = event;
	const search = url.searchParams.get('search') ?? '';
	const role = url.searchParams.get('role') ?? 'all';
	const active = url.searchParams.get('active') ?? 'all';
	const page = Math.max(1, Number(url.searchParams.get('page') ?? '1') || 1);

	const users = await serverApiFetch<Paginated<User>>(event, '/users', {
		query: {
			search: search || undefined,
			role: role === 'all' ? undefined : role,
			is_active: active === 'all' ? undefined : active === 'active',
			limit: PAGE_SIZE,
			offset: (page - 1) * PAGE_SIZE
		}
	});

	return {
		users,
		filters: { search, role, active, page, pageSize: PAGE_SIZE }
	};
};
