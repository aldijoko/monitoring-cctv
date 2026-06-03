<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { CameraHealthBucket } from '$lib/types/dashboard';

	type Props = {
		data: CameraHealthBucket[];
		height?: number;
	};

	let { data, height = 180 }: Props = $props();

	let canvas: HTMLCanvasElement;
	let chart: any = null;

	onMount(async () => {
		const { default: Chart } = await import('chart.js/auto');
		chart = new Chart(canvas, {
			type: 'bar',
			data: {
				labels: data.map((d) => `${d.range}%`),
				datasets: [
					{
						label: 'Kamera',
						data: data.map((d) => d.count),
						backgroundColor: data.map((d) => d.color),
						borderRadius: 4,
						borderSkipped: false
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: { display: false },
					tooltip: {
						backgroundColor: 'rgba(15, 23, 42, 0.95)',
						padding: 10,
						callbacks: {
							label: (ctx: any) => ` ${ctx.parsed.y} kamera`
						}
					}
				},
				scales: {
					x: {
						grid: { display: false },
						ticks: { color: '#94a3b8', font: { size: 10 } }
					},
					y: {
						beginAtZero: true,
						grid: { color: 'rgba(148, 163, 184, 0.1)' },
						ticks: { color: '#94a3b8', font: { size: 10 }, precision: 0 }
					}
				}
			}
		});
	});

	$effect(() => {
		if (chart) {
			chart.data.labels = data.map((d) => `${d.range}%`);
			chart.data.datasets[0].data = data.map((d) => d.count);
			chart.data.datasets[0].backgroundColor = data.map((d) => d.color);
			chart.update('none');
		}
	});

	onDestroy(() => chart?.destroy());
</script>

<div style="height: {height}px; position: relative;">
	<canvas bind:this={canvas}></canvas>
</div>
