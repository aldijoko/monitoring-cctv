<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import EdgeForm from '$lib/components/EdgeForm.svelte';
</script>

<svelte:head><title>Tambah Edge — Monitoring CCTV</title></svelte:head>

<PageHeader title="Tambah Edge" subtitle="Daftarkan node rekaman baru" back="/edges" />

<EdgeForm mode="create" />
