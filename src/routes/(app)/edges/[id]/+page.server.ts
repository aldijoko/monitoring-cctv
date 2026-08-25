import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { serverApiFetch } from '$lib/server/api';
import type { Edge, LiveCamera } from '$lib/types/api';

export const load: PageServerLoad = async (event) => {
	const id = Number(event.params.id);
	if (!Number.isFinite(id)) {
		error(400, 'ID edge tidak valid');
	}

	const [edge, cameraList] = await Promise.all([
		serverApiFetch<Edge>(event, `/edges/${id}`),
		serverApiFetch<{ cameras: LiveCamera[]; total: number }>(event, '/cameras', {
			query: { edge_id: id }
		})
	]);

	return { edge, cameras: cameraList.cameras };
};
