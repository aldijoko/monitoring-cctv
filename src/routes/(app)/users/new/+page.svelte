<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import UserForm from '$lib/components/UserForm.svelte';
</script>

<svelte:head><title>Tambah User — Monitoring CCTV</title></svelte:head>

<PageHeader title="Tambah User" subtitle="Buat akun operator/viewer baru" back="/users" />

<UserForm mode="create" />
