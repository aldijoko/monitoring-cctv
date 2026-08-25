<script lang="ts">
	import { goto } from '$app/navigation';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import UserForm from '$lib/components/UserForm.svelte';
	import { usersApi, type UserFormData, type UserUpdateData } from '$lib/api/users';
	import { toast } from '$lib/stores/toast';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	async function handleSave(formData: UserFormData | UserUpdateData) {
		try {
			await usersApi.update(data.user.id, formData as UserUpdateData);
			toast.success(`User ${data.user.username} diperbarui`);
			await goto('/users');
		} catch (err) {
			toast.error((err as Error).message);
		}
	}
</script>

<svelte:head><title>Edit User — Monitoring CCTV</title></svelte:head>

<PageHeader title={`Edit ${data.user.username}`} subtitle={`ID: ${data.user.id}`} back="/users" />
<UserForm mode="edit" initial={data.user} onsaved={handleSave} oncancel={() => goto('/users')} />
