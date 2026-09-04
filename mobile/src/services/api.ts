import { api } from './request'
import type { Machinery, Pagination, User, Order } from '../types'

export const machineryApi = {
  getList(params?: {
    page?: number
    pageSize?: number
    category?: string
    keyword?: string
    status?: string
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

export const orderApi = {
  create(data: { machineryId: number; type: 'purchase' | 'rental'; duration?: number }) {
    return api.post<Order>('/orders', data, true)
  },
  getMyOrders() {
    return api.get<Order[]>('/orders/my')
  },
  getDetail(id: number) {
    return api.get<Order>(`/orders/${id}`)
  }
}
