export interface Machinery {
  id: number
  name: string
  model: string
  category: string
  description: string
  price: number
  stock: number
  status: 'available' | 'rented' | 'maintenance'
  image: string
  specs: {
    weight: string
    power: string
    dimensions: string
    capacity: string
  }
  brand: string
  recommended?: boolean
  createdAt: string
  updatedAt: string
}

export interface User {
  id: number
  username: string
  nickname: string
  phone: string
  email: string
  role: string
  avatar: string
  createdAt: string
}

export type WorkOrderStatus =
  | 'created'
  | 'assigned'
  | 'processing'
  | 'review'
  | 'done'
  | 'cancelled'

export type WorkOrderType = 'repair' | 'maintain'

export type WorkOrderPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface WorkOrder {
  id: number
  workNo: string
  machineryId: number
  machineryName: string
  machineryModel?: string
  machineryCategory?: string
  title: string
  description: string
  type: WorkOrderType
  priority: WorkOrderPriority
  status: WorkOrderStatus
  reportUserId: number
  reportUserName: string
  assigneeUserId?: number
  assigneeName?: string
  handleNote?: string
  cost?: number
  reportedAt: string
  assignedAt?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

export interface Order {
  id: number
  orderNo: string
  machineryId: number
  machineryName: string
  userId: number
  type: 'purchase' | 'rental'
  amount: number
  status: string
  createdAt: string
}

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface Pagination<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

export interface WorkOrderStats {
  created: number
  assigned: number
  processing: number
  review: number
  done: number
  total: number
  myTodos: number
}
