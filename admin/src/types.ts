export interface User {
  id: number
  username: string
  nickname: string
  phone: string
  email: string
  role: string
  avatar: string
  orgId?: number | null
  hireDate?: string
  workYears?: number
  annualLeave?: number
  compensatoryLeave?: number
  overtime?: number
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

export interface Org {
  id: number
  code: string
  name: string
  parentId?: number | null
  path?: string
  orgLevel?: number
  managerId?: number
  managerName?: string
  remark?: string
  status?: string
  children?: Org[]
}

export interface Supplier {
  id: number
  name: string
  contact?: string
  phone?: string
  category?: string
  address?: string
  creditLevel?: string
  status?: string
  orgId?: number | null
  remark?: string
}

export interface PurchaseOrder {
  id: number
  orderNo: string
  supplierId?: number
  supplierName?: string
  itemName: string
  quantity?: number
  unit?: string
  unitPrice?: number
  totalAmount?: number
  status: string
  applicantId?: number
  applicantName?: string
  orgId?: number | null
  remark?: string
  createdAt?: string
}

export interface SparePart {
  id: number
  partNo: string
  name: string
  category?: string
  spec?: string
  unit?: string
  stockQty?: number
  minStock?: number
  price?: number
  warehouse?: string
  orgId?: number | null
  remark?: string
}

export interface InspectionPlan {
  id: number
  machineryId?: number
  machineryName?: string
  type?: 'inspection' | 'maintenance'
  content?: string
  cycleDays?: number
  lastDoneAt?: string
  nextDueAt?: string
  assigneeId?: number
  assigneeName?: string
  status?: string
  orgId?: number | null
  remark?: string
}

export interface Announcement {
  id: number
  title: string
  content?: string
  type?: string
  publisherName?: string
  orgId?: number | null
  status?: string
  createdAt?: string
}

export interface Contract {
  id: number
  contractNo: string
  customerName: string
  contact?: string
  phone?: string
  type?: string
  amount?: number
  startDate?: string
  endDate?: string
  status?: string
  orgId?: number | null
  remark?: string
}

export interface OptionSet {
  id: number
  code: string
  name: string
  optionsJson?: string
  remark?: string
  status?: string
}

export interface SysMenu {
  id: number
  type: 'parent' | 'item'
  name: string
  path?: string
  icon?: string
  parentId?: number | null
  sort?: number
  enabled?: boolean
  cached?: boolean
}

export interface FormDefinition {
  id: number
  name: string
  bizType: string
  fieldsJson?: string
  remark?: string
  status?: string
}

export interface ProcessDefinition {
  id: number
  name: string
  formId?: number
  nodesJson?: string
  remark?: string
  status?: string
}

export interface ApprovalInstance {
  id: number
  approvalNo: string
  processId?: number
  formId?: number
  bizType?: string
  bizId?: number
  title: string
  status: string
  applicantId?: number
  applicantName?: string
  orgId?: number | null
  currentNodeIndex?: number
  currentNodeName?: string
  resultNote?: string
  createdAt?: string
  finishedAt?: string
}

export interface ApprovalTask {
  id: number
  instanceId: number
  nodeIndex: number
  nodeName: string
  status: string
  candidateIdsJson?: string
  handledById?: number
  handledByName?: string
  comment?: string
  handledAt?: string
}

export interface FinanceData {
  rentalExpected: number
  rentalActual: number
  purchaseTotal: number
  contractTotal: number
  stockValue: number
  pendingApprovals: number
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

export interface ChartsData {
  deviceCategory: Record<string, number>
  deviceBrand: Record<string, number>
  workOrderByStatus: { status: string; count: number }[]
  workOrderByMonth: { month: string; count: number }[]
  projectByStatus: Record<string, number>
  rentalByStatus: Record<string, number>
  purchaseByStatus: Record<string, number>
  purchaseByMonth: { month: string; amount: number }[]
  approvalByStatus: Record<string, number>
  approvalByMonth: { month: string; count: number }[]
  contractByStatus: Record<string, number>
  stockValueByCategory: Record<string, number>
  supplierByCategory: Record<string, number>
  userByRole: Record<string, number>
  orgCount: number
}