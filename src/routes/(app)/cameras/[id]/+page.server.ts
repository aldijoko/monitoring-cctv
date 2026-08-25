import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { serverApiFetch } from '$lib/server/api';
import type { LiveCamera, Paginated, Recording } from '$lib/types/api';

export const load: PageServerLoad = async (event) => {
	const id = Number(event.params.id);
	if (!Number.isFinite(id)) {
		error(400, 'ID kamera tidak valid');
	}

	const [camera, recordingsPage] = await Promise.all([
		serverApiFetch<LiveCamera>(event, `/cameras/${id}`),
		serverApiFetch<Paginated<Recording>>(event, '/recordings', {
			query: { camera_id: id, limit: 20 }
		})
	]);

	return { camera, recordings: recordingsPage.items };
};
