import type { WorkOrderPriority, WorkOrderStatus, WorkOrderType } from '../types'

export const statusMeta: Record<WorkOrderStatus, { label: string; color: string; bg: string }> = {
  created: { label: '待派单', color: '#FF6B1A', bg: '#FFF1E8' },
  assigned: { label: '待处理', color: '#F59E0B', bg: '#FEF3E2' },
  processing: { label: '处理中', color: '#3B82F6', bg: '#EAF2FE' },
  review: { label: '待验收', color: '#8B5CF6', bg: '#F1EBFE' },
  done: { label: '已完成', color: '#0E9F6E', bg: '#E7F8F0' },
  cancelled: { label: '已取消', color: '#98A5B3', bg: '#EEF1F4' }
}

export const statusFlow: WorkOrderStatus[] = [
  'created',
  'assigned',
  'processing',
  'review',
  'done'
]

export const typeMeta: Record<WorkOrderType, string> = {
  repair: '维修',
  maintain: '保养'
}

export const priorityMeta: Record<WorkOrderPriority, string> = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '紧急'
}

export function statusLabel(s: string): string {
  return statusMeta[s as WorkOrderStatus]?.label || s
}

export function typeLabel(s: string): string {
  return typeMeta[s as WorkOrderType] || s
}

export function priorityLabel(s: string): string {
  return priorityMeta[s as WorkOrderPriority] || s
}

export function statusColor(s: string): string {
  return statusMeta[s as WorkOrderStatus]?.color || '#98A5B3'
}

export function statusBg(s: string): string {
  return statusMeta[s as WorkOrderStatus]?.bg || '#EEF1F4'
}
