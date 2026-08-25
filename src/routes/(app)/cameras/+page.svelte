<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { navigating } from '$app/state';
	import { updateCamera, deleteCamera } from '$lib/api/cameras';
	import { toasts as toast } from '$lib/stores/toast';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import type { LiveCamera, CameraStatus } from '$lib/types/api';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let search = $state(data.filters.search);
	let filterStatus = $state<'' | CameraStatus>(data.filters.status);
	let loading = $derived(!!navigating.to);

	$effect(() => {
		search = data.filters.search;
		filterStatus = data.filters.status;
	});

	function applyFilters(overrides: { search?: string; status?: '' | CameraStatus }) {
		const s = overrides.search ?? search;
		const st = overrides.status ?? filterStatus;
		const params = new URLSearchParams();
		if (s) params.set('search', s);
		if (st) params.set('status', st);
		goto(params.toString() ? `/cameras?${params}` : '/cameras', { keepFocus: true });
	}

	let searchDebounce: ReturnType<typeof setTimeout> | null = null;
	function onSearchInput(e: Event) {
		search = (e.currentTarget as HTMLInputElement).value;
		if (searchDebounce) clearTimeout(searchDebounce);
		searchDebounce = setTimeout(() => applyFilters({ search }), 300);
	}

	function onStatusChange(e: Event) {
		filterStatus = (e.currentTarget as HTMLSelectElement).value as '' | CameraStatus;
		applyFilters({ status: filterStatus });
	}

	async function toggleActive(camera: LiveCamera) {
		try {
			await updateCamera(camera.id, { enabled: !camera.enabled });
			toast.success(
				`Kamera ${camera.name} ${!camera.enabled ? 'diaktifkan' : 'dinonaktifkan'}`
			);
			await invalidateAll();
		} catch (err) {
			toast.error((err as Error).message);
		}
	}

	async function remove(camera: LiveCamera) {
		if (!confirm(`Hapus kamera ${camera.name}?`)) return;
		try {
			await deleteCamera(camera.id);
			toast.success(`Kamera ${camera.name} dihapus`);
			await invalidateAll();
		} catch (err) {
			toast.error((err as Error).message);
		}
	}
</script>

<svelte:head><title>Kamera — Monitoring CCTV</title></svelte:head>

<PageHeader title="Kamera" subtitle="Daftar semua kamera yang terhubung ke platform">
	{#snippet actions()}
		<a
			href="/cameras/new"
			class="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500"
		>
			Tambah Kamera
		</a>
	{/snippet}
</PageHeader>

<div class="mb-4 flex flex-wrap items-center gap-2">
	<input
		type="search"
		value={search}
		oninput={onSearchInput}
		placeholder="Cari nama / edge…"
		class="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
	/>
	<select
		value={filterStatus}
		onchange={onStatusChange}
		class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
	>
		<option value="">Semua status</option>
		<option value="recording">Recording</option>
		<option value="online">Online</option>
		<option value="offline">Offline</option>
		<option value="error">Error</option>
	</select>
	<button
		onclick={() => invalidateAll()}
		class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
	>
		Refresh
	</button>
</div>

{#if loading}
	<div class="py-12 text-center text-sm text-gray-500">Memuat kamera…</div>
{:else if data.cameras.length === 0}
	<EmptyState
		title={search || filterStatus ? 'Tidak ada hasil' : 'Belum ada kamera'}
		message={search || filterStatus
			? 'Coba kata kunci atau filter lain.'
			: 'Tambahkan kamera RTSP/ONVIF untuk mulai merekam.'}
	>
		{#snippet action()}
			{#if !search && !filterStatus}
				<a
					href="/cameras/new"
					class="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500"
				>
					Tambah Kamera
				</a>
			{/if}
		{/snippet}
	</EmptyState>
{:else}
	<div class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
		<table class="w-full text-sm">
			<thead class="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
				<tr>
					<th class="px-4 py-3">Nama</th>
					<th class="px-4 py-3">Edge</th>
					<th class="px-4 py-3">Channel</th>
					<th class="px-4 py-3">Resolusi / FPS</th>
					<th class="px-4 py-3">Status</th>
					<th class="px-4 py-3 text-right">Aksi</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-100">
				{#each data.cameras as camera (camera.id)}
					<tr class="hover:bg-gray-50">
						<td class="px-4 py-3">
							<a href="/cameras/{camera.id}" class="font-medium text-gray-900 hover:text-indigo-600">
								{camera.name}
							</a>
							<div class="text-xs text-gray-400">{camera.codec}</div>
						</td>
						<td class="px-4 py-3 text-gray-600">{camera.edge_name}</td>
						<td class="px-4 py-3 text-gray-600">CH {camera.channel}</td>
						<td class="px-4 py-3 text-gray-600">
							{camera.resolution} @ {camera.fps}fps
						</td>
						<td class="px-4 py-3">
							{#if !camera.enabled}
								<StatusBadge status="inactive" label="Nonaktif" />
							{:else if camera.status === 'recording'}
								<StatusBadge status="recording" label="Recording" />
							{:else if camera.status === 'online'}
								<StatusBadge status="online" label="Online" />
							{:else if camera.status === 'offline'}
								<StatusBadge status="offline" label="Offline" />
							{:else}
								<StatusBadge status="error" label="Error" />
							{/if}
						</td>
						<td class="px-4 py-3 text-right">
							<button
								onclick={() => toggleActive(camera)}
								class="mr-2 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
							>
								{camera.enabled ? 'Nonaktifkan' : 'Aktifkan'}
							</button>
							<a
								href="/cameras/{camera.id}/edit"
								class="mr-2 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
							>
								Edit
							</a>
							<button
								onclick={() => remove(camera)}
								class="rounded-md border border-red-300 bg-white px-2 py-1 text-xs text-red-700 hover:bg-red-50"
							>
								Hapus
							</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
