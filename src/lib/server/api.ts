import { error, type RequestEvent } from '@sveltejs/kit';
import { API_BASE_URL } from '$env/static/private';
import type { ApiError } from '$lib/types/api';

export interface ServerApiOptions<TBody = unknown> {
	method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
	body?: TBody;
	query?: Record<string, string | number | boolean | undefined | null>;
}

/**
 * Server-side counterpart to $lib/api/client.ts's `request()` — used from
 * +page.server.ts load functions and form actions, which run on the server
 * and can't read localStorage (where the client keeps its session), so the
 * access token comes from event.locals.session instead (populated by
 * hooks.server.ts from the mirrored cookies — see auth-cookie.ts).
 * Same response contract as the client: raw JSON, no {success,data} envelope.
 */
export async function serverApiFetch<TResponse, TBody = unknown>(
	event: RequestEvent,
	path: string,
	options: ServerApiOptions<TBody> = {}
): Promise<TResponse> {
	const { method = 'GET', body, query } = options;

	const url = new URL(API_BASE_URL + path);
	if (query) {
		for (const [k, v] of Object.entries(query)) {
			if (v === undefined || v === null) continue;
			url.searchParams.set(k, String(v));
		}
	}

	const token = event.locals.session?.accessToken;
	const headers: Record<string, string> = { Accept: 'application/json' };
	if (token) headers['Authorization'] = `Bearer ${token}`;
	if (body !== undefined) headers['Content-Type'] = 'application/json';

	const res = await event.fetch(url, {
		method,
		headers,
		body: body !== undefined ? JSON.stringify(body) : undefined
	});

	if (!res.ok) {
		let payload: ApiError | { message: string };
		try {
			payload = (await res.json()) as ApiError;
		} catch {
			payload = { message: res.statusText || 'Request failed' };
		}
		error(res.status, payload.message);
	}

	if (res.status === 204) {
		return undefined as TResponse;
	}
	return (await res.json()) as TResponse;
}
