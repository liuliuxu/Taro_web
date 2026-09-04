import { api } from './request'
import type {
  Machinery,
  Pagination,
  User,
  WorkOrder,
  WorkOrderStats
} from '../types'

export const machineryApi = {
  getList(params?: {
    page?: number
    pageSize?: number
    category?: string
    keyword?: string
    status?: string
    sort?: string
  }) {
    return api.get<Pagination<Machinery>>('/machinery/list', params, true)
  },
  getDetail(id: number) {
    return api.get<Machinery>(`/machinery/${id}`, undefined, true)
  },
  getCategories() {
    return api.get<string[]>('/machinery/categories')
  },
  getRecommendations() {
    return api.get<Machinery[]>('/machinery/recommendations')
  }
}

export const authApi = {
  login(data: { username: string; password: string }) {
    return api.post<{ token: string; user: User }>('/auth/login', data, true)
  },
  register(data: { username: string; password: string; phone: string }) {
    return api.post<User>('/auth/register', data, true)
  },
  getProfile() {
    return api.get<User>('/auth/profile')
  }
}

export const userApi = {
  list() {
    return api.get<User[]>('/users')
  }
}

export const workOrderApi = {
  create(data: {
    machineryId: number
    title: string
    description?: string
    type: 'repair' | 'maintain'
    priority?: string
  }) {
    return api.post<WorkOrder>('/workorders', data, true)
  },
  getList(params?: {
    page?: number
    pageSize?: number
    status?: string
    keyword?: string
  }) {
    return api.get<Pagination<WorkOrder>>('/workorders/list', params, true)
  },
  getDetail(id: number) {
    return api.get<WorkOrder>(`/workorders/${id}`)
  },
  getMyReported() {
    return api.get<WorkOrder[]>('/workorders/my-reported')
  },
  getMyAssigned() {
    return api.get<WorkOrder[]>('/workorders/my-assigned')
  },
  getMyTodos() {
    return api.get<WorkOrder[]>('/workorders/my-todos')
  },
  assign(id: number, data: { assigneeUserId: number; handleNote?: string }) {
    return api.post<WorkOrder>(`/workorders/${id}/assign`, data, true)
  },
  handle(id: number, data: { status: string; handleNote?: string; cost?: number }) {
    return api.post<WorkOrder>(`/workorders/${id}/handle`, data, true)
  },
  getStats() {
    return api.get<WorkOrderStats>('/workorders/stats')
  }
}
