import type { Handle } from '@sveltejs/kit';
import { ACCESS_TOKEN_COOKIE, USER_COOKIE } from '$lib/auth-cookie';
import type { User } from '$lib/types/api';

/**
 * Populates event.locals.session from the mirrored auth cookies (see
 * auth-cookie.ts) on every request, so +layout.server.ts / +page.server.ts
 * load functions and form actions don't each have to re-read/re-parse the
 * cookies themselves — see (app)/+layout.server.ts and login/+page.server.ts
 * for how it's consumed. This does NOT verify the JWT signature; that's the
 * Go backend's job on every actual API call (see serverApiFetch) — a
 * present-but-expired/invalid token just means the first API call in a
 * given load will fail and surface as a SvelteKit error, not a silent
 * bypass, since no route here trusts the token's contents for anything
 * except display (username/role in the sidebar).
 */
export const handle: Handle = async ({ event, resolve }) => {
	const accessToken = event.cookies.get(ACCESS_TOKEN_COOKIE);
	const rawUser = event.cookies.get(USER_COOKIE);

	if (accessToken && rawUser) {
		try {
			event.locals.session = { accessToken, user: JSON.parse(rawUser) as User };
		} catch {
			event.locals.session = null;
		}
	} else {
		event.locals.session = null;
	}

	return resolve(event);
};
