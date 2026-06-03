<script lang="ts">
	import { goto } from '$app/navigation';
	import { user, clearSession } from '$lib/stores/auth';
	import { toasts } from '$lib/stores/toast';
	import { authApi } from '$lib/api/auth';

	interface Props {
		title?: string;
	}

	let { title = '' }: Props = $props();

	let menuOpen = $state(false);

	async function handleLogout() {
		try {
			await authApi.logout();
		} catch {
			// best-effort — clear local session regardless
		}
		clearSession();
		toasts.info('Anda telah keluar');
		await goto('/login');
	}

	function toggleMenu() {
		menuOpen = !menuOpen;
	}
</script>

<header
	class="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white/80 px-6 backdrop-blur"
>
	<h1 class="text-lg font-semibold text-gray-900">{title}</h1>

	<div class="flex items-center gap-3">
		<button
			type="button"
			class="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100"
			aria-label="Notifikasi"
		>
			<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
				/>
			</svg>
		</button>

		<div class="relative">
			<button
				type="button"
				class="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-gray-100"
				onclick={toggleMenu}
				aria-haspopup="menu"
				aria-expanded={menuOpen}
			>
				<div
					class="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700"
				>
					{$user?.username.slice(0, 1).toUpperCase() ?? '?'}
				</div>
				<span class="hidden text-sm font-medium text-gray-700 sm:block">
					{$user?.username ?? 'User'}
				</span>
				<svg
					class="h-4 w-4 text-gray-400"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M19 9l-7 7-7-7"
					/>
				</svg>
			</button>

			{#if menuOpen}
				<div
					class="absolute right-0 mt-2 w-48 origin-top-right rounded-lg bg-white py-1 shadow-lg ring-1 ring-gray-100 animate-slide-in-from-top-2"
					role="menu"
				>
					<a
						href="/profile"
						class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
						role="menuitem"
					>
						Profil saya
					</a>
					<button
						type="button"
						class="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
						role="menuitem"
						onclick={handleLogout}
					>
						Keluar
					</button>
				</div>
			{/if}
		</div>
	</div>
</header>
