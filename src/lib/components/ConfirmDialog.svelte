<script lang="ts">
	import Modal from './Modal.svelte';
	import Button from './Button.svelte';
	import { AlertTriangle } from 'lucide-svelte';
	import type { Snippet } from 'svelte';

	type Props = {
		open: boolean;
		title: string;
		message: string;
		confirmText?: string;
		cancelText?: string;
		variant?: 'danger' | 'primary';
		loading?: boolean;
		details?: Snippet;
		onconfirm: () => void;
		oncancel: () => void;
	};

	let {
		open = $bindable(false),
		title,
		message,
		confirmText = 'Konfirmasi',
		cancelText = 'Batal',
		variant = 'danger',
		loading = false,
		details,
		onconfirm,
		oncancel
	}: Props = $props();
</script>

<Modal bind:open {title} size="sm" closeOnBackdrop={!loading}>
	{#snippet children()}
		<div class="flex gap-4">
			<div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
				<AlertTriangle class="h-5 w-5" />
			</div>
			<div class="flex-1">
				<p class="text-sm text-gray-600">{message}</p>
				{#if details}
					<div class="mt-3">
						{@render details()}
					</div>
				{/if}
			</div>
		</div>
	{/snippet}
	{#snippet footer()}
		<Button variant="secondary" onclick={oncancel} disabled={loading}>{cancelText}</Button>
		<Button {variant} {loading} onclick={onconfirm}>{confirmText}</Button>
	{/snippet}
</Modal>
