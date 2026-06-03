<script lang="ts">
	import { ChevronLeft, ChevronRight } from 'lucide-svelte';

	type Props = {
		page: number;
		totalPages: number;
		total: number;
		pageSize: number;
		onchange: (page: number) => void;
	};

	let { page, totalPages, total, pageSize, onchange }: Props = $props();

	function go(p: number) {
		if (p >= 1 && p <= totalPages && p !== page) onchange(p);
	}

	const start = $derived(total === 0 ? 0 : (page - 1) * pageSize + 1);
	const end = $derived(Math.min(page * pageSize, total));
</script>

<div class="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-b-lg">
	<div class="text-sm text-gray-700">
		Menampilkan <span class="font-medium">{start}</span> sampai <span class="font-medium">{end}</span> dari <span class="font-medium">{total}</span> data
	</div>
	<div class="flex gap-1">
		<button
			type="button"
			class="rounded-md border border-gray-300 bg-white p-2 text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
			disabled={page <= 1}
			onclick={() => go(page - 1)}
			aria-label="Halaman sebelumnya"
		>
			<ChevronLeft class="h-4 w-4" />
		</button>
		<button
			type="button"
			class="rounded-md border border-gray-300 bg-white p-2 text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
			disabled={page >= totalPages}
			onclick={() => go(page + 1)}
			aria-label="Halaman berikutnya"
		>
			<ChevronRight class="h-4 w-4" />
		</button>
	</div>
</div>
