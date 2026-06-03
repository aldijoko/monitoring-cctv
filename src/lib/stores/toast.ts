import { writable } from 'svelte/store';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
	id: number;
	type: ToastType;
	message: string;
	timeout?: number;
}

function createToastStore() {
	const { subscribe, update } = writable<Toast[]>([]);
	let nextId = 1;

	function push(type: ToastType, message: string, timeout = 4000) {
		const id = nextId++;
		update((list) => [...list, { id, type, message, timeout }]);
		if (timeout > 0) {
			setTimeout(() => dismiss(id), timeout);
		}
		return id;
	}

	function dismiss(id: number) {
		update((list) => list.filter((t) => t.id !== id));
	}

	return {
		subscribe,
		success: (m: string, t?: number) => push('success', m, t),
		error: (m: string, t?: number) => push('error', m, t),
		warning: (m: string, t?: number) => push('warning', m, t),
		info: (m: string, t?: number) => push('info', m, t),
		dismiss
	};
}

export const toasts = createToastStore();
export const toast = toasts;
export function addToast(type: ToastType, message: string, timeout = 4000) {
	return toasts[type](message, timeout);
}
