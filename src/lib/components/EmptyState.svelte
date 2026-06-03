<script lang="ts">
	import { Inbox } from 'lucide-svelte';
	import type { Snippet } from 'svelte';

	type Props = {
		title?: string;
		message?: string;
		icon?: Snippet;
		action?: Snippet;
	};

	let {
		title = 'Tidak ada data',
		message = 'Belum ada data untuk ditampilkan.',
		icon,
		action
	}: Props = $props();
</script>

<div class="flex flex-col items-center justify-center px-4 py-12 text-center">
	<div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
		{#if icon}
			{@render icon()}
		{:else}
			<Inbox class="h-6 w-6" />
		{/if}
	</div>
	<h3 class="text-base font-semibold text-gray-900">{title}</h3>
	<p class="mt-1 max-w-sm text-sm text-gray-500">{message}</p>
	{#if action}
		<div class="mt-4">
			{@render action()}
		</div>
	{/if}
</div>
