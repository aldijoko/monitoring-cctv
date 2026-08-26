import { apiGet, apiPost, apiPut, apiDelete } from './client';
import type { Edge, Paginated } from '$lib/types/api';

export interface EdgeFormData {
	code: string;
	name: string;
	hostname?: string;
	ip_address?: string;
}

export interface ListParams {
	search?: string;
	status?: Edge['status'] | 'all';
	limit?: number;
	offset?: number;
	sort?: 'code' | 'name' | 'status' | 'created_at' | 'last_heartbeat';
	order?: 'asc' | 'desc';
}

export const edgesApi = {
	list(params: ListParams = {}): Promise<Paginated<Edge>> {
		return apiGet<Paginated<Edge>>('/edges', {
			search: params.search,
			status: params.status === 'all' ? undefined : params.status,
			limit: params.limit,
			offset: params.offset,
			sort: params.sort,
			order: params.order
		});
	},

	get(id: number): Promise<Edge | null> {
		return apiGet<Edge>(`/edges/${id}`);
	},

	create(data: EdgeFormData): Promise<Edge> {
		return apiPost<Edge, EdgeFormData>('/edges', data);
	},

	update(id: number, data: EdgeFormData): Promise<Edge> {
		return apiPut<Edge, EdgeFormData>(`/edges/${id}`, data);
	},

	remove(id: number): Promise<void> {
		return apiDelete(`/edges/${id}`);
	}
};

export const listEdges = edgesApi.list;
export const getEdge = edgesApi.get;
export const createEdge = edgesApi.create;
export const updateEdge = edgesApi.update;
export const deleteEdge = edgesApi.remove;
