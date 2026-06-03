<script lang="ts">
	import { toasts, type ToastType } from '$lib/stores/toast';

	const typeClass: Record<ToastType, string> = {
		success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
		error: 'bg-red-50 border-red-200 text-red-900',
		warning: 'bg-amber-50 border-amber-200 text-amber-900',
		info: 'bg-sky-50 border-sky-200 text-sky-900'
	};

	const icon: Record<ToastType, string> = {
		success: 'M5 13l4 4L19 7',
		error: 'M6 18L18 6M6 6l12 12',
		warning: 'M12 9v2m0 4h.01M5 19h14a2 2 0 001.85-2.75L13.85 4.92a2 2 0 00-3.7 0L3.15 16.25A2 2 0 005 19z',
		info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
	};
</script>

<div
	class="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2"
>
	{#each $toasts as toast (toast.id)}
		<div
			class="pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg animate-slide-in-from-bottom-2 {typeClass[
				toast.type
			]}"
			role="status"
		>
			<svg
				class="h-5 w-5 shrink-0"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d={icon[toast.type]}
				/>
			</svg>
			<p class="flex-1 text-sm font-medium">{toast.message}</p>
			<button
				type="button"
				class="shrink-0 rounded p-1 opacity-60 transition-opacity hover:opacity-100"
				aria-label="Tutup"
				onclick={() => toasts.dismiss(toast.id)}
			>
				<svg
					class="h-4 w-4"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>
		</div>
	{/each}
</div>
