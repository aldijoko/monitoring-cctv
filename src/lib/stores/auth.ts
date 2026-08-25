import { writable, derived, get, type Readable } from 'svelte/store';
import { browser } from '$app/environment';
import type { User, LoginResponse } from '$lib/types/api';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, USER_COOKIE } from '$lib/auth-cookie';

const STORAGE_KEY = 'cctv.auth';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days — matches JWT_REFRESH_EXPIRY ballpark

function setCookie(token: string) {
	document.cookie = `${ACCESS_TOKEN_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
}

function clearCookie() {
	document.cookie = `${ACCESS_TOKEN_COOKIE}=; path=/; max-age=0; samesite=lax`;
	document.cookie = `${REFRESH_TOKEN_COOKIE}=; path=/; max-age=0; samesite=lax`;
	document.cookie = `${USER_COOKIE}=; path=/; max-age=0; samesite=lax`;
}

function readCookie(name: string): string | null {
	const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
	return match ? decodeURIComponent(match[1]) : null;
}

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
		setCookie(value.access_token);
	} else {
		localStorage.removeItem(STORAGE_KEY);
		clearCookie();
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

/**
 * Syncs the client store (and thus localStorage) from server-provided auth
 * state — called from (app)/+layout.svelte with the `user` its
 * +layout.server.ts load returned. Login now happens entirely server-side
 * (see routes/login/+page.server.ts), which sets the cookies directly but
 * has no way to touch localStorage — this is the bridge that keeps
 * getAccessToken()/isAuthenticated/user working for the existing
 * client-side code (mutations, StreamPlayer polling, etc.) that all still
 * read from this store, not the cookies directly.
 */
export function hydrateFromServer(serverUser: User | null) {
	if (!serverUser) {
		if (get(store).access_token) clearSession();
		return;
	}

	const accessToken = readCookie(ACCESS_TOKEN_COOKIE);
	if (!accessToken) {
		clearSession();
		return;
	}

	const current = get(store);
	if (current.access_token === accessToken && current.user?.id === serverUser.id) {
		return; // already in sync — avoid redundant writes on every navigation
	}

	store.set({
		access_token: accessToken,
		refresh_token: readCookie(REFRESH_TOKEN_COOKIE),
		user: serverUser
	});
}

export function getAccessToken(): string | null {
	return get(store).access_token;
}
