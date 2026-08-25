<script lang="ts">
	import StreamPlayer, { type PlaybackStatus } from '$lib/components/StreamPlayer.svelte';
	import CameraPicker from '$lib/components/CameraPicker.svelte';
	import { listCameras } from '$lib/api/cameras';
	import type { LiveCamera } from '$lib/types/api';
	import type { PageProps } from './$types';

	type Layout = '1x1' | '2x2' | '3x3' | '4x4';

	let { data }: PageProps = $props();

	let streams = $state<LiveCamera[]>(data.cameras);
	let selected = $state<number[]>([]);
	let layout = $state<Layout>('2x2');
	let loading = $state(false);
	let error = $state<string | null>(null);
	let showPicker = $state(false);
	let fullscreenStreamId = $state<number | null>(null);
	let playbackStatus = $state<Record<number, PlaybackStatus>>({});

	const maxSlots: Record<Layout, number> = {
		'1x1': 1,
		'2x2': 4,
		'3x3': 9,
		'4x4': 16
	};

	const gridCols: Record<Layout, string> = {
		'1x1': 'grid-cols-1',
		'2x2': 'grid-cols-2',
		'3x3': 'grid-cols-3',
		'4x4': 'grid-cols-4'
	};

	const gridRows: Record<Layout, string> = {
		'1x1': 'grid-rows-1',
		'2x2': 'grid-rows-2',
		'3x3': 'grid-rows-3',
		'4x4': 'grid-rows-4'
	};

	async function loadStreams() {
		loading = true;
		error = null;
		try {
			const res = await listCameras();
			streams = res.cameras.filter((c) => c.enabled);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Gagal memuat stream';
		} finally {
			loading = false;
		}
	}

	function handlePickCamera(streamId: number) {
		const slot = maxSlots[layout];
		if (selected.includes(streamId)) {
			selected = selected.filter((x) => x !== streamId);
		} else if (selected.length < slot) {
			selected = [...selected, streamId];
		} else {
			// Replace first
			selected = [...selected.slice(1), streamId];
		}
	}

	function autoFill() {
		const slot = maxSlots[layout];
		selected = streams.slice(0, slot).map((s) => s.id);
	}

	function clearAll() {
		selected = [];
	}

	function onStatusChange(streamId: number, status: PlaybackStatus) {
		playbackStatus = { ...playbackStatus, [streamId]: status };
	}

	function onLayoutChange(newLayout: Layout) {
		layout = newLayout;
		const slot = maxSlots[newLayout];
		if (selected.length > slot) {
			selected = selected.slice(0, slot);
		}
	}

	function toggleFullscreen(streamId: number) {
		fullscreenStreamId = fullscreenStreamId === streamId ? null : streamId;
	}

	const selectedStreams = $derived(streams.filter((s) => selected.includes(s.id)));
</script>

<svelte:head>
	<title>Live Monitoring — CCTV</title>
</svelte:head>

<div class="flex h-full flex-col gap-3 p-4">
	<!-- Toolbar -->
	<div class="flex flex-shrink-0 flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
		<div class="flex items-center gap-3">
			<h1 class="text-lg font-semibold text-gray-900">Live Monitoring</h1>
			<span class="text-sm text-gray-500">
				{selected.length} / {maxSlots[layout]} kamera
			</span>
		</div>

		<div class="flex flex-wrap items-center gap-2">
			<!-- Layout switcher -->
			<div class="inline-flex rounded-md border border-gray-200 bg-white p-0.5">
				{#each ['1x1', '2x2', '3x3', '4x4'] as l (l)}
					<button
						type="button"
						class="rounded px-2.5 py-1 text-xs font-medium transition {layout === l
							? 'bg-blue-600 text-white'
							: 'text-gray-600 hover:bg-gray-100'}"
						onclick={() => onLayoutChange(l as Layout)}
						aria-pressed={layout === l}
					>
						{l}
					</button>
				{/each}
			</div>

			<button
				type="button"
				class="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
				onclick={autoFill}
				disabled={loading || streams.length === 0}
			>
				Auto-fill
			</button>
			<button
				type="button"
				class="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
				onclick={clearAll}
				disabled={selected.length === 0}
			>
				Clear
			</button>
			<button
				type="button"
				class="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
				onclick={() => (showPicker = true)}
				disabled={loading}
			>
				+ Pilih Kamera
			</button>
			<button
				type="button"
				class="rounded-md border border-gray-200 bg-white p-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50"
				onclick={loadStreams}
				disabled={loading}
				aria-label="Refresh"
			>
				<svg class="h-4 w-4 {loading ? 'animate-spin' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
				</svg>
			</button>
		</div>
	</div>

	<!-- Error -->
	{#if error}
		<div class="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
			{error}
			<button type="button" class="ml-2 underline" onclick={loadStreams}>Coba lagi</button>
		</div>
	{/if}

	<!-- Grid -->
	{#if loading}
		<div class="grid min-h-0 flex-1 gap-3 {gridCols[layout]} {gridRows[layout]}">
			{#each Array(maxSlots[layout]) as _, i (i)}
				<div class="min-h-0 animate-pulse rounded-lg bg-gray-200"></div>
			{/each}
		</div>
	{:else if selectedStreams.length === 0}
		<div class="flex min-h-0 flex-1 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white">
			<div class="text-center">
				<svg class="mx-auto h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
				</svg>
				<h3 class="mt-2 text-sm font-medium text-gray-900">Belum ada kamera dipilih</h3>
				<p class="mt-1 text-sm text-gray-500">Klik "+ Pilih Kamera" untuk mulai monitoring</p>
				<button
					type="button"
					class="mt-3 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
					onclick={() => (showPicker = true)}
				>
					Pilih Kamera
				</button>
			</div>
		</div>
	{:else}
		<div class="grid min-h-0 flex-1 gap-3 {gridCols[layout]} {gridRows[layout]}">
			{#each selectedStreams as stream (stream.id)}
				<div
					class="group relative min-h-0 overflow-hidden rounded-lg bg-black shadow-md ring-1 ring-gray-900/5"
					class:fixed={fullscreenStreamId === stream.id}
					class:inset-0={fullscreenStreamId === stream.id}
					class:z-50={fullscreenStreamId === stream.id}
				>
					<StreamPlayer
						{stream}
						controls={false}
						muted
						onstatuschange={(s) => onStatusChange(stream.id, s)}
					/>
					<!-- Fullscreen toggle -->
					<button
						type="button"
						class="absolute right-2 top-10 z-20 rounded bg-black/60 p-1 text-white opacity-0 backdrop-blur transition group-hover:opacity-100"
						onclick={() => toggleFullscreen(stream.id)}
						aria-label="Fullscreen"
					>
						{#if fullscreenStreamId === stream.id}
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						{:else}
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
							</svg>
						{/if}
					</button>
				</div>
			{/each}

			<!-- Empty slot hints -->
			{#each Array(maxSlots[layout] - selectedStreams.length) as _, i (i)}
				<button
					type="button"
					class="flex aspect-video items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white text-gray-400 transition hover:border-blue-400 hover:text-blue-500"
					onclick={() => (showPicker = true)}
				>
					<div class="text-center">
						<svg class="mx-auto h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
						</svg>
						<span class="mt-1 block text-xs">Tambah kamera</span>
					</div>
				</button>
			{/each}
		</div>
	{/if}
</div>

<!-- Camera Picker Drawer -->
{#if showPicker}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		role="dialog"
		aria-modal="true"
	>
		<button
			type="button"
			class="absolute inset-0 cursor-default"
			aria-label="Tutup"
			onclick={() => (showPicker = false)}
		></button>
		<div class="relative w-full max-w-lg">
			<CameraPicker
				{streams}
				{selected}
				onpick={handlePickCamera}
				onclose={() => (showPicker = false)}
			/>
		</div>
	</div>
{/if}
