<script lang="ts">
	import { goto } from '$app/navigation';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import EdgeForm from '$lib/components/EdgeForm.svelte';
	import { edgesApi, type EdgeFormData } from '$lib/api/edges';
	import { toast } from '$lib/stores/toast';

	async function handleSave(formData: EdgeFormData) {
		try {
			const created = await edgesApi.create(formData);
			toast.success(`Edge ${created.code} berhasil ditambahkan`);
			await goto('/edges');
		} catch (err) {
			toast.error((err as Error).message);
		}
	}
</script>

<svelte:head><title>Tambah Edge — Monitoring CCTV</title></svelte:head>

<PageHeader title="Tambah Edge" subtitle="Daftarkan node rekaman baru" back="/edges" />

<EdgeForm mode="create" onsaved={handleSave} oncancel={() => goto('/edges')} />
