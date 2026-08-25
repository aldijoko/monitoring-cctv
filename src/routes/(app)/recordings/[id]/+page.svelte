<script lang="ts">
	import { goto } from '$app/navigation';
	import { recordingsApi } from '$lib/api/recordings';
	import { toast } from '$lib/stores/toast';
	import { formatBytes, formatDuration, formatDateTime, formatRelativeTime } from '$lib/utils/format';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let copied = $state(false);
	let downloading = $state(false);

	function copyUrl(url: string) {
		navigator.clipboard.writeText(url).then(() => {
			copied = true;
			setTimeout(() => (copied = false), 2000);
		});
	}

	async function downloadFile() {
		downloading = true;
		try {
			const result = await recordingsApi.archiveBulk([data.recording.id], 'mp4');
			window.open(result.archive_url, '_blank');
		} catch (err) {
			toast.error((err as Error).message);
		} finally {
			downloading = false;
		}
	}

	function goBack() {
		history.length > 1 ? history.back() : goto('/recordings');
	}
</script>

<div class="space-y-6">
	<nav class="text-sm text-gray-500">
		<a href="/recordings" class="hover:text-gray-700">Recordings</a>
		<span class="mx-2">/</span>
		<span class="text-gray-900">Detail</span>
	</nav>

	<header class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="font-mono text-xl font-semibold text-gray-900">{data.recording.filename}</h1>
			<p class="text-sm text-gray-500">
				{data.recording.edge_code} • {data.recording.camera_name} • {formatRelativeTime(
					data.recording.started_at
				)}
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
				class="rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
				onclick={downloadFile}
				disabled={downloading}
			>
				{downloading ? 'Menyiapkan…' : 'Download MP4'}
			</button>
		</div>
	</header>

	<div class="grid gap-6 lg:grid-cols-3">
		<section class="lg:col-span-2">
			<div class="rounded-lg border border-gray-200 bg-black">
				{#if data.recording.playback_url}
					<video
						controls
						preload="metadata"
						class="aspect-video w-full"
						poster={data.recording.thumbnail_url}
					>
						<source src={data.recording.playback_url} type="application/x-mpegURL" />
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
						{data.recording.playback_url ?? '—'}
					</code>
					{#if data.recording.playback_url}
						<button
							type="button"
							class="rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
							onclick={() => copyUrl(data.recording.playback_url!)}
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
						<dd class="font-mono text-gray-900">{data.recording.id}</dd>
					</div>
					<div class="flex justify-between">
						<dt class="text-gray-500">Edge</dt>
						<dd class="text-gray-900">{data.recording.edge_code}</dd>
					</div>
					<div class="flex justify-between">
						<dt class="text-gray-500">Camera</dt>
						<dd class="text-gray-900">{data.recording.camera_name}</dd>
					</div>
					<div class="flex justify-between">
						<dt class="text-gray-500">Duration</dt>
						<dd class="text-gray-900">{formatDuration(data.recording.duration_seconds)}</dd>
					</div>
					<div class="flex justify-between">
						<dt class="text-gray-500">Size</dt>
						<dd class="text-gray-900">{formatBytes(data.recording.size_bytes)}</dd>
					</div>
				</dl>
			</div>

			<div class="rounded-lg border border-gray-200 bg-white p-4">
				<h2 class="mb-3 text-sm font-semibold text-gray-900">Timeline</h2>
				<dl class="space-y-2 text-sm">
					<div>
						<dt class="text-xs text-gray-500 uppercase">Mulai</dt>
						<dd class="text-gray-900">{formatDateTime(data.recording.started_at)}</dd>
					</div>
					<div>
						<dt class="text-xs text-gray-500 uppercase">Selesai</dt>
						<dd class="text-gray-900">{formatDateTime(data.recording.ended_at)}</dd>
					</div>
				</dl>
			</div>

			<div class="rounded-lg border border-gray-200 bg-white p-4">
				<h2 class="mb-3 text-sm font-semibold text-gray-900">Storage</h2>
				<dl class="space-y-2 text-sm">
					<div>
						<dt class="text-xs text-gray-500 uppercase">Path</dt>
						<dd class="break-all font-mono text-xs text-gray-700">{data.recording.storage_path}</dd>
					</div>
				</dl>
			</div>
		</aside>
	</div>
</div>
