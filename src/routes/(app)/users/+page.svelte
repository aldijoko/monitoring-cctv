<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { navigating } from '$app/state';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Button from '$lib/components/Button.svelte';
	import SearchBar from '$lib/components/SearchBar.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import UserForm from '$lib/components/UserForm.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import ResetPasswordDialog from '$lib/components/ResetPasswordDialog.svelte';
	import { usersApi, type UserFormData, type UserUpdateData } from '$lib/api/users';
	import { toast } from '$lib/stores/toast';
	import type { User, UserRole } from '$lib/types/api';
	import type { PageProps } from './$types';

	type RoleFilter = UserRole | 'all';
	type ActiveFilter = 'all' | 'active' | 'inactive';

	let { data }: PageProps = $props();

	let items = $derived(data.users.items);
	let total = $derived(data.users.total);
	let pageSize = $derived(data.filters.pageSize);
	let currentPage = $derived(data.filters.page);
	let totalPages = $derived(Math.max(1, Math.ceil(total / pageSize)));
	let loading = $derived(!!navigating.to);

	let search = $state(data.filters.search);
	let roleFilter = $state<RoleFilter>(data.filters.role as RoleFilter);
	let activeFilter = $state<ActiveFilter>(data.filters.active as ActiveFilter);

	// Keep local filter state in sync when navigating (back/forward, external links).
	$effect(() => {
		search = data.filters.search;
		roleFilter = data.filters.role as RoleFilter;
		activeFilter = data.filters.active as ActiveFilter;
	});

	let formOpen = $state(false);
	let editingUser = $state<User | null>(null);

	let deletingUser = $state<User | null>(null);
	let deleteLoading = $state(false);

	let resettingUser = $state<User | null>(null);
	let tempPassword = $state<string | null>(null);

	function applyFilters(overrides: {
		search?: string;
		role?: RoleFilter;
		active?: ActiveFilter;
		page?: number;
	}) {
		const s = overrides.search ?? search;
		const r = overrides.role ?? roleFilter;
		const a = overrides.active ?? activeFilter;
		const p = overrides.page ?? 1;

		const params = new URLSearchParams();
		if (s) params.set('search', s);
		if (r !== 'all') params.set('role', r);
		if (a !== 'all') params.set('active', a);
		if (p > 1) params.set('page', String(p));

		goto(params.toString() ? `/users?${params}` : '/users', { keepFocus: true });
	}

	function onSearch(v: string) {
		search = v;
		applyFilters({ search: v, page: 1 });
	}

	function onRoleChange(e: Event) {
		roleFilter = (e.currentTarget as HTMLSelectElement).value as RoleFilter;
		applyFilters({ role: roleFilter, page: 1 });
	}

	function onActiveChange(e: Event) {
		activeFilter = (e.currentTarget as HTMLSelectElement).value as ActiveFilter;
		applyFilters({ active: activeFilter, page: 1 });
	}

	function openCreate() {
		editingUser = null;
		formOpen = true;
	}

	function openEdit(u: User) {
		editingUser = u;
		formOpen = true;
	}

	async function handleFormSubmit(formData: UserFormData | UserUpdateData) {
		try {
			if (editingUser) {
				await usersApi.update(editingUser.id, formData as UserUpdateData);
				toast.success(`User ${editingUser.username} diperbarui`);
			} else {
				const created = await usersApi.create(formData as UserFormData);
				toast.success(`User ${created.username} berhasil ditambahkan`);
			}
			formOpen = false;
			editingUser = null;
			await invalidateAll();
		} catch (err) {
			toast.error('Gagal menyimpan user');
			console.error(err);
		}
	}

	function openDelete(u: User) {
		deletingUser = u;
	}

	async function confirmDelete() {
		if (!deletingUser) return;
		deleteLoading = true;
		try {
			await usersApi.remove(deletingUser.id);
			toast.success(`User ${deletingUser.username} dihapus`);
			deletingUser = null;
			await invalidateAll();
		} catch (err) {
			toast.error('Gagal menghapus user');
			console.error(err);
		} finally {
			deleteLoading = false;
		}
	}

	async function toggleActive(u: User) {
		try {
			await usersApi.setActive(u.id, !u.is_active);
			toast.success(`User ${u.username} ${!u.is_active ? 'diaktifkan' : 'dinonaktifkan'}`);
			await invalidateAll();
		} catch (err) {
			toast.error('Gagal mengubah status user');
			console.error(err);
		}
	}

	function openResetPassword(u: User) {
		resettingUser = u;
		tempPassword = null;
	}

	async function handleResetPassword() {
		if (!resettingUser) return;
		const res = await usersApi.resetPassword(resettingUser.id);
		tempPassword = res.temporary_password;
		toast.success(`Password user ${resettingUser.username} direset`);
	}

	function closeResetPassword() {
		resettingUser = null;
		tempPassword = null;
	}

	function formatDate(iso?: string): string {
		if (!iso) return '—';
		const d = new Date(iso);
		return d.toLocaleString('id-ID', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function roleLabel(role: UserRole): string {
		return { superadmin: 'Superadmin', admin: 'Admin', viewer: 'Viewer' }[role];
	}
</script>

<svelte:head>
	<title>Users — CCTV Monitoring</title>
</svelte:head>

<PageHeader title="Users" description="Kelola akun superadmin, admin, dan viewer">
	{#snippet actions()}
		<Button onclick={openCreate}>
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			Tambah User
		</Button>
	{/snippet}
</PageHeader>

<div class="space-y-4 p-6">
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<div class="flex flex-1 flex-wrap items-center gap-2">
			<div class="w-full sm:max-w-xs">
				<SearchBar value={search} onchange={onSearch} placeholder="Cari username / email..." />
			</div>

			<select
				class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
				value={roleFilter}
				onchange={onRoleChange}
			>
				<option value="all">Semua role</option>
				<option value="superadmin">Superadmin</option>
				<option value="admin">Admin</option>
				<option value="viewer">Viewer</option>
			</select>

			<select
				class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
				value={activeFilter}
				onchange={onActiveChange}
			>
				<option value="all">Semua status</option>
				<option value="active">Aktif</option>
				<option value="inactive">Nonaktif</option>
			</select>
		</div>

		<div class="text-sm text-gray-500">
			{#if loading}
				Memuat...
			{:else}
				<span class="font-medium text-gray-900">{total}</span> user terdaftar
			{/if}
		</div>
	</div>

	<div class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
		{#if !loading && items.length === 0}
			<EmptyState
				title={search || roleFilter !== 'all' || activeFilter !== 'all'
					? 'Tidak ada hasil'
					: 'Belum ada user'}
				message={search || roleFilter !== 'all' || activeFilter !== 'all'
					? 'Coba ubah kata kunci pencarian atau filter'
					: 'Tambahkan user pertama untuk mulai mengelola akses'}
			>
				{#snippet action()}
					{#if !search && roleFilter === 'all' && activeFilter === 'all'}
						<Button onclick={openCreate}>Tambah User Pertama</Button>
					{/if}
				{/snippet}
			</EmptyState>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead class="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
						<tr>
							<th class="px-4 py-3">Username</th>
							<th class="px-4 py-3">Email</th>
							<th class="px-4 py-3">Role</th>
							<th class="px-4 py-3">Status</th>
							<th class="px-4 py-3">Dibuat</th>
							<th class="px-4 py-3 text-right">Aksi</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-100">
						{#each items as u (u.id)}
							<tr class="hover:bg-gray-50">
								<td class="px-4 py-3 font-medium text-gray-900">{u.username}</td>
								<td class="px-4 py-3 text-gray-600">{u.email ?? '—'}</td>
								<td class="px-4 py-3">
									<span
										class="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium uppercase text-gray-700"
									>
										{roleLabel(u.role)}
									</span>
								</td>
								<td class="px-4 py-3">
									<StatusBadge
										status={u.is_active ? 'active' : 'inactive'}
										label={u.is_active ? 'Aktif' : 'Nonaktif'}
									/>
								</td>
								<td class="px-4 py-3 text-xs text-gray-500">{formatDate(u.created_at)}</td>
								<td class="px-4 py-3 text-right">
									<div class="flex items-center justify-end gap-1">
										<button
											type="button"
											class="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
											aria-label="Reset password"
											onclick={() => openResetPassword(u)}
										>
											<svg
												class="h-4 w-4"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
												/>
											</svg>
										</button>
										<button
											type="button"
											class="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
											aria-label={u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
											onclick={() => toggleActive(u)}
										>
											{#if u.is_active}
												<svg
													class="h-4 w-4"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
													/>
												</svg>
											{:else}
												<svg
													class="h-4 w-4"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
													/>
												</svg>
											{/if}
										</button>
										<button
											type="button"
											class="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
											aria-label="Edit"
											onclick={() => openEdit(u)}
										>
											<svg
												class="h-4 w-4"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
												/>
											</svg>
										</button>
										<button
											type="button"
											class="rounded-md p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
											aria-label="Hapus"
											onclick={() => openDelete(u)}
										>
											<svg
												class="h-4 w-4"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
												/>
											</svg>
										</button>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<Pagination
				page={currentPage}
				{totalPages}
				{total}
				{pageSize}
				onchange={(p) => applyFilters({ page: p })}
			/>
		{/if}
	</div>
</div>

<Modal
	bind:open={formOpen}
	title={editingUser ? `Edit User ${editingUser.username}` : 'Tambah User'}
	size="md"
>
	{#snippet children()}
		<UserForm
			mode={editingUser ? 'edit' : 'create'}
			initial={editingUser}
			onsaved={handleFormSubmit}
			oncancel={() => {
				formOpen = false;
				editingUser = null;
			}}
		/>
	{/snippet}
</Modal>

<ConfirmDialog
	open={!!deletingUser}
	title="Hapus User?"
	message={deletingUser
		? `User ${deletingUser.username} akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`
		: ''}
	confirmText="Hapus"
	variant="danger"
	loading={deleteLoading}
	onconfirm={confirmDelete}
	oncancel={() => (deletingUser = null)}
/>

<ResetPasswordDialog
	open={!!resettingUser}
	username={resettingUser?.username ?? ''}
	temporaryPassword={tempPassword}
	onclose={closeResetPassword}
	onreset={handleResetPassword}
/>
