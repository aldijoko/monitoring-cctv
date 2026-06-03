<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { api } from '$lib/api/client';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import UserForm from '$lib/components/UserForm.svelte';
	import type { User } from '$lib/api/users';

	const userId = $derived(page.params.id);
	let user = $state<User | null>(null);
	let loading = $state(true);

	onMount(async () => {
		try {
			const res = await api.get<{ user: User }>(`/api/v1/users/${userId}`);
			user = res.user;
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head><title>Edit User — Monitoring CCTV</title></svelte:head>

{#if loading}
	<div class="py-12 text-center text-sm text-gray-500">Memuat…</div>
{:else if !user}
	<div class="py-12 text-center text-sm text-gray-500">User tidak ditemukan</div>
{:else}
	<PageHeader title={`Edit ${user.username}`} subtitle={`ID: ${user.id}`} back="/users" />
	<UserForm mode="edit" initial={user} />
{/if}
