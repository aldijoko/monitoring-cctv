import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { API_BASE_URL } from '$env/static/private';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, USER_COOKIE } from '$lib/auth-cookie';
import type { LoginResponse } from '$lib/types/api';

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days, matches stores/auth.ts's client-side mirror

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.session) {
		redirect(303, '/dashboard');
	}
};

export const actions: Actions = {
	default: async (event) => {
		const form = await event.request.formData();
		const username = String(form.get('username') ?? '').trim();
		const password = String(form.get('password') ?? '');

		if (!username || !password) {
			return fail(400, { error: 'Username dan password wajib diisi', username });
		}

		const res = await event.fetch(`${API_BASE_URL}/auth/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ username, password })
		});

		if (!res.ok) {
			let message = 'Login gagal';
			try {
				const body = (await res.json()) as { message?: string };
				message = body.message ?? message;
			} catch {
				// non-JSON error body, fall back to the default message
			}
			return fail(res.status, { error: message, username });
		}

		const data = (await res.json()) as LoginResponse;

		// httpOnly: false is required — cookies.set() defaults httpOnly to
		// true, which silently breaks the whole client-side auth bridge:
		// stores/auth.ts's hydrateFromServer() reads these via
		// document.cookie, which cannot see httpOnly cookies at all. A real
		// browser enforces that (unlike curl, which happily resends
		// HttpOnly cookies from its jar regardless — don't trust a curl
		// -c/-b round-trip alone to catch this class of bug).
		const cookieOpts = {
			path: '/',
			maxAge: COOKIE_MAX_AGE,
			sameSite: 'lax' as const,
			httpOnly: false
		};
		event.cookies.set(ACCESS_TOKEN_COOKIE, data.access_token, cookieOpts);
		event.cookies.set(REFRESH_TOKEN_COOKIE, data.refresh_token, cookieOpts);
		event.cookies.set(USER_COOKIE, JSON.stringify(data.user), cookieOpts);

		redirect(303, '/dashboard');
	}
};
