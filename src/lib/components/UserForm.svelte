<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import { toast } from '$lib/stores/toast';
	import type { User, UserRole } from '$lib/types/api';
	import type { UserFormData, UserUpdateData } from '$lib/api/users';

	type Mode = 'create' | 'edit';
	type SubmitData = UserFormData | UserUpdateData;

	interface Props {
		mode: Mode;
		initial?: User | null;
		onsaved: (data: SubmitData) => Promise<void> | void;
		oncancel: () => void;
	}

	let { mode, initial = null, onsaved, oncancel }: Props = $props();

	let username = $state(initial?.username ?? '');
	let email = $state(initial?.email ?? '');
	let role = $state<UserRole>(initial?.role ?? 'viewer');
	let isActive = $state(initial?.is_active ?? true);
	let password = $state('');
	let confirmPassword = $state('');
	let saving = $state(false);
	let errors = $state<Record<string, string>>({});

	function validate(): boolean {
		const e: Record<string, string> = {};
		if (mode === 'create') {
			if (!username.trim()) e.username = 'Username wajib diisi';
			else if (username.length < 3) e.username = 'Minimal 3 karakter';
			if (!email.trim()) e.email = 'Email wajib diisi';
			else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Format email tidak valid';
			if (!password) e.password = 'Password wajib diisi';
			else if (password.length < 8) e.password = 'Minimal 8 karakter';
			if (password !== confirmPassword) e.confirmPassword = 'Password tidak cocok';
		} else {
			if (!email.trim()) e.email = 'Email wajib diisi';
			else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Format email tidak valid';
		}
		errors = e;
		return Object.keys(e).length === 0;
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();
		if (!validate() || saving) return;
		saving = true;
		try {
			if (mode === 'create') {
				await onsaved({
					username: username.trim(),
					email: email.trim(),
					role,
					password
				});
			} else {
				await onsaved({
					email: email.trim(),
					role,
					is_active: isActive
				});
			}
		} catch (err) {
			toast.error((err as Error).message);
		} finally {
			saving = false;
		}
	}
</script>

<form onsubmit={handleSubmit} class="space-y-5">
	{#if errors._form}
		<div class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errors._form}</div>
	{/if}

	<div class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
		<h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">Informasi Akun</h2>
		<div class="grid gap-4">
			<label class="block">
				<span class="mb-1 block text-sm font-medium text-gray-700">Username *</span>
				<input
					type="text"
					bind:value={username}
					placeholder="operator01"
					disabled={mode === 'edit'}
					class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100"
				/>
				{#if errors.username}<span class="mt-1 block text-xs text-red-600">{errors.username}</span>{/if}
			</label>

			<label class="block">
				<span class="mb-1 block text-sm font-medium text-gray-700">Email *</span>
				<input
					type="email"
					bind:value={email}
					placeholder="user@example.com"
					class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
				/>
				{#if errors.email}<span class="mt-1 block text-xs text-red-600">{errors.email}</span>{/if}
			</label>

			{#if mode === 'create'}
				<div class="grid gap-4 md:grid-cols-2">
					<label class="block">
						<span class="mb-1 block text-sm font-medium text-gray-700">Password *</span>
						<input
							type="password"
							bind:value={password}
							placeholder="Minimal 8 karakter"
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
						/>
						{#if errors.password}<span class="mt-1 block text-xs text-red-600">{errors.password}</span>{/if}
					</label>
					<label class="block">
						<span class="mb-1 block text-sm font-medium text-gray-700">Konfirmasi *</span>
						<input
							type="password"
							bind:value={confirmPassword}
							placeholder="Ulangi password"
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
						/>
						{#if errors.confirmPassword}<span class="mt-1 block text-xs text-red-600">{errors.confirmPassword}</span>{/if}
					</label>
				</div>
			{/if}

			<label class="block">
				<span class="mb-1 block text-sm font-medium text-gray-700">Role *</span>
				<select
					bind:value={role}
					class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
				>
					<option value="superadmin">Superadmin</option>
					<option value="admin">Admin</option>
					<option value="viewer">Viewer</option>
				</select>
			</label>

			{#if mode === 'edit'}
				<label class="flex items-center gap-2">
					<input type="checkbox" bind:checked={isActive} class="rounded border-gray-300" />
					<span class="text-sm text-gray-700">User aktif</span>
				</label>
			{/if}
		</div>
	</div>

	<div class="flex justify-end gap-2">
		<Button variant="secondary" onclick={oncancel}>Batal</Button>
		<Button type="submit" loading={saving}>
			{saving ? 'Menyimpan…' : mode === 'create' ? 'Tambah User' : 'Simpan'}
		</Button>
	</div>
</form>
