<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Button from '$lib/components/Button.svelte';
	import SearchBar from '$lib/components/SearchBar.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import EdgeForm from '$lib/components/EdgeForm.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import { edgesApi, type EdgeFormData } from '$lib/api/edges';
	import { toast } from '$lib/stores/toast';
	import type { Edge } from '$lib/types/api';

	type StatusFilter = Edge['status'] | 'all';

	let items = $state<Edge[]>([]);
	let total = $state(0);
	let loading = $state(false);

	let search = $state('');
	let statusFilter = $state<StatusFilter>('all');
	const pageSize = 10;
	let page = $state(1);

	let formOpen = $state(false);
	let editingEdge = $state<Edge | null>(null);
	let deletingEdge = $state<Edge | null>(null);
	let deleteLoading = $state(false);

	const totalPages = $derived(Math.max(1, Math.ceil(total / pageSize)));
	const offset = $derived((page - 1) * pageSize);

	async function load() {
		loading = true;
		try {
			const res = await edgesApi.list({
				search,
				status: statusFilter,
				limit: pageSize,
				offset,
				sort: 'created_at',
				order: 'desc'
			});
			items = res.items;
			total = res.total;
		} catch (err) {
			toast.error('Gagal memuat data edge');
			console.error(err);
		} finally {
			loading = false;
		}
	}

	function resetPage() {
		page = 1;
	}

	function onSearch(v: string) {
		search = v;
		resetPage();
	}

	function onStatusChange(e: Event) {
		statusFilter = (e.currentTarget as HTMLSelectElement).value as StatusFilter;
		resetPage();
	}

	function openCreate() {
		editingEdge = null;
		formOpen = true;
	}

	function openEdit(e: Edge) {
		editingEdge = e;
		formOpen = true;
	}

	async function handleFormSubmit(data: EdgeFormData) {
		try {
			if (editingEdge) {
				await edgesApi.update(editingEdge.id, data);
				toast.success(`Edge ${editingEdge.code} diperbarui`);
			} else {
				const created = await edgesApi.create(data);
				toast.success(`Edge ${created.code} berhasil ditambahkan`);
			}
			formOpen = false;
			editingEdge = null;
			await load();
		} catch (err) {
			toast.error('Gagal menyimpan edge');
			console.error(err);
		}
	}

	function openDelete(e: Edge) {
		deletingEdge = e;
	}

	async function confirmDelete() {
		if (!deletingEdge) return;
		deleteLoading = true;
		try {
			await edgesApi.remove(deletingEdge.id);
			toast.success(`Edge ${deletingEdge.code} dihapus`);
			deletingEdge = null;
			await load();
		} catch (err) {
			toast.error('Gagal menghapus edge');
			console.error(err);
		} finally {
			deleteLoading = false;
		}
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

	function relativeTime(iso?: string): string {
		if (!iso) return '—';
		const diff = Date.now() - new Date(iso).getTime();
		const min = Math.floor(diff / 60000);
		if (min < 1) return 'baru saja';
		if (min < 60) return `${min} menit lalu`;
		const hr = Math.floor(min / 60);
		if (hr < 24) return `${hr} jam lalu`;
		const day = Math.floor(hr / 24);
		return `${day} hari lalu`;
	}
</script>

<svelte:head>
	<title>Edges — CCTV Monitoring</title>
</svelte:head>

<PageHeader title="Edges" description="Daftar node CCTV yang terdaftar di sistem">
	{#snippet actions()}
		<Button onclick={openCreate}>
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			Tambah Edge
		</Button>
	{/snippet}
</PageHeader>

<div class="space-y-4 p-6">
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<div class="flex flex-1 items-center gap-2">
			<div class="w-full sm:max-w-xs">
				<SearchBar value={search} onchange={onSearch} placeholder="Cari kode, nama, hostname, IP..." />
			</div>

			<select
				class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
				value={statusFilter}
				onchange={onStatusChange}
			>
				<option value="all">Semua status</option>
				<option value="online">Online</option>
				<option value="offline">Offline</option>
				<option value="pending">Pending</option>
			</select>
		</div>

		<div class="text-sm text-gray-500">
			{#if loading}
				Memuat...
			{:else}
				<span class="font-medium text-gray-900">{total}</span> edge terdaftar
			{/if}
		</div>
	</div>

	<div class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
		{#if !loading && items.length === 0}
			<EmptyState
				title={search || statusFilter !== 'all' ? 'Tidak ada hasil' : 'Belum ada edge'}
				message={search || statusFilter !== 'all'
					? 'Coba ubah kata kunci pencarian atau filter status'
					: 'Tambahkan edge pertama Anda untuk mulai monitoring'}
			>
				{#snippet action()}
					{#if !search && statusFilter === 'all'}
						<Button onclick={openCreate}>Tambah Edge Pertama</Button>
					{/if}
				{/snippet}
			</EmptyState>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead class="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
						<tr>
							<th class="px-4 py-3">Kode</th>
							<th class="px-4 py-3">Nama / Hostname</th>
							<th class="px-4 py-3">IP Address</th>
							<th class="px-4 py-3">Status</th>
							<th class="px-4 py-3">Last Heartbeat</th>
							<th class="px-4 py-3">Dibuat</th>
							<th class="px-4 py-3 text-right">Aksi</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-100">
						{#each items as e (e.id)}
							<tr class="hover:bg-gray-50">
								<td class="px-4 py-3">
									<a
										href="/edges/{e.id}"
										class="font-mono text-sm font-medium text-indigo-600 hover:underline"
									>
										{e.code}
									</a>
								</td>
								<td class="px-4 py-3">
									<div class="font-medium text-gray-900">{e.name}</div>
									{#if e.hostname}
										<div class="text-xs text-gray-500">{e.hostname}</div>
									{/if}
								</td>
								<td class="px-4 py-3 font-mono text-xs text-gray-600">
									{e.ip_address ?? '—'}
								</td>
								<td class="px-4 py-3">
									<StatusBadge status={e.status} />
								</td>
								<td class="px-4 py-3">
									<div class="text-sm text-gray-700">{relativeTime(e.last_heartbeat)}</div>
									{#if e.last_heartbeat}
										<div class="text-xs text-gray-400">{formatDate(e.last_heartbeat)}</div>
									{/if}
								</td>
								<td class="px-4 py-3 text-xs text-gray-500">{formatDate(e.created_at)}</td>
								<td class="px-4 py-3 text-right">
									<div class="flex items-center justify-end gap-1">
										<a
											href="/edges/{e.id}"
											class="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
											aria-label="Detail"
										>
											<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
												/>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
												/>
											</svg>
										</a>
										<button
											type="button"
											class="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
											aria-label="Edit"
											onclick={() => openEdit(e)}
										>
											<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
											onclick={() => openDelete(e)}
										>
											<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
				page={page}
				{totalPages}
				{total}
				{pageSize}
				onchange={(p) => {
					page = p;
				}}
			/>
		{/if}
	</div>
</div>

<Modal
	bind:open={formOpen}
	title={editingEdge ? `Edit Edge ${editingEdge.code}` : 'Tambah Edge'}
	size="lg"
>
	{#snippet children()}
		<EdgeForm
			mode={editingEdge ? 'edit' : 'create'}
			initial={editingEdge}
			onsaved={handleFormSubmit}
			oncancel={() => {
				formOpen = false;
				editingEdge = null;
			}}
		/>
	{/snippet}
</Modal>

<ConfirmDialog
	open={!!deletingEdge}
	title="Hapus Edge?"
	message={deletingEdge
		? `Edge ${deletingEdge.code} (${deletingEdge.name}) akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`
		: ''}
	confirmText="Hapus"
	variant="danger"
	loading={deleteLoading}
	onconfirm={confirmDelete}
	oncancel={() => (deletingEdge = null)}
/>
