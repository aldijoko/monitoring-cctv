<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { api } from '$lib/api/client';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import CameraForm from '$lib/components/CameraForm.svelte';
	import type { Camera } from '$lib/api/cameras';

	const cameraId = $derived(page.params.id);
	let camera = $state<Camera | null>(null);
	let loading = $state(true);

	onMount(async () => {
		try {
			const res = await api.get<{ camera: Camera }>(`/api/v1/cameras/${cameraId}`);
			camera = res.camera;
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head><title>Edit Kamera — Monitoring CCTV</title></svelte:head>

{#if loading}
	<div class="py-12 text-center text-sm text-gray-500">Memuat…</div>
{:else if !camera}
	<div class="py-12 text-center text-sm text-gray-500">Kamera tidak ditemukan</div>
{:else}
	<PageHeader
		title={`Edit ${camera.name}`}
		subtitle="Perbarui konfigurasi kamera"
		back={camera.edge_id ? `/edges/${camera.edge_id}` : '/cameras'}
	/>
	<CameraForm mode="edit" initial={camera} lockedEdgeId={camera.edge_id} />
{/if}
