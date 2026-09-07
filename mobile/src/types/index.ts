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

export type ProjectStatus = 'created' | 'active' | 'finished' | 'cancelled'

export interface Project {
  id: number
  projectNo: string
  name: string
  customerName: string
  customerPhone: string
  address: string
  plannedStart?: string
  plannedEnd?: string
  budget?: number
  managerName?: string
  description?: string
  status: ProjectStatus
  createdAt: string
  tasks?: DispatchTask[]
  taskCount?: number
}

export type DispatchStatus =
  | 'created'
  | 'assigned'
  | 'ongoing'
  | 'done'
  | 'cancelled'

export interface DispatchTask {
  id: number
  dispatchNo: string
  projectId: number
  projectName: string
  machineryId: number
  machineryName: string
  machineryModel?: string
  title: string
  description?: string
  assigneeUserId?: number
  assigneeName?: string
  progress?: number
  handleNote?: string
  startAt?: string
  endAt?: string
  status: DispatchStatus
  createdAt: string
  updatedAt: string
}

export type RentalStatus = 'active' | 'returned' | 'cancelled'

export interface RentalContract {
  id: number
  contractNo: string
  machineryId: number
  machineryName: string
  machineryModel?: string
  clientCompany: string
  clientContact: string
  clientPhone: string
  deposit?: number
  dailyRate: number
  startDate: string
  endDate: string
  rentDays?: number
  totalAmount?: number
  status: RentalStatus
  note?: string
  createdByName?: string
  returnAt?: string
  createdAt: string
}
