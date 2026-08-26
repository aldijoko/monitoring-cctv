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

	// Standard CCTV/IP camera resolutions (industry MP naming), narrowest to
	// widest. 640x480 is included since it's what budget/PTZ cams — like the
	// real ATCS feeds already wired into this app — commonly report.
	const RESOLUTION_OPTIONS = [
		{ value: '640x480', label: '640×480 (VGA)' },
		{ value: '1280x720', label: '1280×720 (HD / 1MP)' },
		{ value: '1920x1080', label: '1920×1080 (Full HD / 2MP)' },
		{ value: '2048x1536', label: '2048×1536 (3MP)' },
		{ value: '2560x1440', label: '2560×1440 (QHD / 4MP)' },
		{ value: '2592x1944', label: '2592×1944 (5MP)' },
		{ value: '3840x2160', label: '3840×2160 (4K UHD / 8MP)' }
	];

	// Codecs most CCTV/NVR vendor docs (Hikvision, Dahua, etc.) list as
	// selectable per-camera. H.264 is the safe default — it's what mediamtx
	// reports for every real source wired into this app so far.
	const CODEC_OPTIONS = [
		{ value: 'H264', label: 'H.264 (AVC) — paling umum & kompatibel' },
		{ value: 'H265', label: 'H.265 (HEVC) — lebih hemat bandwidth, butuh decoder lebih baru' },
		{ value: 'MJPEG', label: 'MJPEG — legacy, ukuran besar tapi kompatibilitas luas' },
		{ value: 'MPEG4', label: 'MPEG-4 — legacy' }
	];

	let { mode, initial = null, lockedEdgeId }: Props = $props();

	// If an existing camera's resolution/codec isn't one of the standard
	// options (e.g. set before these dropdowns existed, or a non-standard
	// camera), keep it selectable instead of silently switching it to
	// something else.
	function withCurrentValue<T extends { value: string; label: string }>(
		options: T[],
		current: string | undefined
	): T[] {
		if (current && !options.some((o) => o.value === current)) {
			return [{ value: current, label: `${current} (nilai sebelumnya)` } as T, ...options];
		}
		return options;
	}

	const resolutionOptions = withCurrentValue(RESOLUTION_OPTIONS, initial?.resolution);
	const codecOptions = withCurrentValue(CODEC_OPTIONS, initial?.codec);

	let edges = $state<Edge[]>([]);
	let edgeId = $state<number | ''>(initial?.edge_id ?? lockedEdgeId ?? '');
	let edgeDropdownOpen = $state(false);
	let edgeDropdownEl: HTMLDivElement | undefined;
	const selectedEdge = $derived(edges.find((e) => e.id === edgeId));

	function selectEdge(id: number) {
		edgeId = id;
		edgeDropdownOpen = false;
	}

	function handleClickOutsideEdgeDropdown(event: MouseEvent) {
		if (edgeDropdownOpen && edgeDropdownEl && !edgeDropdownEl.contains(event.target as Node)) {
			edgeDropdownOpen = false;
		}
	}
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
			// This dropdown must show every edge, not a paginated page of
			// them — /edges defaults to limit=10 server-side, which silently
			// hid edges past the first page here before this explicit limit.
			const res = await listEdges({ limit: 200 });
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

<svelte:window onclick={handleClickOutsideEdgeDropdown} />

<form onsubmit={handleSubmit} class="mx-auto max-w-2xl space-y-5">
	{#if errors._form}
		<div class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
			{errors._form}
		</div>
	{/if}

	<div class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
		<h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
			Lokasi & Sumber
		</h2>
		<div class="grid gap-4">
			<label class="block">
				<span class="mb-1 block text-sm font-medium text-gray-700">Edge *</span>
				<div class="relative" bind:this={edgeDropdownEl}>
					<button
						type="button"
						disabled={!!lockedEdgeId}
						onclick={() => (edgeDropdownOpen = !edgeDropdownOpen)}
						class="flex w-full items-center justify-between rounded-lg border border-gray-300 px-3 py-2 text-left text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100"
					>
						<span class={selectedEdge ? 'text-gray-900' : 'text-gray-400'}>
							{selectedEdge ? `${selectedEdge.code} — ${selectedEdge.name}` : '— pilih edge —'}
						</span>
						<svg
							class="h-4 w-4 shrink-0 text-gray-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 9l-7 7-7-7"
							/>
						</svg>
					</button>
					{#if edgeDropdownOpen}
						<div
							class="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
						>
							{#if edges.length === 0}
								<div class="px-3 py-2 text-sm text-gray-400">Belum ada edge</div>
							{:else}
								{#each edges as e (e.id)}
									<button
										type="button"
										onclick={() => selectEdge(e.id)}
										class="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 {edgeId ===
										e.id
											? 'bg-indigo-50 text-indigo-700'
											: 'text-gray-900'}"
									>
										{e.code} — {e.name}
									</button>
								{/each}
							{/if}
						</div>
					{/if}
				</div>
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
					<span class="mt-1 block text-xs text-gray-500">
						Nomor saluran kamera ini di perangkat perekam (NVR/DVR) pada edge tersebut — tiap kamera
						dalam satu edge sebaiknya punya channel yang berbeda.
					</span>
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
					Bisa RTSP (kamera langsung) atau HLS/.m3u8 (sumber yang sudah di-stream pihak lain).
					Backend akan menariknya dan menyediakannya sebagai HLS untuk pemutaran.
				</span>
				{#if errors.sourceUrl}<span class="mt-1 block text-xs text-red-600">{errors.sourceUrl}</span
					>{/if}
			</label>
		</div>
	</div>

	<div class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
		<h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
			Output & Penyimpanan
		</h2>
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
				<select
					bind:value={resolution}
					class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
				>
					{#each resolutionOptions as opt (opt.value)}
						<option value={opt.value}>{opt.label}</option>
					{/each}
				</select>
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
				<select
					bind:value={codec}
					class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
				>
					{#each codecOptions as opt (opt.value)}
						<option value={opt.value}>{opt.label}</option>
					{/each}
				</select>
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
