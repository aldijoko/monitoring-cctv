<script lang="ts">
	import { clearSession } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { toasts } from '$lib/stores/toast';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Card from '$lib/components/Card.svelte';
	import Input from '$lib/components/Input.svelte';
	import Button from '$lib/components/Button.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let fullName = $state(data.user.username);
	let email = $state(data.user.email ?? '');
	let saving = $state(false);

	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let passwordSaving = $state(false);

	let loginActivity = $derived(
		data.user.created_at
			? [
					{
						label: 'Akun dibuat',
						at: data.user.created_at
					}
				]
			: []
	);

	async function saveProfile(e: Event) {
		e.preventDefault();
		saving = true;
		await new Promise((r) => setTimeout(r, 400));
		toasts.success('Profil berhasil disimpan');
		saving = false;
	}

	async function changePassword(e: Event) {
		e.preventDefault();

		if (!currentPassword || !newPassword || !confirmPassword) {
			toasts.error('Semua field password wajib diisi');
			return;
		}
		if (newPassword.length < 6) {
			toasts.error('Password baru minimal 6 karakter');
			return;
		}
		if (newPassword !== confirmPassword) {
			toasts.error('Konfirmasi password tidak cocok');
			return;
		}

		passwordSaving = true;
		await new Promise((r) => setTimeout(r, 500));
		toasts.success('Password berhasil diperbarui');
		currentPassword = '';
		newPassword = '';
		confirmPassword = '';
		passwordSaving = false;
	}

	function logout() {
		clearSession();
		toasts.info('Anda telah keluar');
		goto('/login', { replaceState: true });
	}

	function formatDate(iso: string): string {
		try {
			return new Date(iso).toLocaleString('id-ID', {
				dateStyle: 'medium',
				timeStyle: 'short'
			});
		} catch {
			return iso;
		}
	}
</script>

<svelte:head><title>Profile — Monitoring CCTV</title></svelte:head>

<PageHeader title="Profile" subtitle="Kelola informasi akun dan preferensi Anda" />

<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
	<!-- Left column: account summary -->
	<div class="space-y-6 lg:col-span-1">
		<Card>
			<div class="flex flex-col items-center text-center">
				<div
					class="flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 text-2xl font-semibold text-brand-700"
				>
					{data.user.username.slice(0, 1).toUpperCase()}
				</div>
				<div class="mt-3 text-base font-semibold text-gray-900">
					{data.user.username}
				</div>
				<div class="text-sm text-gray-500">
					{email || '—'}
				</div>
				<span
					class="mt-3 inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium capitalize text-brand-700"
				>
					{data.user.role}
				</span>
			</div>

			<dl
				class="mt-6 divide-y divide-gray-100 border-t border-gray-100 text-sm"
			>
				<div class="flex items-center justify-between py-3">
					<dt class="text-gray-500">Status</dt>
					<dd>
						<span
							class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium {data.user
								.is_active
								? 'bg-emerald-50 text-emerald-700'
								: 'bg-gray-100 text-gray-600'}"
						>
							{data.user.is_active ? 'Aktif' : 'Nonaktif'}
						</span>
					</dd>
				</div>
				<div class="flex items-center justify-between py-3">
					<dt class="text-gray-500">User ID</dt>
					<dd class="font-mono text-gray-900">{data.user.id}</dd>
				</div>
				{#if data.user.created_at}
					<div class="flex items-center justify-between py-3">
						<dt class="text-gray-500">Bergabung</dt>
						<dd class="text-gray-900">{formatDate(data.user.created_at)}</dd>
					</div>
				{/if}
			</dl>
		</Card>

		<Card>
			{#snippet header()}
				<h2 class="text-sm font-semibold text-gray-900">Aktivitas Login</h2>
			{/snippet}
			{#if loginActivity.length === 0}
				<p class="text-sm text-gray-500">Belum ada aktivitas tercatat.</p>
			{:else}
				<ul class="space-y-3 text-sm">
					{#each loginActivity as item}
						<li class="flex items-start gap-3">
							<div
								class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500"
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
										d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
							</div>
							<div class="min-w-0 flex-1">
								<div class="font-medium text-gray-900">{item.label}</div>
								<div class="text-xs text-gray-500">{formatDate(item.at)}</div>
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</Card>
	</div>

	<!-- Right column: forms -->
	<div class="space-y-6 lg:col-span-2">
		<Card>
			{#snippet header()}
				<div>
					<h2 class="text-sm font-semibold text-gray-900">Informasi Akun</h2>
					<p class="mt-0.5 text-xs text-gray-500">Perbarui detail profil Anda</p>
				</div>
			{/snippet}
			<form onsubmit={saveProfile} class="space-y-4">
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<Input
						label="Username"
						type="text"
						value={data.user.username}
						disabled
					/>
					<Input
						label="Nama Lengkap"
						type="text"
						bind:value={fullName}
						placeholder="Nama lengkap Anda"
					/>
				</div>
				<Input
					label="Email"
					type="email"
					bind:value={email}
					placeholder="nama@perusahaan.com"
				/>
				<div class="flex justify-end">
					<Button type="submit" loading={saving}>Simpan Perubahan</Button>
				</div>
			</form>
		</Card>

		<Card>
			{#snippet header()}
				<div>
					<h2 class="text-sm font-semibold text-gray-900">Ubah Password</h2>
					<p class="mt-0.5 text-xs text-gray-500">Gunakan minimal 6 karakter</p>
				</div>
			{/snippet}
			<form onsubmit={changePassword} class="space-y-4">
				<Input
					label="Password Saat Ini"
					type="password"
					bind:value={currentPassword}
					autocomplete="current-password"
					required
				/>
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<Input
						label="Password Baru"
						type="password"
						bind:value={newPassword}
						autocomplete="new-password"
						required
					/>
					<Input
						label="Konfirmasi Password"
						type="password"
						bind:value={confirmPassword}
						autocomplete="new-password"
						required
					/>
				</div>
				<div class="flex justify-end">
					<Button type="submit" loading={passwordSaving}>Perbarui Password</Button>
				</div>
			</form>
		</Card>

		<Card>
			{#snippet header()}
				<div>
					<h2 class="text-sm font-semibold text-gray-900">Sesi</h2>
					<p class="mt-0.5 text-xs text-gray-500">Kelola sesi login Anda saat ini</p>
				</div>
			{/snippet}
			<div
				class="flex flex-col items-start justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center"
			>
				<div>
					<div class="text-sm font-medium text-gray-900">Keluar dari perangkat ini</div>
					<div class="text-xs text-gray-500">
						Anda akan diarahkan ke halaman login.
					</div>
				</div>
				<Button variant="danger" onclick={logout}>Keluar</Button>
			</div>
		</Card>
	</div>
</div>
