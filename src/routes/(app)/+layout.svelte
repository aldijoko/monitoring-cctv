<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import type { Snippet } from 'svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import Topbar from '$lib/components/Topbar.svelte';
	import { isAuthenticated } from '$lib/stores/auth';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	onMount(() => {
		if (browser && !$isAuthenticated) {
			goto('/login', { replaceState: true });
		}
	});
</script>

{#if $isAuthenticated}
	<div class="flex h-screen overflow-hidden bg-gray-50">
		<Sidebar />
		<div class="flex flex-1 flex-col overflow-hidden">
			<Topbar />
			<main class="flex-1 overflow-y-auto">
				{@render children()}
			</main>
		</div>
	</div>
{:else}
	<div class="flex min-h-screen items-center justify-center">
		<div
			class="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600"
		></div>
	</div>
{/if}
