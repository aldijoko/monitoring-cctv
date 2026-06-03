<script lang="ts">
	import type { Snippet } from 'svelte';
	import { goto } from '$app/navigation';
	import { ArrowLeft } from 'lucide-svelte';

	type Props = {
		title: string;
		description?: string;
		subtitle?: string;
		actions?: Snippet;
		breadcrumbs?: Snippet;
		back?: string | true;
	};

	let { title, description, subtitle, actions, breadcrumbs, back }: Props = $props();

	const sub = $derived(description ?? subtitle);

	function handleBack() {
		if (back === true) {
			history.back();
		} else if (typeof back === 'string') {
			goto(back);
		}
	}
</script>

<header class="border-b border-gray-200 bg-white">
	<div class="px-4 py-5 sm:px-6">
		{#if breadcrumbs}
			<nav class="mb-2 text-sm text-gray-500">
				{@render breadcrumbs()}
			</nav>
		{/if}
		<div class="flex flex-wrap items-start justify-between gap-3">
			<div class="flex items-start gap-3">
				{#if back}
					<button
						type="button"
						onclick={handleBack}
						class="mt-1 rounded p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
						aria-label="Kembali"
					>
						<ArrowLeft class="h-5 w-5" />
					</button>
				{/if}
				<div>
					<h1 class="text-2xl font-bold text-gray-900">{title}</h1>
					{#if sub}
						<p class="mt-1 text-sm text-gray-500">{sub}</p>
					{/if}
				</div>
			</div>
			{#if actions}
				<div class="flex flex-wrap items-center gap-2">
					{@render actions()}
				</div>
			{/if}
		</div>
	</div>
</header>
