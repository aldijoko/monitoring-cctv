<script lang="ts">
	import { goto } from '$app/navigation';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import EdgeForm from '$lib/components/EdgeForm.svelte';
	import { edgesApi, type EdgeFormData } from '$lib/api/edges';
	import { toast } from '$lib/stores/toast';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	async function handleSave(formData: EdgeFormData) {
		try {
			await edgesApi.update(data.edge.id, formData);
			toast.success('Edge diperbarui');
			await goto('/edges');
		} catch (err) {
			toast.error((err as Error).message);
		}
	}
</script>

<svelte:head><title>Edit Edge — Monitoring CCTV</title></svelte:head>

<PageHeader title={`Edit ${data.edge.name}`} subtitle={`Code: ${data.edge.code}`} back="/edges" />
<EdgeForm mode="edit" initial={data.edge} onsaved={handleSave} oncancel={() => goto('/edges')} />
