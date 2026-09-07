import { api } from './request'
import type {
  ApprovalDetail,
  ApprovalInstance,
  ApprovalTask,
  Announcement,
  DispatchTask,
  FormDefinition,
  InspectionPlan,
  Machinery,
  OptionSet,
  Pagination,
  ProcessDefinition,
  Project,
  PurchaseOrder,
  RentalContract,
  SparePart,
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

export const projectApi = {
  getList(params?: { page?: number; pageSize?: number; status?: string; keyword?: string }) {
    return api.get<Pagination<Project>>('/projects/list', params, true)
  },
  getDetail(id: number) {
    return api.get<Project>(`/projects/${id}`, undefined, true)
  },
  create(data: Record<string, unknown>) {
    return api.post<Project>('/projects', data, true)
  },
  changeStatus(id: number, status: string) {
    return api.post<Project>(`/projects/${id}/status`, { status }, true)
  }
}

export const dispatchApi = {
  getMyTasks() {
    return api.get<DispatchTask[]>('/dispatch/my-tasks', undefined, true)
  },
  getList() {
    return api.get<DispatchTask[]>('/dispatch/list', undefined, true)
  },
  getProjectTasks(projectId: number) {
    return api.get<DispatchTask[]>('/dispatch/project', { projectId }, true)
  },
  getDetail(id: number) {
    return api.get<DispatchTask>(`/dispatch/${id}`, undefined, true)
  },
  create(data: Record<string, unknown>) {
    return api.post<DispatchTask>('/dispatch', data, true)
  },
  assign(id: number, assigneeUserId: number) {
    return api.post<DispatchTask>(`/dispatch/${id}/assign`, { assigneeUserId }, true)
  },
  handle(id: number, data: { status: string; progress?: number; handleNote?: string }) {
    return api.post<DispatchTask>(`/dispatch/${id}/handle`, data, true)
  }
}

export const rentalApi = {
  getList(params?: { status?: string }) {
    return api.get<RentalContract[]>('/rentals/list', params, true)
  },
  getActive() {
    return api.get<RentalContract[]>('/rentals/active', undefined, true)
  },
  getDetail(id: number) {
    return api.get<RentalContract>(`/rentals/${id}`, undefined, true)
  },
  create(data: Record<string, unknown>) {
    return api.post<RentalContract>('/rentals', data, true)
  },
  handle(id: number, data: { status: string; note?: string }) {
    return api.post<RentalContract>(`/rentals/${id}/handle`, data, true)
  }
}

export const approvalApi = {
  startable() {
    return api.get<ProcessDefinition[]>('/approval/startable', undefined, true)
  },
  form(id: number) {
    return api.get<FormDefinition>('/approval/form', { id })
  },
  optionSets() {
    return api.get<OptionSet[]>('/approval/option-sets')
  },
  submit(data: { processId: number; title?: string; bizType?: string; bizId?: number; formData: Record<string, any> }) {
    return api.post<ApprovalInstance>('/approval/submit', data, true)
  },
  myApps() {
    return api.get<ApprovalInstance[]>('/approval/my-apps', undefined, true)
  },
  todo() {
    return api.get<ApprovalInstance[]>('/approval/todo', undefined, true)
  },
  detail(id: number) {
    return api.get<ApprovalDetail>('/approval/detail', { id }, true)
  },
  approve(id: number, comment?: string) {
    return api.post<ApprovalInstance>(`/approval/approve?id=${id}${comment ? `&comment=${encodeURIComponent(comment)}` : ''}`)
  },
  reject(id: number, comment?: string) {
    return api.post<ApprovalInstance>(`/approval/reject?id=${id}${comment ? `&comment=${encodeURIComponent(comment)}` : ''}`)
  },
  withdraw(id: number) {
    return api.post<ApprovalInstance>(`/approval/withdraw?id=${id}`)
  }
}

export const announceApi = {
  list() {
    return api.get<Announcement[]>('/announcements', undefined, true)
  }
}

export const sparePartApi = {
  list(params?: { keyword?: string; category?: string }) {
    return api.get<SparePart[]>('/spare-parts', params, true)
  }
}

export const purchaseApi = {
  list() {
    return api.get<PurchaseOrder[]>('/purchases/my', undefined, true)
  },
  apply(data: { itemName: string; quantity?: number; unit?: string; supplierName?: string; unitPrice?: number; remark?: string }) {
    return api.post<PurchaseOrder>('/purchases/apply', data, true)
  }
}

export const inspectApi = {
  todo() {
    return api.get<InspectionPlan[]>('/inspection-plans/todo', undefined, true)
  },
  complete(id: number, memo?: string) {
    return api.post<InspectionPlan>(`/inspection-plans/${id}/complete`, { memo }, true)
  }
}
