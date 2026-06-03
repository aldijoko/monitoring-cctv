<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	type Props = {
		values: number[];
		color?: string;
		height?: number;
		fill?: boolean;
	};

	let { values, color = '#3b82f6', height = 32, fill = true }: Props = $props();

	let canvas: HTMLCanvasElement;
	let chart: any = null;

	onMount(async () => {
		const { default: Chart } = await import('chart.js/auto');
		chart = new Chart(canvas, {
			type: 'line',
			data: {
				labels: values.map((_, i) => i),
				datasets: [
					{
						data: values,
						borderColor: color,
						backgroundColor: fill ? color + '30' : 'transparent',
						fill,
						tension: 0.4,
						pointRadius: 0,
						borderWidth: 1.5
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: { legend: { display: false }, tooltip: { enabled: false } },
				scales: {
					x: { display: false },
					y: { display: false, beginAtZero: true }
				},
				elements: { line: { borderJoinStyle: 'round' } }
			}
		});
	});

	$effect(() => {
		if (chart) {
			chart.data.datasets[0].data = values;
			chart.data.datasets[0].borderColor = color;
			chart.data.datasets[0].backgroundColor = fill ? color + '30' : 'transparent';
			chart.update('none');
		}
	});

	onDestroy(() => chart?.destroy());
</script>

<div style="height: {height}px; position: relative;">
	<canvas bind:this={canvas}></canvas>
</div>
