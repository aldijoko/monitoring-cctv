<script lang="ts">
	import { goto } from '$app/navigation';
	import { toast } from '$lib/stores/toast';
	import { listEdges } from '$lib/api/edges';
	import { createCamera, updateCamera, type CameraFormPayload } from '$lib/api/cameras';
	import type { Edge, LiveCamera, StreamProtocol } from '$lib/types/api';
	import { onMount } from 'svelte';

	type Props = {
		mode: 'create' | 'edit';
		initial?: LiveCamera | null;
		lockedEdgeId?: number;
	};

	let { mode, initial = null, lockedEdgeId }: Props = $props();

	let edges = $state<Edge[]>([]);
	let edgeId = $state<number | ''>(initial?.edge_id ?? lockedEdgeId ?? '');
	let name = $state(initial?.name ?? '');
	let channel = $state(initial?.channel ?? 1);
	let sourceUrl = $state(initial?.source_url ?? '');
	let streamProtocol = $state<StreamProtocol>(initial?.stream_protocol ?? 'hls');
	let resolution = $state(initial?.resolution ?? '1920x1080');
	let fps = $state(initial?.fps ?? 25);
	let codec = $state(initial?.codec ?? 'H264');
	let storageDays = $state(initial?.storage_days ?? 30);
	let enabled = $state(initial?.enabled ?? true);
	let saving = $state(false);
	let errors = $state<Record<string, string>>({});

	onMount(async () => {
		try {
			const res = await listEdges();
			edges = res.items;
			if (!edgeId && edges.length > 0) {
				edgeId = edges[0].id;
			}
		} catch (err) {
			console.error(err);
		}
	});

	function validate(): boolean {
		const e: Record<string, string> = {};
		if (!edgeId) e.edgeId = 'Pilih edge';
		if (!name.trim()) e.name = 'Nama wajib diisi';
		if (!sourceUrl.trim()) e.sourceUrl = 'Source URL wajib diisi';
		else if (!/^(rtsp|rtsps|rtmp|rtmps|http|https):\/\//.test(sourceUrl))
			e.sourceUrl = 'URL harus rtsp://, rtmp://, atau http(s):// (mis. HLS .m3u8)';
		errors = e;
		return Object.keys(e).length === 0;
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();
		if (!validate() || saving) return;
		saving = true;
		try {
			const payload: CameraFormPayload = {
				edge_id: edgeId as number,
				name: name.trim(),
				channel,
				source_url: sourceUrl.trim(),
				stream_protocol: streamProtocol,
				resolution,
				fps,
				codec,
				storage_days: storageDays,
				enabled
			};
			if (mode === 'create') {
				await createCamera(payload);
				toast.success('Kamera berhasil ditambahkan');
			} else if (initial) {
				await updateCamera(initial.id, payload);
				toast.success('Kamera diperbarui');
			}
			await goto(lockedEdgeId ? `/edges/${lockedEdgeId}` : '/cameras');
		} catch (err) {
			errors = { _form: (err as Error).message };
		} finally {
			saving = false;
		}
	}
</script>

<form onsubmit={handleSubmit} class="mx-auto max-w-2xl space-y-5">
	{#if errors._form}
		<div class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errors._form}</div>
	{/if}

	<div class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
		<h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">Lokasi & Sumber</h2>
		<div class="grid gap-4">
			<label class="block">
				<span class="mb-1 block text-sm font-medium text-gray-700">Edge *</span>
				<select
					bind:value={edgeId}
					disabled={!!lockedEdgeId}
					class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100"
				>
					<option value="">— pilih edge —</option>
					{#each edges as e (e.id)}
						<option value={e.id}>{e.code} — {e.name}</option>
					{/each}
				</select>
				{#if errors.edgeId}<span class="mt-1 block text-xs text-red-600">{errors.edgeId}</span>{/if}
			</label>

			<div class="grid gap-4 md:grid-cols-2">
				<label class="block">
					<span class="mb-1 block text-sm font-medium text-gray-700">Nama *</span>
					<input
						type="text"
						bind:value={name}
						placeholder="CAM-01 Pintu Depan"
						class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
					/>
					{#if errors.name}<span class="mt-1 block text-xs text-red-600">{errors.name}</span>{/if}
				</label>

				<label class="block">
					<span class="mb-1 block text-sm font-medium text-gray-700">Channel</span>
					<input
						type="number"
						bind:value={channel}
						min="1"
						max="99"
						class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
					/>
				</label>
			</div>

			<label class="block">
				<span class="mb-1 block text-sm font-medium text-gray-700">Source URL *</span>
				<input
					type="text"
					bind:value={sourceUrl}
					placeholder="rtsp://user:pass@203.0.113.10:20557/... atau https://host/stream/index.m3u8"
					class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
				/>
				<span class="mt-1 block text-xs text-gray-500">
					Bisa RTSP (kamera langsung) atau HLS/.m3u8 (sumber yang sudah di-stream pihak lain). Backend akan menariknya dan menyediakannya sebagai HLS untuk pemutaran.
				</span>
				{#if errors.sourceUrl}<span class="mt-1 block text-xs text-red-600">{errors.sourceUrl}</span>{/if}
			</label>
		</div>
	</div>

	<div class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
		<h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">Output & Penyimpanan</h2>
		<div class="grid gap-4 md:grid-cols-2">
			<label class="block">
				<span class="mb-1 block text-sm font-medium text-gray-700">Protokol Output</span>
				<select
					bind:value={streamProtocol}
					class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
				>
					<option value="hls">HLS</option>
					<option value="webrtc">WebRTC</option>
					<option value="mjpeg">MJPEG</option>
				</select>
			</label>

			<label class="block">
				<span class="mb-1 block text-sm font-medium text-gray-700">Resolusi</span>
				<input
					type="text"
					bind:value={resolution}
					placeholder="1920x1080"
					class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
				/>
			</label>

			<label class="block">
				<span class="mb-1 block text-sm font-medium text-gray-700">FPS</span>
				<input
					type="number"
					bind:value={fps}
					min="1"
					max="60"
					class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
				/>
			</label>

			<label class="block">
				<span class="mb-1 block text-sm font-medium text-gray-700">Codec</span>
				<input
					type="text"
					bind:value={codec}
					placeholder="H264"
					class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
				/>
			</label>
		</div>

		<label class="mt-4 block">
			<span class="mb-1 block text-sm font-medium text-gray-700">Retensi Rekaman (hari)</span>
			<input
				type="number"
				bind:value={storageDays}
				min="1"
				max="365"
				class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
			/>
		</label>

		<label class="mt-4 flex items-center gap-2">
			<input type="checkbox" bind:checked={enabled} class="rounded border-gray-300" />
			<span class="text-sm text-gray-700">Kamera aktif</span>
		</label>
	</div>

	<div class="flex justify-end gap-2">
		<a
			href={lockedEdgeId ? `/edges/${lockedEdgeId}` : '/cameras'}
			class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
		>
			Batal
		</a>
		<button
			type="submit"
			disabled={saving}
			class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
		>
			{saving ? 'Menyimpan…' : mode === 'create' ? 'Tambah Kamera' : 'Simpan'}
		</button>
	</div>
</form>
