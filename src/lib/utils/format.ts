// src/lib/utils/format.ts

export function formatDateTime(input: string | number | Date | null | undefined): string {
	if (!input) return '-';
	const d = new Date(input);
	if (Number.isNaN(d.getTime())) return '-';
	return d.toLocaleString('id-ID', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
}

export function formatDate(input: string | number | Date | null | undefined): string {
	if (!input) return '-';
	const d = new Date(input);
	if (Number.isNaN(d.getTime())) return '-';
	return d.toLocaleDateString('id-ID', {
		day: '2-digit',
		month: 'short',
		year: 'numeric'
	});
}

export function formatBytes(bytes: number | null | undefined): string {
	if (bytes == null || Number.isNaN(bytes)) return '-';
	if (bytes < 1024) return `${bytes} B`;
	const units = ['KB', 'MB', 'GB', 'TB'];
	let i = -1;
	let value = bytes;
	do {
		value /= 1024;
		i++;
	} while (value >= 1024 && i < units.length - 1);
	return `${value.toFixed(value >= 100 ? 0 : value >= 10 ? 1 : 2)} ${units[i]}`;
}

export function formatDuration(seconds: number | null | undefined): string {
	if (seconds == null || Number.isNaN(seconds)) return '-';
	const s = Math.max(0, Math.floor(seconds));
	const h = Math.floor(s / 3600);
	const m = Math.floor((s % 3600) / 60);
	const sec = s % 60;
	if (h > 0) {
		return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
	}
	return `${m}:${String(sec).padStart(2, '0')}`;
}

export function formatPercent(value: number | null | undefined, fractionDigits = 1): string {
	if (value == null || Number.isNaN(value)) return '-';
	return `${value.toFixed(fractionDigits)}%`;
}

export function formatRelativeTime(input: string | number | Date | null | undefined): string {
	if (!input) return '-';
	const d = new Date(input);
	if (Number.isNaN(d.getTime())) return '-';
	const now = Date.now();
	const diffMs = now - d.getTime();
	const future = diffMs < 0;
	const abs = Math.abs(diffMs);
	const sec = Math.floor(abs / 1000);
	const min = Math.floor(sec / 60);
	const hr = Math.floor(min / 60);
	const day = Math.floor(hr / 24);
	let value: string;
	if (sec < 60) value = `${sec} detik`;
	else if (min < 60) value = `${min} menit`;
	else if (hr < 24) value = `${hr} jam`;
	else if (day < 30) value = `${day} hari`;
	else if (day < 365) value = `${Math.floor(day / 30)} bulan`;
	else value = `${Math.floor(day / 365)} tahun`;
	return future ? `dalam ${value}` : `${value} yang lalu`;
}

// Health/status helpers — Tailwind class strings used by dashboard cards,
// edge lists, and recording tiles. Kept in this file so the color encoding
// stays in one place; do not duplicate bg-/text- combinations elsewhere.

export type HealthStatus = 'online' | 'degraded' | 'offline';

export function uptimeColor(status: HealthStatus): string {
	switch (status) {
		case 'online':
			return 'bg-emerald-500';
		case 'degraded':
			return 'bg-amber-500';
		case 'offline':
			return 'bg-red-500';
	}
}

export function statusLabel(status: HealthStatus): string {
	switch (status) {
		case 'online':
			return 'Online';
		case 'degraded':
			return 'Degraded';
		case 'offline':
			return 'Offline';
	}
}

export function statusBadgeClass(status: HealthStatus): string {
	switch (status) {
		case 'online':
			return 'text-emerald-700';
		case 'degraded':
			return 'text-amber-700';
		case 'offline':
			return 'text-red-700';
	}
}

