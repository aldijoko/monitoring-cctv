<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Button from '$lib/components/Button.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import EdgeForm from '$lib/components/EdgeForm.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import { edgesApi, type EdgeFormData } from '$lib/api/edges';
	import { toast } from '$lib/stores/toast';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let formOpen = $state(false);
	let deleting = $state(false);
	let deleteLoading = $state(false);

	async function handleUpdate(formData: EdgeFormData) {
		try {
			await edgesApi.update(data.edge.id, formData);
			toast.success('Perubahan disimpan');
			formOpen = false;
			await invalidateAll();
		} catch (err) {
			toast.error('Gagal menyimpan perubahan');
			console.error(err);
		}
	}

	async function handleDelete() {
		deleteLoading = true;
		try {
			await edgesApi.remove(data.edge.id);
			toast.success(`Edge ${data.edge.code} dihapus`);
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
	<title>{data.edge.code} — {data.edge.name} — CCTV Monitoring</title>
</svelte:head>

<PageHeader title={data.edge.name} description={data.edge.code}>
	{#snippet breadcrumbs()}
		<a href="/edges" class="hover:text-gray-700">Edges</a>
		<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
		</svg>
		<span class="text-gray-700">{data.edge.code}</span>
	{/snippet}
	{#snippet actions()}
		<Button variant="secondary" onclick={() => (formOpen = true)}>Edit</Button>
		<Button variant="danger" onclick={() => (deleting = true)}>Hapus</Button>
	{/snippet}
</PageHeader>

<div class="p-6">
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
					<div class="font-mono text-sm text-gray-500">{data.edge.code}</div>
					<StatusBadge status={data.edge.status} />
				</div>
			</div>

			<dl class="mt-6 space-y-3 text-sm">
				<div>
					<dt class="text-xs uppercase tracking-wider text-gray-500">Nama</dt>
					<dd class="mt-1 font-medium text-gray-900">{data.edge.name}</dd>
				</div>
				<div>
					<dt class="text-xs uppercase tracking-wider text-gray-500">Hostname</dt>
					<dd class="mt-1 font-mono text-gray-900">{data.edge.hostname ?? '—'}</dd>
				</div>
				<div>
					<dt class="text-xs uppercase tracking-wider text-gray-500">IP Address</dt>
					<dd class="mt-1 font-mono text-gray-900">{data.edge.ip_address ?? '—'}</dd>
				</div>
				<div>
					<dt class="text-xs uppercase tracking-wider text-gray-500">Last Heartbeat</dt>
					<dd class="mt-1 text-gray-900">{formatDate(data.edge.last_heartbeat)}</dd>
				</div>
				<div>
					<dt class="text-xs uppercase tracking-wider text-gray-500">Dibuat</dt>
					<dd class="mt-1 text-gray-900">{formatDate(data.edge.created_at)}</dd>
				</div>
			</dl>
		</div>

		<!-- Metrics & cameras -->
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
				<div class="flex items-center justify-between">
					<div>
						<h2 class="text-base font-semibold text-gray-900">Kamera</h2>
						<p class="mt-1 text-sm text-gray-500">Daftar kamera yang terhubung ke edge ini</p>
					</div>
					<a
						href="/cameras/new?edge_id={data.edge.id}"
						class="text-xs font-medium text-brand-600 hover:text-brand-700"
					>
						+ Tambah Kamera
					</a>
				</div>
				{#if data.cameras.length === 0}
					<div
						class="mt-6 flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 text-sm text-gray-400"
					>
						Belum ada kamera
					</div>
				{:else}
					<div class="mt-4 divide-y divide-gray-100">
						{#each data.cameras as cam (cam.id)}
							<a
								href="/cameras/{cam.id}"
								class="flex items-center justify-between py-3 hover:bg-gray-50"
							>
								<div>
									<div class="text-sm font-medium text-gray-900">{cam.name}</div>
									<div class="text-xs text-gray-500">CH {cam.channel} · {cam.resolution}</div>
								</div>
								<StatusBadge status={cam.enabled ? cam.status : 'inactive'} />
							</a>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<Modal bind:open={formOpen} title={`Edit Edge ${data.edge.code}`} size="lg">
	{#snippet children()}
		<EdgeForm
			mode="edit"
			initial={data.edge}
			onsaved={handleUpdate}
			oncancel={() => (formOpen = false)}
		/>
	{/snippet}
</Modal>

<ConfirmDialog
	open={deleting}
	title="Hapus Edge?"
	message={`Edge ${data.edge.code} (${data.edge.name}) akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`}
	confirmText="Hapus"
	variant="danger"
	loading={deleteLoading}
	onconfirm={handleDelete}
	oncancel={() => (deleting = false)}
/>
