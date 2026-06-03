<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { api } from '$lib/api/client';
	import { getAccessToken } from '$lib/stores/auth';
	import { toast } from '$lib/stores/toast';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import StreamPlayer from '$lib/components/StreamPlayer.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import type { Camera } from '$lib/types/live';
	import type { Recording } from '$lib/types/api';

	const cameraId = $derived(page.params.id);

	let camera = $state<Camera | null>(null);
	let recordings = $state<Recording[]>([]);
	let loading = $state(true);
	let liveHlsUrl = $state<string | null>(null);
	let playerKey = $state(0);

	async function load() {
		loading = true;
		try {
			const res = await api.get<{ camera: Camera }>(`/api/v1/cameras/${cameraId}`);
			camera = res.camera;
			const recRes = await api.get<{ recordings: Recording[] }>(
				`/api/v1/cameras/${cameraId}/recordings?limit=20`
			);
			recordings = recRes.recordings ?? [];
			liveHlsUrl = `/api/v1/cameras/${cameraId}/live.m3u8?token=${getAccessToken() ?? ''}`;
		} catch (err) {
			toast.error((err as Error).message);
		} finally {
			loading = false;
		}
	}

	async function remove() {
		const c = camera;
		if (!c) return;
		if (!confirm(`Hapus ${c.name}?`)) return;
		try {
			await api.del(`/api/v1/cameras/${c.id}`);
			toast.success('Kamera dihapus');
			await goto('/cameras');
		} catch (e) {
			toast.error((e as Error).message);
		}
	}

	function refreshStream() {
		playerKey++;
	}

	function formatBytes(bytes?: number): string {
		if (!bytes) return '—';
		const units = ['B', 'KB', 'MB', 'GB'];
		let i = 0;
		let v = bytes;
		while (v >= 1024 && i < units.length - 1) {
			v /= 1024;
			i++;
		}
		return `${v.toFixed(1)} ${units[i]}`;
	}

	function formatDuration(seconds?: number): string {
		if (!seconds) return '—';
		const h = Math.floor(seconds / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		const s = seconds % 60;
		return h > 0 ? `${h}j ${m}m` : m > 0 ? `${m}m ${s}d` : `${s}d`;
	}

	const statusVariant = $derived(
		camera
			? camera.status === 'online'
				? 'success'
				: camera.status === 'recording'
					? 'success'
					: camera.status === 'error'
						? 'error'
						: 'warning'
			: 'muted'
	);
	const statusLabel = $derived(
		camera ? (camera.enabled ? (camera.status ?? 'offline') : 'Nonaktif') : '—'
	);

	onMount(load);
</script>

<svelte:head><title>{camera?.name ?? 'Kamera'} — Monitoring CCTV</title></svelte:head>

{#if loading}
	<div class="py-12 text-center text-sm text-gray-500">Memuat…</div>
{:else if !camera}
	<div class="py-12 text-center text-sm text-gray-500">Kamera tidak ditemukan</div>
{:else}
	{@const c = camera}
	<PageHeader title={c.name} subtitle="{c.edge_name} • Channel {c.channel}" back="/cameras">
		{#snippet actions()}
			<a
				href="/live?camera={c.id}"
				class="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
			>
				▶ Watch Live
			</a>
			<a
				href="/cameras/{c.id}/edit"
				class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
			>
				Edit
			</a>
			<button
				onclick={remove}
				class="rounded-lg border border-red-300 bg-white px-3 py-2 text-sm text-red-700 hover:bg-red-50"
			>
				Hapus
			</button>
		{/snippet}
	</PageHeader>

	<div class="grid gap-6 lg:grid-cols-3">
		<div class="lg:col-span-2 space-y-4">
			<div class="flex items-center gap-2">
				<StatusBadge variant={statusVariant} label={statusLabel} />
				<button
					onclick={refreshStream}
					class="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
				>
					Refresh Stream
				</button>
			</div>

			{#if liveHlsUrl}
				{#key playerKey}
					<StreamPlayer src={liveHlsUrl} />
				{/key}
			{:else}
				<div
					class="flex aspect-video w-full items-center justify-center rounded-lg bg-gray-900 text-sm text-gray-300"
				>
					Stream tidak tersedia
				</div>
			{/if}

			<div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
				<h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Detail</h2>
				<dl class="grid grid-cols-2 gap-3 text-sm">
					<div><dt class="text-gray-500">Stream Protocol</dt><dd class="font-medium uppercase">{c.stream_protocol}</dd></div>
					<div><dt class="text-gray-500">Codec</dt><dd class="font-medium uppercase">{c.codec}</dd></div>
					<div><dt class="text-gray-500">Resolusi</dt><dd class="font-medium">{c.resolution ?? '—'}</dd></div>
					<div><dt class="text-gray-500">FPS</dt><dd class="font-medium">{c.fps ?? '—'}</dd></div>
					<div class="col-span-2">
						<dt class="text-gray-500">Stream URL</dt>
						<dd class="break-all font-mono text-xs text-gray-700">{c.stream_url}</dd>
					</div>
				</dl>
			</div>
		</div>

		<div class="space-y-3">
			<h2 class="text-sm font-semibold uppercase tracking-wide text-gray-500">Rekaman Terbaru</h2>
			{#if recordings.length === 0}
				<div
					class="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-500"
				>
					Belum ada rekaman
				</div>
			{:else}
				<div class="space-y-2">
					{#each recordings as rec (rec.id)}
						<a
							href="/recordings/{rec.id}"
							class="block rounded-xl border border-gray-200 bg-white p-3 shadow-sm hover:border-indigo-300 hover:shadow"
						>
							<div class="flex items-center justify-between text-xs text-gray-500">
								<span>{new Date(rec.started_at).toLocaleString('id-ID')}</span>
								<span>{formatBytes(rec.size_bytes)}</span>
							</div>
							<div class="mt-1 flex items-center justify-between text-sm">
								<span class="font-medium text-gray-900">{formatDuration(rec.duration_seconds)}</span>
								<StatusBadge variant="muted" label={rec.storage_path ? 'Selesai' : '—'} />
							</div>
						</a>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}
