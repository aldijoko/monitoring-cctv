<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { MetricSeries } from '$lib/types/dashboard';

	type Props = {
		series: MetricSeries[];
		height?: number;
		yMax?: number;
		showLegend?: boolean;
	};

	let { series, height = 200, yMax = 100, showLegend = true }: Props = $props();

	let canvas: HTMLCanvasElement;
	let chart: any = null;
	let ChartLib: any = null;

	onMount(async () => {
		const mod = await import('chart.js/auto');
		ChartLib = mod.default;
		chart = new ChartLib(canvas, {
			type: 'line',
			data: buildData(),
			options: {
				responsive: true,
				maintainAspectRatio: false,
				interaction: { mode: 'index', intersect: false },
				plugins: {
					legend: {
						display: showLegend,
						position: 'bottom',
						labels: { boxWidth: 8, boxHeight: 8, font: { size: 10 } }
					},
					tooltip: {
						backgroundColor: 'rgba(15, 23, 42, 0.95)',
						padding: 10,
						titleFont: { size: 11 },
						bodyFont: { size: 11 }
					}
				},
				scales: {
					x: {
						type: 'time',
						time: { unit: 'hour', displayFormats: { hour: 'HH:mm' } },
						grid: { color: 'rgba(148, 163, 184, 0.1)' },
						ticks: { color: '#94a3b8', font: { size: 10 } }
					},
					y: {
						min: 0,
						max: yMax,
						grid: { color: 'rgba(148, 163, 184, 0.1)' },
						ticks: { color: '#94a3b8', font: { size: 10 } }
					}
				},
				elements: {
					point: { radius: 0, hoverRadius: 4 },
					line: { tension: 0.35, borderWidth: 2 }
				}
			}
		});
	});

	function buildData() {
		return {
			labels: series[0]?.data.map((p) => p.timestamp) ?? [],
			datasets: series.map((s) => ({
				label: `${s.name} (${s.unit})`,
				data: s.data.map((p) => ({ x: p.timestamp, y: p.value })),
				borderColor: s.color,
				backgroundColor: s.color + '20',
				fill: true,
				pointBackgroundColor: s.color
			}))
		};
	}

	$effect(() => {
		if (chart) {
			chart.data = buildData();
			chart.update('none');
		}
	});

	onDestroy(() => {
		chart?.destroy();
	});
</script>

<div style="height: {height}px; position: relative;">
	<canvas bind:this={canvas}></canvas>
</div>
