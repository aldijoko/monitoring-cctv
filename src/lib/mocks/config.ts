/**
 * Toggle mock mode for development without backend.
 *
 * Set USE_MOCKS = true to use in-memory mock data.
 * Set USE_MOCKS = false to call real API endpoints.
 */
export const USE_MOCKS = true;

export const delay = (ms = 300) => new Promise<void>((r) => setTimeout(r, ms));

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
	await delay();
	const res = await fetch(path, {
		...init,
		headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) }
	});
	if (!res.ok) throw new Error(`Mock ${res.status}`);
	return (await res.json()) as T;
}
