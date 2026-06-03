<script lang="ts">
	import { Loader2 } from 'lucide-svelte';
	import type { Snippet } from 'svelte';

	type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
	type Size = 'sm' | 'md' | 'lg';

	type Props = {
		variant?: Variant;
		size?: Size;
		loading?: boolean;
		disabled?: boolean;
		type?: 'button' | 'submit' | 'reset';
		fullWidth?: boolean;
		children: Snippet;
		onclick?: (e: MouseEvent) => void;
	};

	let {
		variant = 'primary',
		size = 'md',
		loading = false,
		disabled = false,
		type = 'button',
		fullWidth = false,
		children,
		onclick
	}: Props = $props();

	const variants = {
		primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
		secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-blue-500',
		danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
		ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500'
	} as const;

	const sizes = {
		sm: 'px-3 py-1.5 text-sm',
		md: 'px-4 py-2 text-sm',
		lg: 'px-5 py-2.5 text-base'
	} as const;
</script>

<button
	{type}
	{disabled}
	{onclick}
	class="inline-flex items-center justify-center gap-2 rounded-lg font-medium shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60
		{variants[variant]} {sizes[size]} {fullWidth ? 'w-full' : ''}"
>
	{#if loading}
		<Loader2 class="h-4 w-4 animate-spin" />
	{/if}
	{@render children()}
</button>
