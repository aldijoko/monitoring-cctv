<script lang="ts">
	type Status = 'online' | 'offline' | 'degraded' | 'unknown' | 'active' | 'inactive' | 'recording' | 'idle' | 'error';

	type Props = {
		status: Status | string;
		label?: string;
		size?: 'sm' | 'md';
	};

	let { status, label, size = 'md' }: Props = $props();

	const config: Record<string, { bg: string; text: string; dot: string }> = {
		online: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
		active: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
		recording: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
		offline: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' },
		inactive: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' },
		idle: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' },
		degraded: { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' },
		unknown: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
		error: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' }
	};

	const c = $derived(config[status] ?? config.unknown);
	const display = $derived(label ?? status);
</script>

<span
	class={'inline-flex items-center gap-1.5 rounded-full font-medium ' +
		c.bg +
		' ' +
		c.text +
		' ' +
		(size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm')}
>
	<span class={'h-1.5 w-1.5 rounded-full ' + c.dot}></span>
	{display}
</span>
