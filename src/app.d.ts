// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
import type { User } from '$lib/types/api';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			session: { accessToken: string; user: User } | null;
		}
		// interface PageData {}
		// interface Platform {}
	}
}

export {};
