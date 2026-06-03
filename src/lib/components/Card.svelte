<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		padding?: boolean;
		class?: string;
		children?: Snippet;
		header?: Snippet;
		footer?: Snippet;
	};

	let { padding = true, class: klass = '', children, header, footer }: Props = $props();
</script>

<section class="rounded-xl border border-gray-200 bg-white shadow-sm {klass}">
	{#if header}
		<header class="border-b border-gray-200 px-5 py-4">
			{@render header()}
		</header>
	{/if}
	<div class={padding ? 'p-5' : ''}>
		{@render children?.()}
	</div>
	{#if footer}
		<footer class="border-t border-gray-200 bg-gray-50 px-5 py-3">
			{@render footer()}
		</footer>
	{/if}
</section>
