import { writable, derived, get, type Readable } from 'svelte/store';
import { browser } from '$app/environment';
import type { User, LoginResponse } from '$lib/types/api';

const STORAGE_KEY = 'cctv.auth';

interface AuthState {
	access_token: string | null;
	refresh_token: string | null;
	user: User | null;
}

const initial: AuthState = (() => {
	if (!browser) return { access_token: null, refresh_token: null, user: null };
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return { access_token: null, refresh_token: null, user: null };
		return JSON.parse(raw) as AuthState;
	} catch {
		return { access_token: null, refresh_token: null, user: null };
	}
})();

const store = writable<AuthState>(initial);

store.subscribe((value) => {
	if (!browser) return;
	if (value.access_token) {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
	} else {
		localStorage.removeItem(STORAGE_KEY);
	}
});

export const auth: Readable<AuthState> = { subscribe: store.subscribe };

export const user: Readable<User | null> = derived(store, ($s) => $s.user);
export const isAuthenticated: Readable<boolean> = derived(
	store,
	($s) => !!$s.access_token
);

export function setSession(res: LoginResponse) {
	store.set({
		access_token: res.access_token,
		refresh_token: res.refresh_token,
		user: res.user
	});
}

export function setUser(u: User) {
	store.update((s) => ({ ...s, user: u }));
}

export function clearSession() {
	store.set({ access_token: null, refresh_token: null, user: null });
}

export function getAccessToken(): string | null {
	return get(store).access_token;
}
