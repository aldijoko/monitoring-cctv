<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { toasts } from '$lib/stores/toast';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Button from '$lib/components/Button.svelte';
	import { formatBytes, formatDuration, formatDateTime } from '$lib/utils/format';
	import { recordingsApi } from '$lib/api/recordings';
	import { edgesApi } from '$lib/api/edges';
	import type { Recording, Edge } from '$lib/types/api';
	import type { CameraOption } from '$lib/mocks/recordings';

	let search = $state('');
	let edgeFilter = $state<string>('all');
	let cameraFilter = $state<string>('all');
	let dateFrom = $state<string>('');
	let dateTo = $state<string>('');
	const pageSize = 10;
	let page = $state(1);
	const offset = $derived((page - 1) * pageSize);
	let sort = $state<'started_at' | 'size_bytes' | 'duration_seconds' | 'edge_code'>(
		'started_at'
	);
	let order = $state<'asc' | 'desc'>('desc');

	let items = $state<Recording[]>([]);
	let total = $state(0);
	let totalPages = $derived(Math.max(1, Math.ceil(total / pageSize)));
	let loading = $state(true);
	let edges = $state<Edge[]>([]);
	let cameras = $state<CameraOption[]>([]);
	let selectedIds = $state<number[]>([]);
	let showArchiveDialog = $state(false);
	let archiving = $state(false);
	let archiveFormat = $state<'mp4' | 'zip'>('mp4');

	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	const visibleCameras = $derived(
		edgeFilter === 'all' ? cameras : cameras.filter((c) => c.edge_id === Number(edgeFilter))
	);

	async function load() {
		loading = true;
		try {
			const res = await recordingsApi.list({
				search: search || undefined,
				edge_id: edgeFilter === 'all' ? 'all' : Number(edgeFilter),
				camera_id: cameraFilter === 'all' ? 'all' : Number(cameraFilter),
				date_from: dateFrom || undefined,
				date_to: dateTo || undefined,
				limit: pageSize,
				offset,
				sort,
				order
			});
			items = res.items;
			total = res.total;
			selectedIds = selectedIds.filter((id) => res.items.some((i) => i.id === id));
		} catch (err) {
			toasts.error((err as Error).message);
		} finally {
			loading = false;
		}
	}

	function handleSearchInput() {
		if (debounceTimer) clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			page = 1;
			load();
		}, 300);
	}

	function handleFilterChange() {
		page = 1;
		if (cameraFilter !== 'all' && edgeFilter !== 'all') {
			const cam = cameras.find((c) => c.id === Number(cameraFilter));
			if (cam && cam.edge_id !== Number(edgeFilter)) {
				cameraFilter = 'all';
			}
		}
		load();
	}

	function handleSort(col: typeof sort) {
		if (sort === col) {
			order = order === 'asc' ? 'desc' : 'asc';
		} else {
			sort = col;
			order = 'desc';
		}
		load();
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

	function sortIcon(col: typeof sort) {
		if (sort !== col) return '↕';
		return order === 'asc' ? '↑' : '↓';
	}

	onMount(async () => {
		try {
			[edges, cameras] = await Promise.all([
				edgesApi.list().then((p) => p.items),
				recordingsApi.cameras()
			]);
			await load();
		} catch (err) {
			toasts.error((err as Error).message);
		}
	});
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
					bind:value={search}
					oninput={handleSearchInput}
				/>
			</div>
			<select
				class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none"
				bind:value={edgeFilter}
				onchange={handleFilterChange}
			>
				<option value="all">Semua Edge</option>
				{#each edges as edge (edge.id)}
					<option value={String(edge.id)}>{edge.code} — {edge.name}</option>
				{/each}
			</select>
			<select
				class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none"
				bind:value={cameraFilter}
				onchange={handleFilterChange}
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
					bind:value={dateFrom}
					onchange={handleFilterChange}
				/>
				<input
					type="date"
					aria-label="Sampai tanggal"
					class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none"
					bind:value={dateTo}
					onchange={handleFilterChange}
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
			{page}
			{totalPages}
			{total}
			{pageSize}
			onchange={(p) => {
				page = p;
				load();
			}}
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
