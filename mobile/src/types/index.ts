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

export interface FormField {
  key: string
  label: string
  type: 'input' | 'textarea' | 'number' | 'date' | 'select' | 'multiple' | 'upload' | 'tree'
  required?: boolean
  placeholder?: string
  options?: { label: string; value: string }[]
  optionSetCode?: string
  treeData?: { title: string; value: string; children?: { title: string; value: string }[] }[]
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

export interface OptionSet {
  id: number
  code: string
  name: string
  optionsJson?: string
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
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn'
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

export interface ApprovalDetail {
  instance: ApprovalInstance
  form?: FormDefinition
  tasks?: ApprovalTask[]
  formData?: Record<string, any>
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
  status?: string
  applicantName?: string
  remark?: string
  createdAt?: string
}
