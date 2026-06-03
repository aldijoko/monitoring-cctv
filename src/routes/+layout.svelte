<script lang="ts">
	import '../app.css';
	import type { Snippet } from 'svelte';
	import ToastContainer from '$lib/components/ToastContainer.svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<ToastContainer />

{@render children()}
