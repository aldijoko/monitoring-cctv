<script lang="ts" generics="T">
	import { ChevronUp, ChevronDown } from 'lucide-svelte';
	import type { Snippet } from 'svelte';

	export type Column<T> = {
		key: string;
		label: string;
		sortable?: boolean;
		class?: string;
		render?: (row: T) => string;
	};

	type Props = {
		items: T[];
		columns: Column<T>[];
		rowKey: (row: T) => string | number;
		emptyMessage?: string;
		rowActions?: Snippet<[T]>;
		onRowClick?: (row: T) => void;
	};

	let {
		items,
		columns,
		rowKey,
		emptyMessage = 'Tidak ada data',
		rowActions,
		onRowClick
	}: Props = $props();

	let sortKey = $state<string | null>(null);
	let sortDir = $state<'asc' | 'desc'>('asc');

	function toggleSort(col: Column<T>) {
		if (!col.sortable) return;
		if (sortKey === col.key) {
			sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		} else {
			sortKey = col.key;
			sortDir = 'asc';
		}
	}

	const sorted = $derived.by(() => {
		if (!sortKey) return items;
		const col = columns.find((c) => c.key === sortKey);
		if (!col) return items;
		const k = col.key as keyof T;
		const arr = [...items];
		arr.sort((a, b) => {
			const av = a[k] as unknown;
			const bv = b[k] as unknown;
			if (av == null && bv == null) return 0;
			if (av == null) return 1;
			if (bv == null) return -1;
			if (typeof av === 'number' && typeof bv === 'number') {
				return sortDir === 'asc' ? av - bv : bv - av;
			}
			const as = String(av).toLowerCase();
			const bs = String(bv).toLowerCase();
			return sortDir === 'asc' ? as.localeCompare(bs) : bs.localeCompare(as);
		});
		return arr;
	});
</script>

<div class="overflow-x-auto">
	<table class="w-full text-sm">
		<thead class="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-600">
			<tr>
				{#each columns as col (col.key)}
					<th
						class="px-4 py-3 font-semibold {col.class ?? ''}"
						class:cursor-pointer={col.sortable}
						onclick={() => toggleSort(col)}
					>
						<div class="flex items-center gap-1">
							<span>{col.label}</span>
							{#if col.sortable}
								{#if sortKey === col.key}
									{#if sortDir === 'asc'}
										<ChevronUp class="h-3.5 w-3.5" />
									{:else}
										<ChevronDown class="h-3.5 w-3.5" />
									{/if}
								{/if}
							{/if}
						</div>
					</th>
				{/each}
				{#if rowActions}
					<th class="px-4 py-3 text-right text-xs font-semibold">Aksi</th>
				{/if}
			</tr>
		</thead>
		<tbody class="divide-y divide-gray-100">
			{#each sorted as row (rowKey(row))}
				<tr
					class="hover:bg-gray-50"
					class:cursor-pointer={!!onRowClick}
					onclick={() => onRowClick?.(row)}
				>
					{#each columns as col (col.key)}
						<td class="px-4 py-3 text-gray-700 {col.class ?? ''}">
							{#if col.render}
								{@html col.render(row)}
							{:else}
								{(row as Record<string, unknown>)[col.key] ?? ''}
							{/if}
						</td>
					{/each}
					{#if rowActions}
						<td class="px-4 py-3 text-right">
							{@render rowActions(row)}
						</td>
					{/if}
				</tr>
			{:else}
				<tr>
					<td
						colspan={columns.length + (rowActions ? 1 : 0)}
						class="px-4 py-12 text-center text-sm text-gray-500"
					>
						{emptyMessage}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
