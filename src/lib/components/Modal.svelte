<script lang="ts">
	import { X } from 'lucide-svelte';
	import type { Snippet } from 'svelte';

	type Props = {
		open: boolean;
		title: string;
		size?: 'sm' | 'md' | 'lg' | 'xl';
		closeOnBackdrop?: boolean;
		children: Snippet;
		footer?: Snippet;
	};

	let {
		open = $bindable(false),
		title,
		size = 'md',
		closeOnBackdrop = true,
		children,
		footer
	}: Props = $props();

	const sizes = {
		sm: 'max-w-md',
		md: 'max-w-lg',
		lg: 'max-w-2xl',
		xl: 'max-w-4xl'
	};

	function close() {
		open = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && open) close();
	}

	function handleBackdrop() {
		if (closeOnBackdrop) close();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		role="dialog"
		aria-modal="true"
		aria-labelledby="modal-title"
	>
		<button
			type="button"
			class="absolute inset-0 cursor-default"
			aria-label="Tutup modal"
			onclick={handleBackdrop}
		></button>

		<div class="relative w-full {sizes[size]} rounded-xl bg-white shadow-2xl">
			<div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
				<h2 id="modal-title" class="text-lg font-semibold text-gray-900">{title}</h2>
				<button
					type="button"
					class="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
					onclick={close}
					aria-label="Tutup"
				>
					<X class="h-5 w-5" />
				</button>
			</div>

			<div class="px-6 py-4">
				{@render children()}
			</div>

			{#if footer}
				<div class="flex justify-end gap-2 border-t border-gray-200 bg-gray-50 px-6 py-3 rounded-b-xl">
					{@render footer()}
				</div>
			{/if}
		</div>
	</div>
{/if}
