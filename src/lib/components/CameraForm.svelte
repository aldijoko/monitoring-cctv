<script lang="ts">
	import { api } from '$lib/api/client';
	import { goto } from '$app/navigation';
	import { toast } from '$lib/stores/toast';
	import { listEdges } from '$lib/api/edges';
	import type { Camera } from '$lib/api/cameras';
	import type { Edge } from '$lib/api/edges';
	import { onMount } from 'svelte';

	type Props = {
		mode: 'create' | 'edit';
		initial?: Camera | null;
		lockedEdgeId?: string;
	};

	let { mode, initial = null, lockedEdgeId }: Props = $props();

	let edges = $state<Edge[]>([]);
	let edgeId = $state(initial?.edge_id ?? lockedEdgeId ?? '');
	let name = $state(initial?.name ?? '');
	let sourceUrl = $state(initial?.source_url ?? '');
	let username = $state(initial?.username ?? '');
	let password = $state('');
	let protocol = $state<'rtsp' | 'http' | 'hls' | 'onvif'>(initial?.protocol ?? 'rtsp');
	let kind = $state<'live' | 'recording'>(initial?.kind ?? 'recording');
	let position = $state(initial?.position ?? 0);
	let enabled = $state(initial?.enabled ?? true);
	let detectEnabled = $state(initial?.detect_enabled ?? false);
	let detectSensitivity = $state(initial?.detect_sensitivity ?? 0.5);
	let recordingRetentionDays = $state(initial?.recording_retention_days ?? 14);
	let saving = $state(false);
	let errors = $state<Record<string, string>>({});

	onMount(async () => {
		try {
			edges = await listEdges();
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
		else if (!/^(rtsp|http|https):\/\//.test(sourceUrl)) e.sourceUrl = 'URL harus rtsp/http/https';
		errors = e;
		return Object.keys(e).length === 0;
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();
		if (!validate() || saving) return;
		saving = true;
		try {
			const payload = {
				edge_id: edgeId,
				name: name.trim(),
				source_url: sourceUrl.trim(),
				username: username.trim() || null,
				password: password || null,
				protocol,
				kind,
				position,
				enabled,
				detect_enabled: detectEnabled,
				detect_sensitivity: detectSensitivity,
				recording_retention_days: recordingRetentionDays
			};
			if (mode === 'create') {
				await api.post('/api/v1/cameras', payload);
				toast.success('Kamera berhasil ditambahkan');
			} else if (initial) {
				await api.put(`/api/v1/cameras/${initial.id}`, payload);
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
						placeholder="Kamera Pintu Depan"
						class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
					/>
					{#if errors.name}<span class="mt-1 block text-xs text-red-600">{errors.name}</span>{/if}
				</label>

				<label class="block">
					<span class="mb-1 block text-sm font-medium text-gray-700">Urutan Tampil</span>
					<input
						type="number"
						bind:value={position}
						min="0"
						max="999"
						class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
					/>
				</label>
			</div>

			<label class="block">
				<span class="mb-1 block text-sm font-medium text-gray-700">Source URL *</span>
				<input
					type="text"
					bind:value={sourceUrl}
					placeholder="rtsp://user:pass@192.168.1.100:554/stream1"
					class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
				/>
				{#if errors.sourceUrl}<span class="mt-1 block text-xs text-red-600">{errors.sourceUrl}</span>{/if}
			</label>

			<div class="grid gap-4 md:grid-cols-2">
				<label class="block">
					<span class="mb-1 block text-sm font-medium text-gray-700">Username</span>
					<input
						type="text"
						bind:value={username}
						placeholder="admin"
						class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
					/>
				</label>

				<label class="block">
					<span class="mb-1 block text-sm font-medium text-gray-700">
						Password {mode === 'edit' ? '(kosongkan jika tidak diubah)' : ''}
					</span>
					<input
						type="password"
						bind:value={password}
						placeholder="••••••••"
						class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
					/>
				</label>
			</div>
		</div>
	</div>

	<div class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
		<h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">Mode & Deteksi</h2>
		<div class="grid gap-4 md:grid-cols-2">
			<label class="block">
				<span class="mb-1 block text-sm font-medium text-gray-700">Protokol</span>
				<select
					bind:value={protocol}
					class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
				>
					<option value="rtsp">RTSP</option>
					<option value="http">HTTP (MJPEG)</option>
					<option value="hls">HLS</option>
					<option value="onvif">ONVIF</option>
				</select>
			</label>

			<label class="block">
				<span class="mb-1 block text-sm font-medium text-gray-700">Jenis</span>
				<select
					bind:value={kind}
					class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
				>
					<option value="live">Hanya Live View</option>
					<option value="recording">Live + Recording</option>
				</select>
			</label>
		</div>

		<label class="mt-4 flex items-center gap-2">
			<input type="checkbox" bind:checked={detectEnabled} class="rounded border-gray-300" />
			<span class="text-sm text-gray-700">Aktifkan deteksi gerakan</span>
		</label>

		{#if detectEnabled}
			<label class="mt-3 block">
				<span class="mb-1 block text-sm font-medium text-gray-700">Sensitivitas: {(detectSensitivity * 100).toFixed(0)}%</span>
				<input
					type="range"
					bind:value={detectSensitivity}
					min="0"
					max="1"
					step="0.05"
					class="w-full"
				/>
			</label>
		{/if}

		<label class="mt-4 block">
			<span class="mb-1 block text-sm font-medium text-gray-700">Retensi Rekaman (hari)</span>
			<input
				type="number"
				bind:value={recordingRetentionDays}
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
