<script lang="ts">
	import { Search, X } from 'lucide-svelte';

	type Props = {
		value: string;
		placeholder?: string;
		onchange: (value: string) => void;
	};

	let { value = $bindable(''), placeholder = 'Cari...', onchange }: Props = $props();

	let timer: ReturnType<typeof setTimeout> | undefined = $state();

	function handleInput(e: Event) {
		const v = (e.target as HTMLInputElement).value;
		value = v;
		clearTimeout(timer);
		timer = setTimeout(() => onchange(v), 300);
	}

	function clear() {
		value = '';
		clearTimeout(timer);
		onchange('');
	}
</script>

<div class="relative">
	<Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
	<input
		type="search"
		{value}
		{placeholder}
		oninput={handleInput}
		class="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-10 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
	/>
	{#if value}
		<button
			type="button"
			onclick={clear}
			class="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
			aria-label="Hapus pencarian"
		>
			<X class="h-4 w-4" />
		</button>
	{/if}
</div>
