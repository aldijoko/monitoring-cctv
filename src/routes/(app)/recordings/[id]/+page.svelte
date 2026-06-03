<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { recordingsApi } from '$lib/api/recordings';
	import { formatBytes, formatDuration, formatDateTime, formatRelativeTime } from '$lib/utils/format';
	import type { Recording } from '$lib/types/api';

	const id = $derived(Number(page.params.id));
	let recording = $state<Recording | null>(null);
	let loading = $state(true);
	let notFound = $state(false);
	let copied = $state(false);

	async function load() {
		loading = true;
		notFound = false;
		try {
			const r = await recordingsApi.get(id);
			if (!r) {
				notFound = true;
			} else {
				recording = r;
			}
		} finally {
			loading = false;
		}
	}

	function copyUrl(url: string) {
		navigator.clipboard.writeText(url).then(() => {
			copied = true;
			setTimeout(() => (copied = false), 2000);
		});
	}

	function downloadFile() {
		if (!recording) return;
		// For HLS recordings the server can produce an MP4 download.
		const url = `/api/v1/recordings/${recording.id}/download?format=mp4`;
		window.open(url, '_blank');
	}

	function goBack() {
		history.length > 1 ? history.back() : goto('/recordings');
	}

	onMount(load);
</script>

<div class="space-y-6">
	<nav class="text-sm text-gray-500">
		<a href="/recordings" class="hover:text-gray-700">Recordings</a>
		<span class="mx-2">/</span>
		<span class="text-gray-900">Detail</span>
	</nav>

	{#if loading}
		<div class="rounded-lg border border-gray-200 bg-white p-12 text-center text-sm text-gray-500">
			Memuat recording...
		</div>
	{:else if notFound || !recording}
		<div
			class="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center"
		>
			<h2 class="text-lg font-semibold text-gray-900">Recording tidak ditemukan</h2>
			<p class="mt-2 text-sm text-gray-500">
				Recording dengan ID <code class="font-mono">{id}</code> tidak ada atau sudah dihapus.
			</p>
			<button
				type="button"
				class="mt-4 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
				onclick={goBack}
			>
				Kembali
			</button>
		</div>
	{:else}
		{@const r = recording}
		<header class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<h1 class="font-mono text-xl font-semibold text-gray-900">{r.filename}</h1>
				<p class="text-sm text-gray-500">
					{r.edge_code} • {r.camera_name} • {formatRelativeTime(r.started_at)}
				</p>
			</div>
			<div class="flex flex-wrap gap-2">
				<button
					type="button"
					class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
					onclick={goBack}
				>
					Kembali
				</button>
				<button
					type="button"
					class="rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700"
					onclick={downloadFile}
				>
					Download MP4
				</button>
			</div>
		</header>

		<div class="grid gap-6 lg:grid-cols-3">
			<section class="lg:col-span-2">
				<div class="rounded-lg border border-gray-200 bg-black">
					{#if r.playback_url}
						<video
							controls
							preload="metadata"
							class="aspect-video w-full"
							poster={r.thumbnail_url}
						>
							<source src={r.playback_url} type="application/x-mpegURL" />
							<track kind="captions" />
							Browser Anda tidak mendukung playback video.
						</video>
					{:else}
						<div
							class="flex aspect-video w-full items-center justify-center text-sm text-gray-400"
						>
							Tidak ada source playback
						</div>
					{/if}
				</div>

				<div class="mt-4 rounded-lg border border-gray-200 bg-white p-4">
					<h2 class="mb-3 text-sm font-semibold text-gray-900">Playback URL</h2>
					<div class="flex items-center gap-2">
						<code
							class="flex-1 truncate rounded-md bg-gray-50 px-3 py-2 font-mono text-xs text-gray-700"
						>
							{r.playback_url ?? '—'}
						</code>
						{#if r.playback_url}
							<button
								type="button"
								class="rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
								onclick={() => copyUrl(r.playback_url!)}
							>
								{copied ? 'Tersalin!' : 'Copy'}
							</button>
						{/if}
					</div>
				</div>
			</section>

			<aside class="space-y-4">
				<div class="rounded-lg border border-gray-200 bg-white p-4">
					<h2 class="mb-3 text-sm font-semibold text-gray-900">Informasi</h2>
					<dl class="space-y-2 text-sm">
						<div class="flex justify-between">
							<dt class="text-gray-500">ID</dt>
							<dd class="font-mono text-gray-900">{r.id}</dd>
						</div>
						<div class="flex justify-between">
							<dt class="text-gray-500">Edge</dt>
							<dd class="text-gray-900">{r.edge_code}</dd>
						</div>
						<div class="flex justify-between">
							<dt class="text-gray-500">Camera</dt>
							<dd class="text-gray-900">{r.camera_name}</dd>
						</div>
						<div class="flex justify-between">
							<dt class="text-gray-500">Duration</dt>
							<dd class="text-gray-900">{formatDuration(r.duration_seconds)}</dd>
						</div>
						<div class="flex justify-between">
							<dt class="text-gray-500">Size</dt>
							<dd class="text-gray-900">{formatBytes(r.size_bytes)}</dd>
						</div>
					</dl>
				</div>

				<div class="rounded-lg border border-gray-200 bg-white p-4">
					<h2 class="mb-3 text-sm font-semibold text-gray-900">Timeline</h2>
					<dl class="space-y-2 text-sm">
						<div>
							<dt class="text-xs text-gray-500 uppercase">Mulai</dt>
							<dd class="text-gray-900">{formatDateTime(r.started_at)}</dd>
						</div>
						<div>
							<dt class="text-xs text-gray-500 uppercase">Selesai</dt>
							<dd class="text-gray-900">{formatDateTime(r.ended_at)}</dd>
						</div>
					</dl>
				</div>

				<div class="rounded-lg border border-gray-200 bg-white p-4">
					<h2 class="mb-3 text-sm font-semibold text-gray-900">Storage</h2>
					<dl class="space-y-2 text-sm">
						<div>
							<dt class="text-xs text-gray-500 uppercase">Path</dt>
							<dd class="break-all font-mono text-xs text-gray-700">{r.storage_path}</dd>
						</div>
					</dl>
				</div>
			</aside>
		</div>
	{/if}
</div>
