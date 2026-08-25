<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import EdgeForm from '$lib/components/EdgeForm.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head><title>Edit Edge — Monitoring CCTV</title></svelte:head>

<PageHeader title={`Edit ${data.edge.name}`} subtitle={`Code: ${data.edge.code}`} back="/edges" />
<EdgeForm mode="edit" initial={data.edge} />
