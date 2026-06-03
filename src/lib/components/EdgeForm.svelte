<script lang="ts">
	import { api } from '$lib/api/client';
	import { toast } from '$lib/stores/toast';
	import { goto } from '$app/navigation';
	import type { Edge } from '$lib/types/api';

	type Props = {
		mode: 'create' | 'edit';
		initial?: Edge | null;
		onsaved?: (edge: Edge) => void;
		oncancel?: () => void;
	};

	let { mode, initial = null, onsaved, oncancel }: Props = $props();

	let name = $state(initial?.name ?? '');
	let code = $state(initial?.code ?? '');
	let hostname = $state(initial?.hostname ?? '');
	let ipAddress = $state(initial?.ip_address ?? '');
	let saving = $state(false);
	let errors = $state<Record<string, string>>({});

	function validate(): boolean {
		const e: Record<string, string> = {};
		if (!name.trim()) e.name = 'Nama wajib diisi';
		if (!code.trim()) e.code = 'Kode wajib diisi';
		if (ipAddress && !/^[\d.]+$/.test(ipAddress.trim())) e.ipAddress = 'IP address tidak valid';
		errors = e;
		return Object.keys(e).length === 0;
	}

	function buildPayload() {
		return {
			name: name.trim(),
			code: code.trim().toUpperCase(),
			hostname: hostname.trim() || undefined,
			ip_address: ipAddress.trim() || undefined
		};
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();
		if (!validate() || saving) return;
		saving = true;
		try {
			const payload = buildPayload();
			const result =
				mode === 'create'
					? await api.post<Edge>('/api/v1/edges', payload)
					: await api.put<Edge>(`/api/v1/edges/${initial!.id}`, payload);
			toast.success(
				mode === 'create' ? `Edge ${result.code} berhasil ditambahkan` : 'Edge diperbarui'
			);
			if (onsaved) {
				onsaved(result);
			} else {
				await goto('/edges');
			}
		} catch (err) {
			errors = { _form: (err as Error).message };
		} finally {
			saving = false;
		}
	}
</script>

<form onsubmit={handleSubmit} class="space-y-4">
	{#if errors._form}
		<div class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
			{errors._form}
		</div>
	{/if}

	<div class="grid gap-4 md:grid-cols-2">
		<label class="block">
			<span class="mb-1 block text-sm font-medium text-gray-700">Kode *</span>
			<input
				type="text"
				bind:value={code}
				placeholder="KPL-001"
				disabled={mode === 'edit'}
				class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono uppercase focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100"
			/>
			{#if errors.code}
				<span class="mt-1 block text-xs text-red-600">{errors.code}</span>
			{/if}
		</label>

		<label class="block">
			<span class="mb-1 block text-sm font-medium text-gray-700">Nama *</span>
			<input
				type="text"
				bind:value={name}
				placeholder="Lobi Utama"
				class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
			/>
			{#if errors.name}
				<span class="mt-1 block text-xs text-red-600">{errors.name}</span>
			{/if}
		</label>

		<label class="block">
			<span class="mb-1 block text-sm font-medium text-gray-700">Hostname</span>
			<input
				type="text"
				bind:value={hostname}
				placeholder="edge-01.lan"
				class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
			/>
		</label>

		<label class="block">
			<span class="mb-1 block text-sm font-medium text-gray-700">IP Address</span>
			<input
				type="text"
				bind:value={ipAddress}
				placeholder="192.168.1.10"
				class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
			/>
			{#if errors.ipAddress}
				<span class="mt-1 block text-xs text-red-600">{errors.ipAddress}</span>
			{/if}
		</label>
	</div>

	<div class="flex justify-end gap-2 pt-2">
		{#if oncancel}
			<button
				type="button"
				onclick={oncancel}
				disabled={saving}
				class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
			>
				Batal
			</button>
		{:else}
			<a
				href="/edges"
				class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
			>
				Batal
			</a>
		{/if}
		<button
			type="submit"
			disabled={saving}
			class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
		>
			{saving ? 'Menyimpan…' : mode === 'create' ? 'Tambah Edge' : 'Simpan'}
		</button>
	</div>
</form>
