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
  brand: string
  recommended: boolean
  specs: { weight: string; power: string; dimensions: string; capacity: string }
  createdAt: string
  updatedAt: string
}

export interface WorkOrder {
  id: number
  workNo: string
  machineryId: number
  machineryName: string
  machineryModel?: string
  title: string
  description?: string
  type: 'repair' | 'maintain'
  priority: string
  status: string
  reportUserName: string
  assigneeUserId?: number
  assigneeName?: string
  handleNote?: string
  cost?: number
  reportedAt?: string
  assignedAt?: string
  completedAt?: string
  createdAt: string
}

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
  status: string
  createdAt: string
}

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
  dailyRate?: number
  startDate: string
  endDate: string
  rentDays?: number
  totalAmount?: number
  status: string
  note?: string
  createdByName?: string
  returnAt?: string
  createdAt: string
}

export interface Pagination<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

export interface StatsData {
  devices: Record<string, number>
  deviceCategories: Record<string, number>
  projects: Record<string, number>
  workOrders: {
    created: number
    assigned: number
    processing: number
    review: number
    done: number
    total: number
    myTodos: number
  }
  dispatch: Record<string, number>
  rentals: Record<string, number>
  maintenanceDevices: Machinery[]
}