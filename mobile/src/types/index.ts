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
  createdAt: string
  updatedAt: string
}

export interface User {
  id: number
  username: string
  nickname: string
  phone: string
  email: string
  role: 'customer' | 'admin'
  avatar: string
  createdAt: string
}

export interface Order {
  id: number
  orderNo: string
  machineryId: number
  machineryName: string
  userId: number
  type: 'purchase' | 'rental'
  amount: number
  status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled'
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
