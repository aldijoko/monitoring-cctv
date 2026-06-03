<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { isAuthenticated } from '$lib/stores/auth';

	onMount(() => {
		goto($isAuthenticated ? '/dashboard' : '/login', { replaceState: true });
	});
</script>

<div class="flex min-h-screen items-center justify-center">
	<div
		class="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600"
	></div>
</div>
