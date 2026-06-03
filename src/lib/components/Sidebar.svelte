<script lang="ts">
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { user } from '$lib/stores/auth';

	type Icon = 'dashboard' | 'live' | 'cameras' | 'edges' | 'recordings' | 'users' | 'settings';

	interface NavItem {
		href: string;
		label: string;
		icon: Icon;
		roles?: Array<'admin' | 'operator' | 'viewer'>;
	}

	const items: NavItem[] = [
		{ href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
		{ href: '/live', label: 'Live Monitoring', icon: 'live' },
		{ href: '/cameras', label: 'Cameras', icon: 'cameras' },
		{ href: '/edges', label: 'Edges', icon: 'edges' },
		{ href: '/recordings', label: 'Recordings', icon: 'recordings' },
		{
			href: '/users',
			label: 'Users',
			icon: 'users',
			roles: ['admin']
		},
		{ href: '/profile', label: 'Profile', icon: 'settings' }
	];

	const COLLAPSED_KEY = 'cctv.sidebar.collapsed';

	let collapsed = $state(false);
	let mounted = $state(false);

	if (browser) {
		collapsed = localStorage.getItem(COLLAPSED_KEY) === '1';
		mounted = true;
	}

	$effect(() => {
		if (!browser || !mounted) return;
		localStorage.setItem(COLLAPSED_KEY, collapsed ? '1' : '0');
	});

	function toggle() {
		collapsed = !collapsed;
	}

	function isActive(href: string, current: string): boolean {
		return current === href || current.startsWith(href + '/');
	}

	function canAccess(item: NavItem, role: string | undefined): boolean {
		if (!item.roles) return true;
		return role ? item.roles.includes(role as 'admin' | 'operator' | 'viewer') : false;
	}
</script>

<aside
	class:collapsed
	class="flex h-screen shrink-0 flex-col border-r border-gray-200 bg-white transition-[width] duration-200 {collapsed
		? 'w-16'
		: 'w-60'}"
>
	<!-- Brand -->
	<div
		class="flex h-16 items-center gap-3 border-b border-gray-200 {collapsed
			? 'justify-center px-2'
			: 'px-5'}"
	>
		<div
			class="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white"
		>
			<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
				/>
			</svg>
		</div>
		{#if !collapsed}
			<div>
				<div class="text-sm font-semibold text-gray-900">CCTV Monitor</div>
				<div class="text-xs text-gray-500">Admin Panel</div>
			</div>
		{/if}
	</div>

	<!-- Nav -->
	<nav class="flex-1 space-y-1 overflow-y-auto p-3">
		{#each items as item (item.href)}
			{#if canAccess(item, $user?.role)}
				{@const active = isActive(item.href, $page.url.pathname)}
				<a
					href={item.href}
					title={collapsed ? item.label : undefined}
					aria-label={item.label}
					class="group flex items-center gap-3 rounded-lg py-2 text-sm font-medium transition-colors {collapsed
						? 'justify-center px-2'
						: 'px-3'} {active
						? 'bg-brand-50 text-brand-700'
						: 'text-gray-700 hover:bg-gray-100'}"
				>
					<svg
						class="h-5 w-5 shrink-0 {active
							? 'text-brand-600'
							: 'text-gray-400 group-hover:text-gray-600'}"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						{#if item.icon === 'dashboard'}
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
							/>
						{:else if item.icon === 'live'}
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
							/>
						{:else if item.icon === 'cameras'}
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M3 7h3l2-2h8l2 2h3a1 1 0 011 1v11a1 1 0 01-1 1H3a1 1 0 01-1-1V8a1 1 0 011-1z"
							/>
							<circle cx="12" cy="13" r="4" />
						{:else if item.icon === 'edges'}
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
							/>
						{:else if item.icon === 'recordings'}
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
							/>
						{:else if item.icon === 'users'}
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
							/>
						{:else if item.icon === 'settings'}
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
							/>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
							/>
						{/if}
					</svg>
					{#if !collapsed}
						<span>{item.label}</span>
					{/if}
				</a>
			{/if}
		{/each}
	</nav>

	<!-- Toggle -->
	<div class="border-t border-gray-200 p-3">
		<button
			type="button"
			onclick={toggle}
			aria-expanded={!collapsed}
			aria-label={collapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
			title={collapsed ? 'Perluas' : 'Ciutkan'}
			class="flex w-full items-center gap-3 rounded-lg py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 {collapsed
				? 'justify-center px-2'
				: 'px-3'}"
		>
			<svg
				class="h-5 w-5 shrink-0 text-gray-400 transition-transform"
				class:rotate-180={collapsed}
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M15 19l-7-7 7-7"
				/>
			</svg>
			{#if !collapsed}
				<span>Ciutkan</span>
			{/if}
		</button>
	</div>

	<!-- User -->
	{#if $user}
		<div class="border-t border-gray-200 p-3">
			<div
				class="flex items-center gap-3 rounded-lg py-2 {collapsed
					? 'justify-center px-2'
					: 'px-2'}"
			>
				<div
					class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700"
				>
					{$user.username.slice(0, 1).toUpperCase()}
				</div>
				{#if !collapsed}
					<div class="min-w-0 flex-1">
						<div class="truncate text-sm font-medium text-gray-900">
							{$user.username}
						</div>
						<div class="truncate text-xs text-gray-500 capitalize">
							{$user.role}
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</aside>
