export const workOrderStatus: Record<string, { label: string; color: string; bg: string }> = {
  created: { label: '待派单', color: '#FF6B1A', bg: '#FFF1E8' },
  assigned: { label: '待处理', color: '#F59E0B', bg: '#FEF3E2' },
  processing: { label: '处理中', color: '#2563EB', bg: '#EAF2FE' },
  review: { label: '待验收', color: '#8B5CF6', bg: '#F1EBFE' },
  done: { label: '已完成', color: '#0E9F6E', bg: '#E7F8F0' },
  cancelled: { label: '已取消', color: '#98A5B3', bg: '#EEF1F4' }
}

export const projectStatus: Record<string, { label: string; color: string; bg: string }> = {
  created: { label: '待启动', color: '#FF6B1A', bg: '#FFF1E8' },
  active: { label: '进行中', color: '#2563EB', bg: '#EAF2FE' },
  finished: { label: '已完工', color: '#0E9F6E', bg: '#E7F8F0' },
  cancelled: { label: '已取消', color: '#98A5B3', bg: '#EEF1F4' }
}

export const rentalStatus: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: '出租中', color: '#2563EB', bg: '#EAF2FE' },
  returned: { label: '已归还', color: '#0E9F6E', bg: '#E7F8F0' },
  cancelled: { label: '已取消', color: '#98A5B3', bg: '#EEF1F4' }
}

export const machineryStatus: Record<string, { label: string; color: string; bg: string }> = {
  available: { label: '可用', color: '#0E9F6E', bg: '#E7F8F0' },
  rented: { label: '已出租', color: '#2563EB', bg: '#EAF2FE' },
  maintenance: { label: '维修中', color: '#F59E0B', bg: '#FEF3E2' }
}

export const roleLabel: Record<string, string> = {
  admin: '管理员',
  manager: '设备负责人',
  operator: '一线作业人员'
}

export const priorityLabel: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '紧急'
}

export function StatusTag({ status, map }: { status: string; map: Record<string, { label: string; color: string; bg: string }> }) {
  const m = map[status] || { label: status, color: '#98A5B3', bg: '#EEF1F4' }
  return <span className='status-tag' style={{ color: m.color, background: m.bg }}>{m.label}</span>
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