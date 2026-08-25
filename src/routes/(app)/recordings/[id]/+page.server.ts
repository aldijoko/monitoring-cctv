import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { serverApiFetch } from '$lib/server/api';
import type { Recording } from '$lib/types/api';

export const load: PageServerLoad = async (event) => {
	const id = Number(event.params.id);
	if (!Number.isFinite(id)) {
		error(400, 'ID recording tidak valid');
	}
	const recording = await serverApiFetch<Recording>(event, `/recordings/${id}`);
	return { recording };
};
