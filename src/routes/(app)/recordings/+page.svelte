<script lang="ts">
	import { goto } from '$app/navigation';
	import { navigating } from '$app/state';
	import { toasts } from '$lib/stores/toast';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Button from '$lib/components/Button.svelte';
	import { formatBytes, formatDuration, formatDateTime } from '$lib/utils/format';
	import { recordingsApi } from '$lib/api/recordings';
	import type { PageProps } from './$types';

	type SortKey = 'started_at' | 'size_bytes' | 'duration_seconds' | 'edge_code';

	let { data }: PageProps = $props();

	let items = $derived(data.recordings.items);
	let total = $derived(data.recordings.total);
	let pageSize = $derived(data.filters.pageSize);
	let currentPage = $derived(data.filters.page);
	let totalPages = $derived(Math.max(1, Math.ceil(total / pageSize)));
	let loading = $derived(!!navigating.to);

	let search = $state(data.filters.search);
	let edgeFilter = $state(data.filters.edgeId);
	let cameraFilter = $state(data.filters.cameraId);
	let dateFrom = $state(data.filters.dateFrom);
	let dateTo = $state(data.filters.dateTo);
	let sort = $state<SortKey>(data.filters.sort as SortKey);
	let order = $state<'asc' | 'desc'>(data.filters.order);

	$effect(() => {
		search = data.filters.search;
		edgeFilter = data.filters.edgeId;
		cameraFilter = data.filters.cameraId;
		dateFrom = data.filters.dateFrom;
		dateTo = data.filters.dateTo;
		sort = data.filters.sort as SortKey;
		order = data.filters.order;
	});

	let selectedIds = $state<number[]>([]);
	let showArchiveDialog = $state(false);
	let archiving = $state(false);
	let archiveFormat = $state<'mp4' | 'zip'>('mp4');

	const visibleCameras = $derived(
		edgeFilter === 'all' ? data.cameras : data.cameras.filter((c) => String(c.edge_id) === edgeFilter)
	);

	function applyFilters(overrides: {
		search?: string;
		edgeId?: string;
		cameraId?: string;
		dateFrom?: string;
		dateTo?: string;
		sort?: SortKey;
		order?: 'asc' | 'desc';
		page?: number;
	}) {
		const s = overrides.search ?? search;
		const eid = overrides.edgeId ?? edgeFilter;
		const cid = overrides.cameraId ?? cameraFilter;
		const df = overrides.dateFrom ?? dateFrom;
		const dt = overrides.dateTo ?? dateTo;
		const sk = overrides.sort ?? sort;
		const so = overrides.order ?? order;
		const p = overrides.page ?? 1;

		const params = new URLSearchParams();
		if (s) params.set('search', s);
		if (eid !== 'all') params.set('edge_id', eid);
		if (cid !== 'all') params.set('camera_id', cid);
		if (df) params.set('date_from', df);
		if (dt) params.set('date_to', dt);
		if (sk !== 'started_at') params.set('sort', sk);
		if (so !== 'desc') params.set('order', so);
		if (p > 1) params.set('page', String(p));

		goto(params.toString() ? `/recordings?${params}` : '/recordings', { keepFocus: true });
	}

	let debounceTimer: ReturnType<typeof setTimeout> | null = null;
	function handleSearchInput(e: Event) {
		search = (e.currentTarget as HTMLInputElement).value;
		if (debounceTimer) clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => applyFilters({ search, page: 1 }), 300);
	}

	function handleEdgeChange(e: Event) {
		edgeFilter = (e.currentTarget as HTMLSelectElement).value;
		// reset camera filter if it no longer belongs to the selected edge
		const cam = data.cameras.find((c) => String(c.id) === cameraFilter);
		const nextCamera = cam && String(cam.edge_id) !== edgeFilter ? 'all' : cameraFilter;
		applyFilters({ edgeId: edgeFilter, cameraId: nextCamera, page: 1 });
	}

	function handleCameraChange(e: Event) {
		cameraFilter = (e.currentTarget as HTMLSelectElement).value;
		applyFilters({ cameraId: cameraFilter, page: 1 });
	}

	function handleDateFromChange(e: Event) {
		dateFrom = (e.currentTarget as HTMLInputElement).value;
		applyFilters({ dateFrom, page: 1 });
	}

	function handleDateToChange(e: Event) {
		dateTo = (e.currentTarget as HTMLInputElement).value;
		applyFilters({ dateTo, page: 1 });
	}

	function handleSort(col: SortKey) {
		const nextOrder = sort === col ? (order === 'asc' ? 'desc' : 'asc') : 'desc';
		applyFilters({ sort: col, order: nextOrder, page: 1 });
	}

	function toggleSelect(id: number) {
		if (selectedIds.includes(id)) {
			selectedIds = selectedIds.filter((x) => x !== id);
		} else {
			selectedIds = [...selectedIds, id];
		}
	}

	function toggleSelectAll() {
		const visibleIds = items.map((i) => i.id);
		const allSelected =
			visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
		if (allSelected) {
			selectedIds = selectedIds.filter((id) => !visibleIds.includes(id));
		} else {
			selectedIds = Array.from(new Set([...selectedIds, ...visibleIds]));
		}
	}

	function clearSelection() {
		selectedIds = [];
	}

	function openArchive() {
		if (selectedIds.length === 0) return;
		archiveFormat = 'mp4';
		showArchiveDialog = true;
	}

	async function handleArchiveConfirm() {
		archiving = true;
		try {
			const result = await recordingsApi.archiveBulk(selectedIds, archiveFormat);
			showArchiveDialog = false;
			toasts.success(`Arsip ${result.item_count} recording berhasil dibuat`);
			selectedIds = [];
			window.open(result.archive_url, '_blank');
		} catch (err) {
			toasts.error((err as Error).message);
		} finally {
			archiving = false;
		}
	}

	function handleRowClick(id: number, event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (target.closest('input,button,a,label')) return;
		goto(`/recordings/${id}`);
	}

	function sortIcon(col: SortKey) {
		if (sort !== col) return '↕';
		return order === 'asc' ? '↑' : '↓';
	}
</script>

<svelte:head>
	<title>Recordings — CCTV Monitoring</title>
</svelte:head>

<PageHeader
	title="Recordings"
	description="Arsip rekaman dari semua edge & camera"
/>

<div class="space-y-4 p-6">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div class="text-sm text-gray-500">
			{#if loading}
				Memuat...
			{:else}
				<span class="font-medium text-gray-900">{total}</span> recording
			{/if}
		</div>
		{#if selectedIds.length > 0}
			<div class="flex items-center gap-2">
				<span class="text-sm text-gray-600">{selectedIds.length} dipilih</span>
				<Button variant="secondary" size="sm" onclick={clearSelection}>Batal</Button>
				<Button size="sm" onclick={openArchive}>Arsipkan ({selectedIds.length})</Button>
			</div>
		{/if}
	</div>

	<section class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
		<div class="grid gap-3 border-b border-gray-200 p-4 md:grid-cols-5">
			<div class="md:col-span-2">
				<label for="search-rec" class="sr-only">Cari</label>
				<input
					id="search-rec"
					type="search"
					placeholder="Cari filename, edge, atau camera..."
					class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none"
					value={search}
					oninput={handleSearchInput}
				/>
			</div>
			<select
				class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none"
				value={edgeFilter}
				onchange={handleEdgeChange}
			>
				<option value="all">Semua Edge</option>
				{#each data.edges as edge (edge.id)}
					<option value={String(edge.id)}>{edge.code} — {edge.name}</option>
				{/each}
			</select>
			<select
				class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none"
				value={cameraFilter}
				onchange={handleCameraChange}
				disabled={visibleCameras.length === 0}
			>
				<option value="all">Semua Camera</option>
				{#each visibleCameras as cam (cam.id)}
					<option value={String(cam.id)}>{cam.name}</option>
				{/each}
			</select>
			<div class="flex gap-2">
				<input
					type="date"
					aria-label="Dari tanggal"
					class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none"
					value={dateFrom}
					onchange={handleDateFromChange}
				/>
				<input
					type="date"
					aria-label="Sampai tanggal"
					class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none"
					value={dateTo}
					onchange={handleDateToChange}
				/>
			</div>
		</div>

		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead
					class="bg-gray-50 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
				>
					<tr>
						<th class="w-10 px-4 py-3">
							<input
								type="checkbox"
								aria-label="Pilih semua"
								class="rounded border-gray-300"
								checked={items.length > 0 &&
									items.every((i) => selectedIds.includes(i.id))}
								onchange={toggleSelectAll}
							/>
						</th>
						<th
							class="cursor-pointer px-4 py-3"
							onclick={() => handleSort('edge_code')}
							role="button"
							tabindex="0"
						>
							Edge {sortIcon('edge_code')}
						</th>
						<th class="px-4 py-3">Camera</th>
						<th class="px-4 py-3">Filename</th>
						<th
							class="cursor-pointer px-4 py-3"
							onclick={() => handleSort('started_at')}
							role="button"
							tabindex="0"
						>
							Started {sortIcon('started_at')}
						</th>
						<th
							class="cursor-pointer px-4 py-3"
							onclick={() => handleSort('duration_seconds')}
							role="button"
							tabindex="0"
						>
							Duration {sortIcon('duration_seconds')}
						</th>
						<th
							class="cursor-pointer px-4 py-3"
							onclick={() => handleSort('size_bytes')}
							role="button"
							tabindex="0"
						>
							Size {sortIcon('size_bytes')}
						</th>
						<th class="px-4 py-3 text-right">Aksi</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200">
					{#if loading}
						<tr>
							<td colspan="8" class="px-4 py-12 text-center text-sm text-gray-500">
								Memuat...
							</td>
						</tr>
					{:else if items.length === 0}
						<tr>
							<td colspan="8" class="px-4 py-12">
								<EmptyState
									title="Tidak ada recording"
									message="Coba ubah filter atau rentang waktu."
								/>
							</td>
						</tr>
					{:else}
						{#each items as r (r.id)}
							<tr
								class="cursor-pointer hover:bg-gray-50"
								onclick={(e) => handleRowClick(r.id, e)}
							>
								<td class="px-4 py-3">
									<input
										type="checkbox"
										aria-label={`Pilih recording ${r.filename}`}
										class="rounded border-gray-300"
										checked={selectedIds.includes(r.id)}
										onchange={() => toggleSelect(r.id)}
										onclick={(e) => e.stopPropagation()}
									/>
								</td>
								<td class="px-4 py-3 font-mono text-xs text-gray-700">{r.edge_code}</td>
								<td class="px-4 py-3 text-gray-900">{r.camera_name}</td>
								<td
									class="max-w-xs truncate px-4 py-3 font-mono text-xs text-gray-600"
									title={r.filename}
								>
									{r.filename}
								</td>
								<td class="px-4 py-3 text-gray-600">{formatDateTime(r.started_at)}</td>
								<td class="px-4 py-3 text-gray-600">{formatDuration(r.duration_seconds)}</td>
								<td class="px-4 py-3 text-gray-600">{formatBytes(r.size_bytes)}</td>
								<td class="px-4 py-3 text-right">
									<a
										href={`/recordings/${r.id}`}
										class="font-medium text-brand-600 hover:text-brand-700"
										onclick={(e) => e.stopPropagation()}
									>
										Detail
									</a>
								</td>
							</tr>
						{/each}
					{/if}
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
	</section>
</div>

<Modal
	bind:open={showArchiveDialog}
	title="Arsipkan Recording"
	size="md"
>
	{#snippet children()}
		<p class="text-sm text-gray-600">
			Buat arsip dari <span class="font-medium text-gray-900">{selectedIds.length}</span> recording.
			Arsip akan tersedia untuk diunduh selama 1 jam.
		</p>
		<fieldset class="mt-4 space-y-2">
			<legend class="text-sm font-medium text-gray-700">Format</legend>
			<div class="flex gap-2">
				<label
					class={'flex flex-1 cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm ' +
						(archiveFormat === 'mp4'
							? 'border-brand-500 bg-brand-50'
							: 'border-gray-300 bg-white')}
				>
					<input type="radio" class="sr-only" bind:group={archiveFormat} value="mp4" />
					<div>
						<div class="font-medium text-gray-900">MP4 (gabung)</div>
						<div class="text-xs text-gray-500">File MP4 tunggal (jika backend mendukung)</div>
					</div>
				</label>
				<label
					class={'flex flex-1 cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm ' +
						(archiveFormat === 'zip'
							? 'border-brand-500 bg-brand-50'
							: 'border-gray-300 bg-white')}
				>
					<input type="radio" class="sr-only" bind:group={archiveFormat} value="zip" />
					<div>
						<div class="font-medium text-gray-900">ZIP</div>
						<div class="text-xs text-gray-500">Semua file dikompres dalam ZIP</div>
					</div>
				</label>
			</div>
		</fieldset>
	{/snippet}
	{#snippet footer()}
		<Button variant="secondary" onclick={() => (showArchiveDialog = false)} disabled={archiving}>
			Batal
		</Button>
		<Button onclick={handleArchiveConfirm} loading={archiving}>
			{archiving ? 'Memproses...' : 'Buat Arsip'}
		</Button>
	{/snippet}
</Modal>
