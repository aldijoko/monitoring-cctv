<script lang="ts">
	import type { LiveCamera } from '$lib/types/api';

	type Props = {
		streams: LiveCamera[];
		selected?: number[];
		disabled?: boolean;
		onpick?: (id: number) => void;
		onclose?: () => void;
	};

	let {
		streams,
		selected = $bindable([]),
		disabled = false,
		onpick,
		onclose
	}: Props = $props();

	let search = $state('');

	let filtered = $derived(
		streams.filter((c) => (search ? c.name.toLowerCase().includes(search.toLowerCase()) : true))
	);

	function toggle(id: number) {
		if (disabled) return;
		selected = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
	}

	function pick(id: number) {
		if (onpick) onpick(id);
		else toggle(id);
	}
</script>

<div class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
	<div class="mb-4 flex items-center justify-between">
		<div>
			<h2 class="text-sm font-semibold uppercase tracking-wide text-gray-500">Pilih Kamera</h2>
			<p class="mt-1 text-xs text-gray-500">Pilih kamera untuk ditampilkan di grid</p>
		</div>
		{#if onclose}
			<button
				type="button"
				onclick={onclose}
				class="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
			>
				Tutup
			</button>
		{/if}
	</div>

	<input
		type="search"
		bind:value={search}
		placeholder="Cari kamera…"
		class="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
		{disabled}
	/>

	{#if filtered.length === 0}
		<div class="py-8 text-center text-sm text-gray-500">
			{search ? 'Tidak ada kamera yang cocok.' : 'Belum ada kamera terdaftar.'}
		</div>
	{:else}
		<div class="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-gray-200 p-2">
			{#each filtered as stream (stream.id)}
				{@const checked = selected.includes(stream.id)}
				<label
					class="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-gray-50"
					class:opacity-50={disabled}
				>
					<input
						type="checkbox"
						{checked}
						onchange={() => pick(stream.id)}
						class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
						{disabled}
					/>
					<div class="flex-1">
						<div class="text-sm font-medium text-gray-900">{stream.name}</div>
						<div class="text-xs text-gray-500">{stream.edge_name}</div>
					</div>
					{#if stream.status !== 'online'}
						<span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
							{stream.status}
						</span>
					{/if}
				</label>
			{/each}
		</div>
	{/if}
</div>
