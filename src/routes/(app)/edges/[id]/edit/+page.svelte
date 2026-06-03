<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { api } from '$lib/api/client';
	import { toast } from '$lib/stores/toast';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import EdgeForm from '$lib/components/EdgeForm.svelte';
	import type { Edge } from '$lib/api/edges';

	const edgeId = $derived(page.params.id);
	let edge = $state<Edge | null>(null);
	let loading = $state(true);

	onMount(async () => {
		try {
			const res = await api.get<{ edge: Edge }>(`/api/v1/edges/${edgeId}`);
			edge = res.edge;
		} catch (err) {
			toast.error((err as Error).message);
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head><title>Edit Edge — Monitoring CCTV</title></svelte:head>

{#if loading}
	<div class="py-12 text-center text-sm text-gray-500">Memuat…</div>
{:else if !edge}
	<div class="py-12 text-center text-sm text-gray-500">Edge tidak ditemukan</div>
{:else}
	<PageHeader title={`Edit ${edge.name}`} subtitle={`Code: ${edge.code}`} back="/edges" />
	<EdgeForm mode="edit" initial={edge} />
{/if}
