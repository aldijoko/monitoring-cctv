<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import CameraForm from '$lib/components/CameraForm.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head><title>Edit Kamera — Monitoring CCTV</title></svelte:head>

<PageHeader
	title={`Edit ${data.camera.name}`}
	subtitle="Perbarui konfigurasi kamera"
	back={data.camera.edge_id ? `/edges/${data.camera.edge_id}` : '/cameras'}
/>
<CameraForm mode="edit" initial={data.camera} lockedEdgeId={data.camera.edge_id} />
