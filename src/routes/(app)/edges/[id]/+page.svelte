<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Button from '$lib/components/Button.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import EdgeForm from '$lib/components/EdgeForm.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import { edgesApi, type EdgeFormData } from '$lib/api/edges';
	import { toast } from '$lib/stores/toast';
	import type { Edge } from '$lib/types/api';

	let edge = $state<Edge | null>(null);
	let loading = $state(true);
	let notFound = $state(false);

	let formOpen = $state(false);
	let deleting = $state(false);
	let deleteLoading = $state(false);

	const id = $derived(Number($page.params.id));

	async function load() {
		loading = true;
		notFound = false;
		try {
			const e = await edgesApi.get(id);
			if (!e) {
				notFound = true;
			} else {
				edge = e;
			}
		} catch (err) {
			toast.error('Gagal memuat detail edge');
			console.error(err);
		} finally {
			loading = false;
		}
	}

	onMount(load);

	$effect(() => {
		if (id) load();
	});

	async function handleUpdate(data: EdgeFormData) {
		if (!edge) return;
		try {
			const updated = await edgesApi.update(edge.id, data);
			edge = updated;
			toast.success('Perubahan disimpan');
			formOpen = false;
		} catch (err) {
			toast.error('Gagal menyimpan perubahan');
			console.error(err);
		}
	}

	async function handleDelete() {
		if (!edge) return;
		deleteLoading = true;
		try {
			await edgesApi.remove(edge.id);
			toast.success(`Edge ${edge.code} dihapus`);
			await goto('/edges');
		} catch (err) {
			toast.error('Gagal menghapus edge');
			console.error(err);
		} finally {
			deleteLoading = false;
		}
	}

	function formatDate(iso?: string): string {
		if (!iso) return '—';
		return new Date(iso).toLocaleString('id-ID', {
			dateStyle: 'long',
			timeStyle: 'short'
		});
	}
</script>

<svelte:head>
	<title>{edge ? `${edge.code} — ${edge.name}` : 'Edge'} — CCTV Monitoring</title>
</svelte:head>

<PageHeader
	title={edge ? edge.name : 'Memuat...'}
	description={edge ? edge.code : ''}
>
	{#snippet breadcrumbs()}
		<a href="/edges" class="hover:text-gray-700">Edges</a>
		<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
		</svg>
		<span class="text-gray-700">{edge?.code ?? '...'}</span>
	{/snippet}
	{#snippet actions()}
		{#if edge}
			<Button variant="secondary" onclick={() => (formOpen = true)}>Edit</Button>
			<Button variant="danger" onclick={() => (deleting = true)}>Hapus</Button>
		{/if}
	{/snippet}
</PageHeader>

<div class="p-6">
	{#if loading}
		<div class="flex items-center justify-center py-16">
			<div class="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600"></div>
		</div>
	{:else if notFound}
		<div class="card p-10 text-center">
			<h2 class="text-lg font-semibold text-gray-900">Edge tidak ditemukan</h2>
			<p class="mt-1 text-sm text-gray-500">Edge dengan ID {id} tidak ada atau sudah dihapus.</p>
			<div class="mt-6">
				<Button variant="secondary" onclick={() => goto('/edges')}>
					Kembali ke daftar
				</Button>
			</div>
		</div>
	{:else if edge}
		<div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
			<!-- Profile card -->
			<div class="card lg:col-span-1 p-6">
				<div class="flex items-center gap-3">
					<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
						<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
						</svg>
					</div>
					<div>
						<div class="font-mono text-sm text-gray-500">{edge.code}</div>
						<StatusBadge status={edge.status} />
					</div>
				</div>

				<dl class="mt-6 space-y-3 text-sm">
					<div>
						<dt class="text-xs uppercase tracking-wider text-gray-500">Nama</dt>
						<dd class="mt-1 font-medium text-gray-900">{edge.name}</dd>
					</div>
					<div>
						<dt class="text-xs uppercase tracking-wider text-gray-500">Hostname</dt>
						<dd class="mt-1 font-mono text-gray-900">{edge.hostname ?? '—'}</dd>
					</div>
					<div>
						<dt class="text-xs uppercase tracking-wider text-gray-500">IP Address</dt>
						<dd class="mt-1 font-mono text-gray-900">{edge.ip_address ?? '—'}</dd>
					</div>
					<div>
						<dt class="text-xs uppercase tracking-wider text-gray-500">Last Heartbeat</dt>
						<dd class="mt-1 text-gray-900">{formatDate(edge.last_heartbeat)}</dd>
					</div>
					<div>
						<dt class="text-xs uppercase tracking-wider text-gray-500">Dibuat</dt>
						<dd class="mt-1 text-gray-900">{formatDate(edge.created_at)}</dd>
					</div>
				</dl>
			</div>

			<!-- Placeholder metrics & cameras -->
			<div class="space-y-4 lg:col-span-2">
				<div class="card p-6">
					<h2 class="text-base font-semibold text-gray-900">Metrics</h2>
					<p class="mt-1 text-sm text-gray-500">CPU, RAM, disk, dan GPU edge</p>
					<div class="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
						{#each [{ label: 'CPU', value: '0%' }, { label: 'RAM', value: '0%' }, { label: 'Disk', value: '0%' }, { label: 'GPU', value: '0%' }] as m (m.label)}
							<div class="rounded-lg border border-gray-100 p-4">
								<div class="text-xs uppercase tracking-wider text-gray-500">{m.label}</div>
								<div class="mt-1 text-2xl font-semibold text-gray-900">{m.value}</div>
							</div>
						{/each}
					</div>
				</div>

				<div class="card p-6">
					<h2 class="text-base font-semibold text-gray-900">Kamera</h2>
					<p class="mt-1 text-sm text-gray-500">Daftar kamera yang terhubung ke edge ini</p>
					<div
						class="mt-6 flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 text-sm text-gray-400"
					>
						Belum ada kamera
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- Modals -->
{#if edge}
	<Modal bind:open={formOpen} title={`Edit Edge ${edge.code}`} size="lg">
		{#snippet children()}
			<EdgeForm
				mode="edit"
				initial={edge}
				onsaved={handleUpdate}
				oncancel={() => (formOpen = false)}
			/>
		{/snippet}
	</Modal>

	<ConfirmDialog
		open={deleting}
		title="Hapus Edge?"
		message={`Edge ${edge.code} (${edge.name}) akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`}
		confirmText="Hapus"
		variant="danger"
		loading={deleteLoading}
		onconfirm={handleDelete}
		oncancel={() => (deleting = false)}
	/>
{/if}
