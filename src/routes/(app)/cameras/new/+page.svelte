<script lang="ts">
	import { page } from '$app/state';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import CameraForm from '$lib/components/CameraForm.svelte';

	const lockedEdgeIdParam = $derived(page.url.searchParams.get('edge_id'));
	const lockedEdgeId = $derived(lockedEdgeIdParam ? Number(lockedEdgeIdParam) : undefined);
</script>

<svelte:head><title>Tambah Kamera — Monitoring CCTV</title></svelte:head>

<PageHeader title="Tambah Kamera" subtitle="Daftarkan kamera ke edge" back={lockedEdgeId ? `/edges/${lockedEdgeId}` : '/cameras'} />

<CameraForm mode="create" {lockedEdgeId} />
