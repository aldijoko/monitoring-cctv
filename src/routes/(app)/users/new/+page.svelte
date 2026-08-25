<script lang="ts">
	import { goto } from '$app/navigation';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import UserForm from '$lib/components/UserForm.svelte';
	import { usersApi, type UserFormData, type UserUpdateData } from '$lib/api/users';
	import { toast } from '$lib/stores/toast';

	async function handleSave(formData: UserFormData | UserUpdateData) {
		try {
			const created = await usersApi.create(formData as UserFormData);
			toast.success(`User ${created.username} berhasil ditambahkan`);
			await goto('/users');
		} catch (err) {
			toast.error((err as Error).message);
		}
	}
</script>

<svelte:head><title>Tambah User — Monitoring CCTV</title></svelte:head>

<PageHeader title="Tambah User" subtitle="Buat akun operator/viewer baru" back="/users" />

<UserForm mode="create" onsaved={handleSave} oncancel={() => goto('/users')} />
