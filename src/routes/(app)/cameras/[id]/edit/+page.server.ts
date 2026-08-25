import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { serverApiFetch } from '$lib/server/api';
import type { LiveCamera } from '$lib/types/api';

export const load: PageServerLoad = async (event) => {
	const id = Number(event.params.id);
	if (!Number.isFinite(id)) {
		error(400, 'ID kamera tidak valid');
	}
	// Detail endpoint (includes source_url for the form) — admin/superadmin only.
	const camera = await serverApiFetch<LiveCamera>(event, `/cameras/${id}`);
	return { camera };
};
