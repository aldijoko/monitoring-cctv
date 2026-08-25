<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { navigating } from '$app/state';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import LineChart from '$lib/components/LineChart.svelte';
	import BarChart from '$lib/components/BarChart.svelte';
	import Sparkline from '$lib/components/Sparkline.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import type { EdgeMetrics, EdgeHealth, CameraAlert, DashboardData } from '$lib/types/dashboard';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let loading = $derived(!!navigating.to);
	let selectedEdgeId = $state<string | null>(data.dashboard.edges[0]?.edge_id ?? null);

	const selectedEdge = $derived<EdgeMetrics | null>(
		data.dashboard.edges.find((e) => e.edge_id === selectedEdgeId) ?? null
	);

	function formatNumber(n: number): string {
		return n.toLocaleString('id-ID');
	}

	function edgeStatus(s: EdgeHealth['status']) {
		return s;
	}

	function timeAgo(iso: string): string {
		const diff = Date.now() - new Date(iso).getTime();
		const m = Math.floor(diff / 60000);
		if (m < 1) return 'baru saja';
		if (m < 60) return `${m} mnt lalu`;
		const h = Math.floor(m / 60);
		if (h < 24) return `${h} jam lalu`;
		return `${Math.floor(h / 24)} hari lalu`;
	}

	function edgeHealth(e: EdgeMetrics): EdgeHealth {
		const last = e.cpu.data.at(-1)?.timestamp ?? new Date().toISOString();
		let status: EdgeHealth['status'] = 'online';
		if (e.uptime_pct < 95 || e.cameras_online < e.cameras_total) status = 'degraded';
		if (e.uptime_pct < 90) status = 'offline';
		return {
			code: e.edge_id,
			name: e.edge_name,
			uptimePct: e.uptime_pct,
			onlineCameras: e.cameras_online,
			totalCameras: e.cameras_total,
			status,
			lastHeartbeat: last
		};
	}

	const edgeHealthList = $derived<EdgeHealth[]>(data.dashboard.edges.map(edgeHealth));

	function recentAlerts(d: DashboardData): CameraAlert[] {
		const alerts: CameraAlert[] = [];
		d.edges.forEach((e) => {
			if (e.disk.data.at(-1) && e.disk.data.at(-1)!.value > 80) {
				alerts.push({
					id: `${e.edge_id}-disk`,
					edgeCode: e.edge_id,
					cameraName: '—',
					severity: e.disk.data.at(-1)!.value > 90 ? 'critical' : 'warning',
					message: `Disk usage ${e.disk.data.at(-1)!.value.toFixed(0)}% di ${e.edge_name}`,
					timestamp: e.disk.data.at(-1)!.timestamp
				});
			}
			if (e.cameras_online < e.cameras_total) {
				alerts.push({
					id: `${e.edge_id}-cam`,
					edgeCode: e.edge_id,
					cameraName: '—',
					severity: 'warning',
					message: `${e.cameras_total - e.cameras_online} kamera offline di ${e.edge_name}`,
					timestamp: e.cpu.data.at(-1)?.timestamp ?? new Date().toISOString()
				});
			}
		});
		return alerts
			.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
			.slice(0, 6);
	}

	const alerts = $derived<CameraAlert[]>(recentAlerts(data.dashboard));
</script>

<svelte:head><title>Dashboard — Monitoring CCTV</title></svelte:head>

<PageHeader
	title="Dashboard"
	description="Ringkasan sistem monitoring CCTV"
/>

<div class="p-6 space-y-6">
	{#if loading}
		<div class="py-12 text-center text-sm text-gray-500">Memuat data dashboard…</div>
	{:else}
		<!-- KPI cards -->
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<div class="card p-5">
				<p class="text-sm font-medium text-gray-500">Total Edges</p>
				<p class="mt-2 text-3xl font-semibold text-gray-900">
					{formatNumber(data.dashboard.summary.edges_total)}
				</p>
				<p class="mt-1 text-xs text-gray-400">
					{formatNumber(data.dashboard.summary.edges_online)} online ·
					{formatNumber(data.dashboard.summary.edges_offline)} offline
				</p>
				<div class="mt-3 h-8">
					<Sparkline
						values={data.dashboard.edges.map((e) => e.uptime_pct)}
						color="#10b981"
						height={32}
					/>
				</div>
			</div>

			<div class="card p-5">
				<p class="text-sm font-medium text-gray-500">Kamera Aktif</p>
				<p class="mt-2 text-3xl font-semibold text-gray-900">
					{formatNumber(data.dashboard.summary.cameras_online)}
				</p>
				<p class="mt-1 text-xs text-gray-400">
					dari {formatNumber(data.dashboard.summary.cameras_total)}
				</p>
				<div class="mt-3 h-8">
					<Sparkline
						values={data.dashboard.edges.map((e) =>
							e.cameras_total > 0 ? (e.cameras_online / e.cameras_total) * 100 : 0
						)}
						color="#3b82f6"
						height={32}
					/>
				</div>
			</div>

			<div class="card p-5">
				<p class="text-sm font-medium text-gray-500">Storage</p>
				<p class="mt-2 text-3xl font-semibold text-gray-900">
					{formatNumber(data.dashboard.summary.storage_used_gb)} GB
				</p>
				<p class="mt-1 text-xs text-gray-400">
					{data.dashboard.summary.storage_pct.toFixed(1)}% dari {formatNumber(
						data.dashboard.summary.storage_total_gb
					)} GB
				</p>
				<div class="mt-3 h-2 w-full rounded-full bg-gray-100">
					<div
						class="h-2 rounded-full bg-amber-500"
						style="width: {data.dashboard.summary.storage_pct}%"
					></div>
				</div>
			</div>

			<div class="card p-5">
				<p class="text-sm font-medium text-gray-500">Bandwidth</p>
				<p class="mt-2 text-3xl font-semibold text-gray-900">
					{data.dashboard.summary.bandwidth_in_mbps.toFixed(1)} Mbps
				</p>
				<p class="mt-1 text-xs text-gray-400">
					Out: {data.dashboard.summary.bandwidth_out_mbps.toFixed(1)} Mbps
				</p>
				<div class="mt-3 h-8">
					<Sparkline
						values={data.dashboard.edges[0]?.network_in.data.map((p) => p.value) ?? []}
						color="#8b5cf6"
						height={32}
					/>
				</div>
			</div>
		</div>

		<!-- Performance + Uptime distribution -->
		<div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
			<div class="card lg:col-span-2 p-6">
				<div class="mb-3 flex items-center justify-between">
					<div>
						<h2 class="text-base font-semibold text-gray-900">Performa Edge</h2>
						<p class="text-sm text-gray-500">CPU, Memory, Disk 24 jam terakhir</p>
					</div>
					<select
						class="rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700"
						value={selectedEdgeId}
						onchange={(e) => (selectedEdgeId = (e.currentTarget as HTMLSelectElement).value)}
					>
						{#each data.dashboard.edges as edge (edge.edge_id)}
							<option value={edge.edge_id}>{edge.edge_id} — {edge.edge_name}</option>
						{/each}
					</select>
				</div>
				{#if selectedEdge}
					<LineChart
						series={[selectedEdge.cpu, selectedEdge.memory, selectedEdge.disk]}
						height={260}
						yMax={100}
					/>
				{/if}
			</div>

			<div class="card p-6">
				<h2 class="text-base font-semibold text-gray-900">Distribusi Uptime</h2>
				<p class="text-sm text-gray-500">Jumlah kamera per rentang uptime</p>
				<div class="mt-4">
					<BarChart data={data.dashboard.camera_health} height={260} />
				</div>
			</div>
		</div>

		<!-- Edge health + Alerts -->
		<div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
			<div class="card lg:col-span-2 p-6">
				<div class="mb-3 flex items-center justify-between">
					<h2 class="text-base font-semibold text-gray-900">Status Edge</h2>
					<a
						href="/edges"
						class="text-xs font-medium text-indigo-600 hover:text-indigo-700"
					>
						Lihat semua →
					</a>
				</div>
				<div class="overflow-hidden rounded-lg border border-gray-100">
					<table class="w-full text-sm">
						<thead class="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
							<tr>
								<th class="px-4 py-2">Edge</th>
								<th class="px-4 py-2">Uptime</th>
								<th class="px-4 py-2">Kamera</th>
								<th class="px-4 py-2">Status</th>
								<th class="px-4 py-2">Heartbeat</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-100">
							{#each edgeHealthList as e (e.code)}
								<tr class="hover:bg-gray-50">
									<td class="px-4 py-3">
										<div class="font-medium text-gray-900">{e.name}</div>
										<div class="text-xs text-gray-400">{e.code}</div>
									</td>
									<td class="px-4 py-3">
										<div class="flex items-center gap-2">
											<div class="h-1.5 w-16 rounded-full bg-gray-100">
												<div
													class="h-1.5 rounded-full {e.uptimePct >= 99
														? 'bg-green-500'
														: e.uptimePct >= 95
														? 'bg-amber-500'
														: 'bg-red-500'}"
													style="width: {e.uptimePct}%"
												></div>
											</div>
											<span class="text-xs text-gray-600">{e.uptimePct.toFixed(2)}%</span>
										</div>
									</td>
									<td class="px-4 py-3 text-gray-600">
										{e.onlineCameras}/{e.totalCameras}
									</td>
									<td class="px-4 py-3">
										<StatusBadge status={edgeStatus(e.status)} />
									</td>
									<td class="px-4 py-3 text-xs text-gray-500">
										{timeAgo(e.lastHeartbeat)}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>

			<div class="card p-6">
				<h2 class="text-base font-semibold text-gray-900">Alert Terbaru</h2>
				<p class="text-sm text-gray-500">Aktivitas yang perlu perhatian</p>
				{#if alerts.length === 0}
					<div
						class="mt-4 flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 text-sm text-gray-400"
					>
						Tidak ada alert aktif
					</div>
				{:else}
					<ul class="mt-4 space-y-2">
						{#each alerts as a (a.id)}
							<li class="flex items-start gap-3 rounded-lg border border-gray-100 p-3">
								<span
									class={'mt-0.5 inline-flex h-2 w-2 flex-shrink-0 rounded-full ' +
										(a.severity === 'critical'
											? 'bg-red-500'
											: a.severity === 'warning'
											? 'bg-amber-500'
											: 'bg-blue-500')}
								></span>
								<div class="min-w-0 flex-1">
									<p class="text-sm text-gray-900">{a.message}</p>
									<div class="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
										<span class="rounded bg-gray-100 px-1.5 py-0.5 font-mono">
											{a.edgeCode}
										</span>
										<span>·</span>
										<span>{timeAgo(a.timestamp)}</span>
									</div>
								</div>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		</div>

		<!-- Recording summary -->
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
			<div class="card p-5">
				<p class="text-sm font-medium text-gray-500">Rekam Hari Ini</p>
				<p class="mt-2 text-2xl font-semibold text-gray-900">
					{formatNumber(data.dashboard.summary.recording_hours_today)} jam
				</p>
			</div>
			<div class="card p-5">
				<p class="text-sm font-medium text-gray-500">Motion Events</p>
				<p class="mt-2 text-2xl font-semibold text-gray-900">
					{formatNumber(data.dashboard.summary.motion_events_today)}
				</p>
			</div>
			<div class="card p-5">
				<p class="text-sm font-medium text-gray-500">Diperbarui</p>
				<p class="mt-2 text-sm font-medium text-gray-900">
					{new Date(data.dashboard.generated_at).toLocaleString('id-ID', {
						dateStyle: 'medium',
						timeStyle: 'short'
					})}
				</p>
				<button
					onclick={() => invalidateAll()}
					class="mt-2 text-xs font-medium text-indigo-600 hover:text-indigo-700"
				>
					Refresh sekarang
				</button>
			</div>
		</div>
	{/if}
</div>
