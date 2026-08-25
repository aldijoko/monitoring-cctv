<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import Topbar from '$lib/components/Topbar.svelte';
	import { isAuthenticated, hydrateFromServer } from '$lib/stores/auth';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	// Login now happens entirely server-side (routes/login/+page.server.ts),
	// which sets cookies but has no way to touch localStorage — this syncs
	// the client store from the user +layout.server.ts already resolved, so
	// existing client-side code (client.ts's bearer header, isAuthenticated,
	// Sidebar's role-gating) keeps working. Must run before the redirect
	// effect below ever evaluates, so it's a plain synchronous call during
	// component init, not inside an $effect — see stores/auth.ts.
	if (browser) {
		hydrateFromServer(data.user);
	}

	// (app)/+layout.server.ts already guarantees a valid session cookie
	// before this ever renders, so we render children unconditionally.
	// This effect only handles a session going invalid *during* client-side
	// use (e.g. a 401 from an API call triggers clearSession()) — the old
	// onMount-only check ran once and never caught that case, leaving users
	// stuck on an infinite spinner after their session expired mid-use.
	$effect(() => {
		if (!$isAuthenticated) {
			goto('/login', { replaceState: true });
		}
	});
</script>

<div class="flex h-screen overflow-hidden bg-gray-50">
	<Sidebar />
	<div class="flex flex-1 flex-col overflow-hidden">
		<Topbar />
		<main class="flex-1 overflow-y-auto">
			{@render children()}
		</main>
	</div>
</div>
