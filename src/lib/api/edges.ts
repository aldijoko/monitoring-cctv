import type { Edge, Paginated } from '$lib/types/api';
import { edgesMock, type ListParams } from '$lib/mocks/edges';

/**
 * Edges API client.
 *
 * Saat ini masih menggunakan mock data di-memory + localStorage.
 * Untuk produksi, ganti body fungsi di bawah dengan `request<...>('/admin/edges', ...)`.
 * Signature & return type dijaga identik agar swap hanya di satu tempat.
 */

export interface EdgeFormData {
	name: string;
	hostname?: string;
	ip_address?: string;
}

export const edgesApi = {
	list(params: ListParams = {}): Promise<Paginated<Edge>> {
		return edgesMock.list(params);
	},

	get(id: number): Promise<Edge | null> {
		return edgesMock.get(id);
	},

	create(data: EdgeFormData): Promise<Edge> {
		return edgesMock.create(data);
	},

	update(id: number, data: EdgeFormData): Promise<Edge> {
		return edgesMock.update(id, data);
	},

	remove(id: number): Promise<void> {
		return edgesMock.remove(id);
	},

	reset(): Promise<void> {
		return edgesMock.reset();
	}
};

export const listEdges = edgesApi.list;
export const getEdge = edgesApi.get;
export const createEdge = edgesApi.create;
export const updateEdge = edgesApi.update;
export const deleteEdge = edgesApi.remove;
