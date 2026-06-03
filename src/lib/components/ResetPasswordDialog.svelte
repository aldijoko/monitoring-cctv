<script lang="ts">
	import { Copy, Check, X } from 'lucide-svelte';
	import Button from '$lib/components/Button.svelte';
	import { toast } from '$lib/stores/toast';

	interface Props {
		open: boolean;
		username: string;
		temporaryPassword: string | null;
		onclose: () => void;
		onreset: () => Promise<void>;
	}

	let { open, username, temporaryPassword, onclose, onreset }: Props = $props();

	let loading = $state(false);
	let copied = $state(false);

	async function copy() {
		if (!temporaryPassword) return;
		try {
			await navigator.clipboard.writeText(temporaryPassword);
			copied = true;
			toast.success('Password disalin');
			setTimeout(() => (copied = false), 1500);
		} catch {
			toast.error('Gagal menyalin');
		}
	}

	async function submit() {
		loading = true;
		try {
			await onreset();
		} catch (err) {
			toast.error((err as Error).message);
		} finally {
			loading = false;
		}
	}
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
		<div class="w-full max-w-md rounded-lg bg-white shadow-xl">
			<div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
				<h2 class="text-lg font-semibold text-gray-900">Reset Password</h2>
				<button
					type="button"
					class="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
					onclick={onclose}
					aria-label="Tutup"
				>
					<X class="h-5 w-5" />
				</button>
			</div>

			<div class="space-y-4 p-6">
				<p class="text-sm text-gray-600">
					Reset password untuk user <span class="font-semibold text-gray-900">{username}</span>.
				</p>

				{#if !temporaryPassword}
					<p class="text-sm text-gray-600">
						Sistem akan membuat password sementara baru. User harus mengganti password setelah
						login pertama.
					</p>
				{:else}
					<div>
						<label class="mb-1 block text-sm font-medium text-gray-700"
							>Password sementara</label
						>
						<div class="flex gap-2">
							<input
								type="text"
								readonly
								value={temporaryPassword}
								class="flex-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 font-mono text-sm"
							/>
							<Button variant="secondary" type="button" onclick={copy} aria-label="Salin">
								{#if copied}
									<Check class="h-4 w-4" />
								{:else}
									<Copy class="h-4 w-4" />
								{/if}
							</Button>
						</div>
						<p class="mt-1 text-xs text-gray-500">
							Salin dan berikan ke user secara aman. Password hanya ditampilkan sekali.
						</p>
					</div>
				{/if}

				<div class="flex justify-end gap-2 border-t border-gray-200 pt-4">
					<Button variant="secondary" onclick={onclose}>
						{temporaryPassword ? 'Tutup' : 'Batal'}
					</Button>
					{#if !temporaryPassword}
						<Button onclick={submit} loading={loading}>Reset Password</Button>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}
