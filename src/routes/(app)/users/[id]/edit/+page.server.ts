import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { serverApiFetch } from '$lib/server/api';
import type { User } from '$lib/types/api';

export const load: PageServerLoad = async (event) => {
	// Auth is already enforced by (app)/+layout.server.ts.
	const id = Number(event.params.id);
	if (!Number.isFinite(id)) {
		error(400, 'ID user tidak valid');
	}

	const user = await serverApiFetch<User>(event, `/users/${id}`);
	return { user };
};
