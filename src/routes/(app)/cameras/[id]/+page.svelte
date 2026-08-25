<script lang="ts">
	import { goto } from '$app/navigation';
	import { deleteCamera } from '$lib/api/cameras';
	import { toast } from '$lib/stores/toast';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import StreamPlayer from '$lib/components/StreamPlayer.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import { formatBytes, formatDuration } from '$lib/utils/format';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let playerKey = $state(0);

	async function remove() {
		if (!confirm(`Hapus ${data.camera.name}?`)) return;
		try {
			await deleteCamera(data.camera.id);
			toast.success('Kamera dihapus');
			await goto('/cameras');
		} catch (e) {
			toast.error((e as Error).message);
		}
	}

	function refreshStream() {
		playerKey++;
	}

	const statusVariant = $derived(
		data.camera.status === 'online'
			? 'success'
			: data.camera.status === 'recording'
				? 'success'
				: data.camera.status === 'error'
					? 'error'
					: 'warning'
	);
	const statusLabel = $derived(data.camera.enabled ? data.camera.status : 'Nonaktif');
</script>

<svelte:head><title>{data.camera.name} — Monitoring CCTV</title></svelte:head>

<PageHeader
	title={data.camera.name}
	subtitle="{data.camera.edge_name} • Channel {data.camera.channel}"
	back="/cameras"
>
	{#snippet actions()}
		<a
			href="/live?camera={data.camera.id}"
			class="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
		>
			▶ Watch Live
		</a>
		<a
			href="/cameras/{data.camera.id}/edit"
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
			<StatusBadge status={statusVariant} label={statusLabel} />
			<button
				onclick={refreshStream}
				class="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
			>
				Refresh Stream
			</button>
		</div>

		{#if data.camera.stream_url}
			{#key playerKey}
				<StreamPlayer stream={data.camera} />
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
				<div><dt class="text-gray-500">Stream Protocol</dt><dd class="font-medium uppercase">{data.camera.stream_protocol}</dd></div>
				<div><dt class="text-gray-500">Codec</dt><dd class="font-medium uppercase">{data.camera.codec}</dd></div>
				<div><dt class="text-gray-500">Resolusi</dt><dd class="font-medium">{data.camera.resolution ?? '—'}</dd></div>
				<div><dt class="text-gray-500">FPS</dt><dd class="font-medium">{data.camera.fps ?? '—'}</dd></div>
				<div class="col-span-2">
					<dt class="text-gray-500">Stream URL</dt>
					<dd class="break-all font-mono text-xs text-gray-700">{data.camera.stream_url || '—'}</dd>
				</div>
			</dl>
		</div>
	</div>

	<div class="space-y-3">
		<h2 class="text-sm font-semibold uppercase tracking-wide text-gray-500">Rekaman Terbaru</h2>
		{#if data.recordings.length === 0}
			<div
				class="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-500"
			>
				Belum ada rekaman
			</div>
		{:else}
			<div class="space-y-2">
				{#each data.recordings as rec (rec.id)}
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
							<StatusBadge status="muted" label={rec.storage_path ? 'Selesai' : '—'} />
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</div>
