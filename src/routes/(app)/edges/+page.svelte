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

	type SortKey = 'code' | 'name' | 'status' | 'last_heartbeat' | 'created_at';
	let sortKey = $state<SortKey>('created_at');
	let sortOrder = $state<'asc' | 'desc'>('desc');

	let formOpen = $state(false);
	let editingEdge = $state<Edge | null>(null);
	let deletingEdge = $state<Edge | null>(null);
	let deleteLoading = $state(false);

	let selected = $state<Set<number>>(new Set());
	let bulkDeleting = $state(false);
	let bulkConfirmOpen = $state(false);
	let copiedId = $state<number | null>(null);
	let copyTimeout: ReturnType<typeof setTimeout> | null = null;

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
				sort: sortKey,
				order: sortOrder
			});
			items = res.items;
			total = res.total;
			selected = new Set([...selected].filter((id) => items.some((e) => e.id === id)));
		} catch (err) {
			toast.error('Gagal memuat data edge');
			console.error(err);
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		// re-fetch when filters / sort / page change
		void search;
		void statusFilter;
		void sortKey;
		void sortOrder;
		void page;
		load();
	});

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

	function onSortChange(key: SortKey) {
		if (sortKey === key) {
			sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
		} else {
			sortKey = key;
			sortOrder = key === 'name' || key === 'code' ? 'asc' : 'desc';
		}
		resetPage();
	}

	const allSelected = $derived(items.length > 0 && items.every((e) => selected.has(e.id)));
	const someSelected = $derived(selected.size > 0);

	function toggleAll() {
		if (allSelected) {
			items.forEach((e) => selected.delete(e.id));
		} else {
			items.forEach((e) => selected.add(e.id));
		}
		selected = new Set(selected);
	}

	function toggleOne(id: number) {
		if (selected.has(id)) {
			selected.delete(id);
		} else {
			selected.add(id);
		}
		selected = new Set(selected);
	}

	async function confirmBulkDelete() {
		bulkDeleting = true;
		try {
			const ids = [...selected];
			let ok = 0;
			for (const id of ids) {
				try {
					await edgesApi.remove(id);
					ok++;
				} catch (err) {
					console.error(err);
				}
			}
			toast.success(`${ok} edge dihapus`);
			bulkConfirmOpen = false;
			selected = new Set();
			await load();
		} finally {
			bulkDeleting = false;
		}
	}

	async function copyCode(edge: Edge) {
		try {
			await navigator.clipboard.writeText(edge.code);
			copiedId = edge.id;
			toast.success(`Kode ${edge.code} disalin`);
			if (copyTimeout) clearTimeout(copyTimeout);
			copyTimeout = setTimeout(() => {
				copiedId = null;
			}, 1500);
		} catch (err) {
			toast.error('Gagal menyalin kode');
			console.error(err);
		}
	}

	function heartbeatAge(iso?: string): number | null {
		if (!iso) return null;
		return Date.now() - new Date(iso).getTime();
	}

	function freshnessColor(ageMs: number | null): string {
		if (ageMs === null) return 'bg-gray-400';
		if (ageMs < 5 * 60_000) return 'bg-green-500';
		if (ageMs < 30 * 60_000) return 'bg-yellow-500';
		return 'bg-red-500';
	}

	function freshnessLabel(ageMs: number | null): string {
		if (ageMs === null) return 'Belum pernah heartbeat';
		if (ageMs < 60_000) return 'Baru saja';
		if (ageMs < 5 * 60_000) return 'Aktif';
		if (ageMs < 30 * 60_000) return 'Perlu perhatian';
		return 'Tidak aktif';
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

	type SortableKey = Exclude<SortKey, 'status'>;
	const columns: { key: SortableKey; label: string; align?: 'left' | 'right' }[] = [
		{ key: 'code', label: 'Kode' },
		{ key: 'name', label: 'Nama / Hostname' },
		{ key: 'last_heartbeat', label: 'Last Heartbeat' },
		{ key: 'created_at', label: 'Dibuat' }
	];
</script>

<svelte:head>
	<title>Edges — CCTV Monitoring</title>
</svelte:head>

<PageHeader title="Edges" description="Daftar node CCTV yang terdaftar di sistem">
	{#snippet actions()}
		<Button variant="secondary" onclick={() => load()} disabled={loading}>
			<svg
				class="h-4 w-4 {loading ? 'animate-spin' : ''}"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
				/>
			</svg>
			Refresh
		</Button>
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

	{#if someSelected}
		<div
			class="flex items-center justify-between rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2"
			role="region"
			aria-label="Bulk actions"
		>
			<div class="text-sm text-indigo-900">
				<span class="font-medium">{selected.size}</span> dipilih
			</div>
			<div class="flex items-center gap-2">
				<button
					type="button"
					class="rounded-md px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
					onclick={() => {
						selected = new Set();
					}}
				>
					Batal
				</button>
				<button
					type="button"
					class="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
					disabled={bulkDeleting}
					onclick={() => (bulkConfirmOpen = true)}
				>
					Hapus {selected.size}
				</button>
			</div>
		</div>
	{/if}

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
							<th class="w-10 px-4 py-3">
								<input
									type="checkbox"
									class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
									checked={allSelected}
									indeterminate={!allSelected && someSelected}
									onchange={toggleAll}
									aria-label="Pilih semua di halaman ini"
								/>
							</th>
							{#each columns as col (col.key)}
								<th class="px-4 py-3 {col.align === 'right' ? 'text-right' : ''}">
									<button
										type="button"
										class="inline-flex items-center gap-1 font-medium uppercase tracking-wide text-gray-500 hover:text-gray-700"
										onclick={() => onSortChange(col.key)}
									>
										{col.label}
										{#if sortKey === col.key}
											<svg
												class="h-3 w-3"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												{#if sortOrder === 'asc'}
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M5 15l7-7 7 7"
													/>
												{:else}
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M19 9l-7 7-7-7"
													/>
												{/if}
											</svg>
										{:else}
											<svg
												class="h-3 w-3 text-gray-300"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M8 9l4-4 4 4m0 6l-4 4-4-4"
												/>
											</svg>
										{/if}
									</button>
								</th>
							{/each}
							<th class="px-4 py-3">Status</th>
							<th class="px-4 py-3 text-right">Aksi</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-100">
						{#each items as e (e.id)}
							{@const age = heartbeatAge(e.last_heartbeat)}
							<tr class="hover:bg-gray-50" class:bg-indigo-50={selected.has(e.id)}>
								<td class="px-4 py-3">
									<input
										type="checkbox"
										class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
										checked={selected.has(e.id)}
										onchange={() => toggleOne(e.id)}
										aria-label="Pilih {e.code}"
									/>
								</td>
								<td class="px-4 py-3">
									<div class="flex items-center gap-1.5">
										<a
											href="/edges/{e.id}"
											class="font-mono text-sm font-medium text-indigo-600 hover:underline"
										>
											{e.code}
										</a>
										<button
											type="button"
											class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
											aria-label="Salin kode"
											title="Salin kode"
											onclick={() => copyCode(e)}
										>
											{#if copiedId === e.id}
												<svg
													class="h-3.5 w-3.5 text-green-600"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M5 13l4 4L19 7"
													/>
												</svg>
											{:else}
												<svg
													class="h-3.5 w-3.5"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
													/>
												</svg>
											{/if}
										</button>
									</div>
								</td>
								<td class="px-4 py-3">
									<div class="font-medium text-gray-900">{e.name}</div>
									{#if e.hostname}
										<div class="text-xs text-gray-500">{e.hostname}</div>
									{/if}
								</td>
								<td class="px-4 py-3">
									<div class="flex items-center gap-2">
										<span
											class="inline-block h-2 w-2 shrink-0 rounded-full {freshnessColor(age)}"
											title={freshnessLabel(age)}
											aria-label={freshnessLabel(age)}
										></span>
										<div>
											<div class="text-sm text-gray-700">{relativeTime(e.last_heartbeat)}</div>
											{#if e.last_heartbeat}
												<div class="text-xs text-gray-400">{formatDate(e.last_heartbeat)}</div>
											{/if}
										</div>
									</div>
								</td>
								<td class="px-4 py-3 text-xs text-gray-500">{formatDate(e.created_at)}</td>
								<td class="px-4 py-3">
									<StatusBadge status={e.status} />
								</td>
								<td class="px-4 py-3 text-right">
									<div class="flex items-center justify-end gap-1">
										<a
											href="/edges/{e.id}"
											class="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
											aria-label="Detail"
											title="Detail"
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
											title="Edit"
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
											title="Hapus"
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

<ConfirmDialog
	open={bulkConfirmOpen}
	title={`Hapus ${selected.size} Edge?`}
	message="Semua edge yang dipilih akan dihapus permanen. Tindakan ini tidak dapat dibatalkan."
	confirmText="Hapus Semua"
	variant="danger"
	loading={bulkDeleting}
	onconfirm={confirmBulkDelete}
	oncancel={() => (bulkConfirmOpen = false)}
/>
