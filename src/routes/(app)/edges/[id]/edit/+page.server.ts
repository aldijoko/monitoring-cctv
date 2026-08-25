import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { serverApiFetch } from '$lib/server/api';
import type { Edge } from '$lib/types/api';

export const load: PageServerLoad = async (event) => {
	const id = Number(event.params.id);
	if (!Number.isFinite(id)) {
		error(400, 'ID edge tidak valid');
	}
	const edge = await serverApiFetch<Edge>(event, `/edges/${id}`);
	return { edge };
};
