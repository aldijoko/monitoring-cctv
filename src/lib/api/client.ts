import { browser } from '$app/environment';
import { getAccessToken, clearSession } from '$lib/stores/auth';
import { toasts } from '$lib/stores/toast';
import type { ApiError } from '$lib/types/api';

const API_BASE = '/api/v1';

export interface RequestOptions<TBody = unknown> {
	method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
	body?: TBody;
	query?: Record<string, string | number | boolean | undefined | null>;
	headers?: Record<string, string>;
	signal?: AbortSignal;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
	const url = new URL(
		path.startsWith('http') ? path : `${API_BASE}${path}`,
		browser ? window.location.origin : 'http://localhost'
	);
	if (query) {
		for (const [k, v] of Object.entries(query)) {
			if (v === undefined || v === null) continue;
			url.searchParams.set(k, String(v));
		}
	}
	return url.pathname + url.search;
}

export class ApiException extends Error {
	status: number;
	code: string;
	details?: Record<string, string>;

	constructor(status: number, payload: ApiError | { message: string }) {
		super(payload.message);
		this.status = status;
		this.code = 'code' in payload ? payload.code : 'unknown_error';
		this.details = 'details' in payload ? payload.details : undefined;
	}
}

export async function request<TResponse, TBody = unknown>(
	path: string,
	options: RequestOptions<TBody> = {}
): Promise<TResponse> {
	const { method = 'GET', body, query, headers = {}, signal } = options;

	const reqHeaders: Record<string, string> = {
		Accept: 'application/json',
		...headers
	};

	const token = getAccessToken();
	if (token) {
		reqHeaders['Authorization'] = `Bearer ${token}`;
	}

	if (body !== undefined && !(body instanceof FormData)) {
		reqHeaders['Content-Type'] = 'application/json';
	}

	const res = await fetch(buildUrl(path, query), {
		method,
		headers: reqHeaders,
		body:
			body === undefined
				? undefined
				: body instanceof FormData
					? body
					: JSON.stringify(body),
		credentials: 'include',
		signal
	});

	if (res.status === 401) {
		clearSession();
		if (browser) {
			toasts.error('Sesi berakhir, silakan login ulang');
		}
		throw new ApiException(401, { code: 'unauthorized', message: 'Unauthorized' });
	}

	if (!res.ok) {
		let payload: ApiError | { message: string };
		try {
			payload = (await res.json()) as ApiError;
		} catch {
			payload = { message: res.statusText || 'Request failed' };
		}
		throw new ApiException(res.status, payload);
	}

	if (res.status === 204) {
		return undefined as TResponse;
	}

	return (await res.json()) as TResponse;
}

export function apiGet<TResponse>(
	path: string,
	query?: RequestOptions['query'],
	signal?: AbortSignal
): Promise<TResponse> {
	return request<TResponse>(path, { method: 'GET', query, signal });
}

export function apiPost<TResponse, TBody = unknown>(
	path: string,
	body?: TBody,
	signal?: AbortSignal
): Promise<TResponse> {
	return request<TResponse, TBody>(path, { method: 'POST', body, signal });
}

export function apiPut<TResponse, TBody = unknown>(
	path: string,
	body?: TBody,
	signal?: AbortSignal
): Promise<TResponse> {
	return request<TResponse, TBody>(path, { method: 'PUT', body, signal });
}

export function apiPatch<TResponse, TBody = unknown>(
	path: string,
	body?: TBody,
	signal?: AbortSignal
): Promise<TResponse> {
	return request<TResponse, TBody>(path, { method: 'PATCH', body, signal });
}

export function apiDelete<TResponse>(path: string, signal?: AbortSignal): Promise<TResponse> {
	return request<TResponse>(path, { method: 'DELETE', signal });
}

export const api = {
	get: apiGet,
	post: apiPost,
	put: apiPut,
	patch: apiPatch,
	del: apiDelete
};
