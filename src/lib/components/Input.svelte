<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface Props extends Omit<HTMLInputAttributes, 'class' | 'value'> {
		label?: string;
		error?: string;
		hint?: string;
		class?: string;
		value?: string;
	}

	let {
		label,
		error,
		hint,
		class: klass = '',
		id,
		value = $bindable(''),
		...rest
	}: Props = $props();

	const inputId = $derived(id ?? `input-${Math.random().toString(36).slice(2, 9)}`);
</script>

<div class="space-y-1.5 {klass}">
	{#if label}
		<label for={inputId} class="label">{label}</label>
	{/if}
	<input
		id={inputId}
		class="input {error ? 'ring-red-300 focus:ring-red-500' : ''}"
		bind:value
		{...rest}
	/>
	{#if error}
		<p class="text-xs text-red-600">{error}</p>
	{:else if hint}
		<p class="text-xs text-gray-500">{hint}</p>
	{/if}
</div>
