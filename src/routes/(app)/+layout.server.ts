import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

/**
 * Server-side counterpart to the client-side isAuthenticated guard in
 * +layout.svelte. Without this, +page.server.ts loads under (app)/ still
 * run and fetch real data, but the client-only guard renders the loading
 * spinner instead of the page during SSR (it can't see localStorage), so
 * the fetched data never shows up in the initial HTML — only after client
 * hydration. This makes the redirect (and the "is there a session at all")
 * decision on the server too, where locals.session (set by hooks.server.ts
 * from the mirrored cookies) is visible.
 *
 * The returned `user` is what (app)/+layout.svelte uses to hydrate the
 * client-side auth store (localStorage) on first load — see that file for
 * why that bridge exists.
 */
export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.session) {
		redirect(303, '/login');
	}
	return { user: locals.session.user };
};
