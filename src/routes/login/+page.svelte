<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let loading = $state(false);
</script>

<div
	class="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 via-white to-brand-50/40 p-4"
>
	<div class="w-full max-w-md">
		<div class="mb-8 text-center">
			<div
				class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg"
			>
				<svg
					class="h-8 w-8"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
					/>
				</svg>
			</div>
			<h1 class="text-2xl font-semibold text-gray-900">CCTV Monitoring</h1>
			<p class="mt-1 text-sm text-gray-500">Masuk ke panel administrator</p>
		</div>

		<div class="card p-8">
			<form
				method="POST"
				class="space-y-4"
				use:enhance={() => {
					loading = true;
					return async ({ update }) => {
						await update();
						loading = false;
					};
				}}
			>
				<Input
					label="Username"
					name="username"
					type="text"
					value={form?.username ?? 'admin'}
					placeholder="admin"
					autocomplete="username"
					required
					disabled={loading}
				/>

				<Input
					label="Password"
					name="password"
					type="password"
					placeholder="••••••••"
					autocomplete="current-password"
					required
					disabled={loading}
				/>

				{#if form?.error}
					<div
						class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
					>
						{form.error}
					</div>
				{/if}

				<Button type="submit" {loading} fullWidth>
					{loading ? 'Memproses...' : 'Masuk'}
				</Button>
			</form>
		</div>

		<p class="mt-6 text-center text-xs text-gray-400">
			© {new Date().getFullYear()} CCTV Monitoring Platform
		</p>
	</div>
</div>
