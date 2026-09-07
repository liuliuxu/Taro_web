import type { DispatchStatus, ProjectStatus, RentalStatus } from '../types'

export const projectStatusMeta: Record<ProjectStatus, { label: string; color: string; bg: string }> = {
  created: { label: '待启动', color: '#FF6B1A', bg: '#FFF1E8' },
  active: { label: '进行中', color: '#3B82F6', bg: '#EAF2FE' },
  finished: { label: '已完工', color: '#0E9F6E', bg: '#E7F8F0' },
  cancelled: { label: '已取消', color: '#98A5B3', bg: '#EEF1F4' }
}

export const dispatchStatusMeta: Record<DispatchStatus, { label: string; color: string; bg: string }> = {
  created: { label: '待派发', color: '#FF6B1A', bg: '#FFF1E8' },
  assigned: { label: '已派发', color: '#F59E0B', bg: '#FEF3E2' },
  ongoing: { label: '执行中', color: '#3B82F6', bg: '#EAF2FE' },
  done: { label: '已完成', color: '#0E9F6E', bg: '#E7F8F0' },
  cancelled: { label: '已取消', color: '#98A5B3', bg: '#EEF1F4' }
}

export const rentalStatusMeta: Record<RentalStatus, { label: string; color: string; bg: string }> = {
  active: { label: '出租中', color: '#3B82F6', bg: '#EAF2FE' },
  returned: { label: '已归还', color: '#0E9F6E', bg: '#E7F8F0' },
  cancelled: { label: '已取消', color: '#98A5B3', bg: '#EEF1F4' }
}

export function projectStatusLabel(s: string): string {
  return projectStatusMeta[s as ProjectStatus]?.label || s
}

export function dispatchStatusLabel(s: string): string {
  return dispatchStatusMeta[s as DispatchStatus]?.label || s
}

export function rentalStatusLabel(s: string): string {
  return rentalStatusMeta[s as RentalStatus]?.label || s
}

export function projectStatusColor(s: string): string {
  return projectStatusMeta[s as ProjectStatus]?.color || '#98A5B3'
}

export function dispatchStatusColor(s: string): string {
  return dispatchStatusMeta[s as DispatchStatus]?.color || '#98A5B3'
}

export function rentalStatusColor(s: string): string {
  return rentalStatusMeta[s as RentalStatus]?.color || '#98A5B3'
}

export function projectStatusBg(s: string): string {
  return projectStatusMeta[s as ProjectStatus]?.bg || '#EEF1F4'
}

export function dispatchStatusBg(s: string): string {
  return dispatchStatusMeta[s as DispatchStatus]?.bg || '#EEF1F4'
}

export function rentalStatusBg(s: string): string {
  return rentalStatusMeta[s as RentalStatus]?.bg || '#EEF1F4'
}

export function fmtDate(d?: string): string {
  if (!d) return '—'
  return d.slice(0, 10)
}

export function fmtMoney(v?: number): string {
  if (v === undefined || v === null) return '—'
  if (v >= 10000) return `${(v / 10000).toFixed(v % 10000 === 0 ? 0 : 1)}万`
  return String(v)
}