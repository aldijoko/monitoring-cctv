<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type Hls from 'hls.js';
	import type { LiveCamera } from '$lib/types/api';

	export type PlaybackStatus = 'online' | 'offline' | 'connecting' | 'error';

	type Props = {
		src?: string; // HLS .m3u8 URL
		stream?: LiveCamera;
		poster?: string;
		autoplay?: boolean;
		muted?: boolean;
		controls?: boolean;
		/** Fill the parent's height instead of locking to a 16:9 box — for
		 * containers with an explicit height, e.g. a fullscreen overlay. */
		fill?: boolean;
		onerror?: (msg: string) => void;
		onstatuschange?: (s: PlaybackStatus) => void;
	};

	let {
		src: srcProp,
		stream,
		poster,
		autoplay = true,
		muted = true,
		controls = true,
		fill = false,
		onerror,
		onstatuschange
	}: Props = $props();

	const src = $derived(stream?.stream_url ?? srcProp ?? '');

	let video: HTMLVideoElement;
	let hls: Hls | null = null;
	let state = $state<'idle' | 'loading' | 'playing' | 'error'>('idle');
	let errorMsg = $state<string | null>(null);

	function setStatus(s: PlaybackStatus) {
		state = s === 'online' ? 'playing' : s === 'error' ? 'error' : 'loading';
		onstatuschange?.(s);
	}

	onMount(async () => {
		state = 'loading';
		if (!src) {
			errorMsg = 'Stream URL tidak tersedia';
			state = 'error';
			onerror?.(errorMsg);
			return;
		}
		try {
			if (video.canPlayType('application/vnd.apple.mpegurl')) {
				// Native HLS (Safari)
				video.src = src;
			} else {
				// HLS.js (Chrome/Firefox)
				const { default: HlsLib } = await import('hls.js');
				if (HlsLib.isSupported()) {
					// Low-latency HLS needs tight blocking-reload timing from the
					// player, which struggles against sources relayed over the
					// public internet (jittery upstream) rather than a local
					// camera — regular HLS tolerates that jitter far better, and
					// a few seconds of extra latency is fine for a monitoring
					// dashboard. Must match mediamtx.yml's hlsVariant (mpegts).
					hls = new HlsLib({ enableWorker: true, lowLatencyMode: false });
					hls.loadSource(src);
					hls.attachMedia(video);
					hls.on(HlsLib.Events.MANIFEST_PARSED, () => {
						if (autoplay) video.play().catch(() => {});
					});
					hls.on(HlsLib.Events.ERROR, (_e, data) => {
						if (data.fatal) {
							errorMsg = `Stream error: ${data.type}`;
							setStatus('error');
							onerror?.(errorMsg);
						}
					});
				} else {
					throw new Error('Browser tidak mendukung HLS playback');
				}
			}
			video.addEventListener('playing', () => setStatus('online'));
			video.addEventListener('waiting', () => setStatus('connecting'));
		} catch (err) {
			errorMsg = (err as Error).message;
			setStatus('error');
			onerror?.(errorMsg);
		}
	});

	onDestroy(() => {
		hls?.destroy();
		hls = null;
	});
</script>

<div class="relative w-full overflow-hidden rounded-lg bg-black {fill ? 'h-full' : 'aspect-video'}">
	<video
		bind:this={video}
		{poster}
		{autoplay}
		{muted}
		{controls}
		playsinline
		class="h-full w-full object-contain"
	></video>

	{#if state === 'loading'}
		<div class="absolute inset-0 flex items-center justify-center bg-black/40">
			<div class="flex items-center gap-2 text-sm text-white">
				<svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
					<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" opacity="0.25" />
					<path
						d="M22 12a10 10 0 0 1-10 10"
						stroke="currentColor"
						stroke-width="3"
						stroke-linecap="round"
					/>
				</svg>
				Memuat stream…
			</div>
		</div>
	{/if}

	{#if state === 'error'}
		<div
			class="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 p-4 text-center"
		>
			<svg class="h-8 w-8 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 9v2m0 4h.01M5 19h14a2 2 0 0 0 1.84-2.75L13.74 4a2 2 0 0 0-3.48 0L3.16 16.25A2 2 0 0 0 5 19z"
				/>
			</svg>
			<p class="text-sm font-medium text-white">Stream tidak tersedia</p>
			{#if errorMsg}
				<p class="text-xs text-gray-300">{errorMsg}</p>
			{/if}
		</div>
	{/if}
</div>
