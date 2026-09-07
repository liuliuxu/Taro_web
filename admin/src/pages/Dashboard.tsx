import { useState, useEffect } from 'react'
import { get, qs } from '../api'
import type { Machinery, StatsData } from '../types'
import { StatusTag, machineryStatus, fmtMoney } from '../meta'

const BAR_COLORS: Record<string, string> = {
  created: 'linear-gradient(135deg,#FF8A3D,#F2540E)',
  assigned: 'linear-gradient(135deg,#FBBF24,#D97706)',
  processing: 'linear-gradient(135deg,#60A5FA,#2563EB)',
  review: 'linear-gradient(135deg,#A78BFA,#7C3AED)',
  done: 'linear-gradient(135deg,#34D399,#0E9F6E)'
}

function MiniBar({ name, value, color }: { name: string; value: number; color: string }) {
  const max = 1
  const widthPct = value > 0 ? Math.max(8, Math.min(100, (value / max) * 100)) : 0
  return (
    <div className='bar-row'>
      <div className='bar-label'>{name}</div>
      <div className='bar-track'>
        <div className='bar-fill' style={{ width: `${value ? Math.max(18, value * 28) : 0}%`, background: color }}>{value > 0 ? value : ''}</div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      const data = await get<StatsData>('/admin/stats/dashboard')
      setStats(data)
    } catch (e: any) {
      setErr(e?.message || '加载失败')
    }
  }

  if (err) {
    return (
      <div className='page-card'>
        <div className='warn-banner'>仪表盘加载失败：{err}</div>
        <button className='toolbar-btn secondary' onClick={load}>重新加载</button>
      </div>
    )
  }
  if (!stats) return <div className='empty'>加载中...</div>

  const d = stats.devices || {}
  const p = stats.projects || {}
  const w = stats.workOrders || {}
  const dp = stats.dispatch || {}
  const r = stats.rentals || {}
  const cats = stats.deviceCategories || {}
  const catEntries = Object.entries(cats).sort((a, b) => b[1] - a[1])
  const maxCat = catEntries[0]?.[1] || 1

  return (
    <div>
      <div className='stat-grid'>
        <div className='stat-box'>
          <div className='label'>设备总数</div>
          <div className='num num-gray'>{d.total ?? 0}</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>可用 {(d.available ?? 0)} · 已出租 {(d.rented ?? 0)} · 维修中 {(d.maintenance ?? 0)}</div>
        </div>
        <div className='stat-box'>
          <div className='label'>进行中工程</div>
          <div className='num num-blue'>{p.active ?? 0}</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>待启动 {(p.created ?? 0)} · 已完工 {(p.finished ?? 0)}</div>
        </div>
        <div className='stat-box'>
          <div className='label'>工单总数</div>
          <div className='num num-orange'>{w.total ?? 0}</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>进行中 {((w.assigned ?? 0) + (w.processing ?? 0))} · 待验收 {(w.review ?? 0)}</div>
        </div>
        <div className='stat-box'>
          <div className='label'>出租中合同</div>
          <div className='num num-green'>{r.active ?? 0}</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>已归还 {(r.returned ?? 0)} · 调度执行中 {(dp.ongoing ?? 0)}</div>
        </div>
      </div>

      <div className='sec-grid'>
        <div className='page-card'>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>工单状态分布</div>
          {['created', 'assigned', 'processing', 'review', 'done', 'cancelled'].map((k) => (
            <MiniBar key={k} name={{ created: '待派单', assigned: '待处理', processing: '处理中', review: '待验收', done: '已完成', cancelled: '已取消' }[k]} value={w[k] ?? 0} color={BAR_COLORS[k] || '#CBD5E1'} />
          ))}
        </div>
        <div className='page-card'>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>设备分类分布</div>
          {catEntries.length === 0 ? (
            <div className='empty'>暂无数据</div>
          ) : (
            catEntries.map(([k, v]) => (
              <div className='bar-row' key={k}>
                <div className='bar-label'>{k}</div>
                <div className='bar-track'>
                  <div className='bar-fill' style={{ width: `${(v / maxCat) * 100}%`, background: 'linear-gradient(135deg,#60A5FA,#1D4ED8)' }}>{v}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className='page-card'>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>维修中设备预警</div>
        {(!stats.maintenanceDevices || stats.maintenanceDevices.length === 0) ? (
          <div className='empty'>当前无维修中设备</div>
        ) : (
          <table className='table'>
            <thead>
              <tr>
                <th>设备名称</th>
                <th>型号</th>
                <th>分类</th>
                <th>状态</th>
                <th>日租金（元）</th>
              </tr>
            </thead>
            <tbody>
              {stats.maintenanceDevices.map((m: Machinery) => (
                <tr key={m.id}>
                  <td>{m.name}</td>
                  <td>{m.model}</td>
                  <td>{m.category}</td>
                  <td><StatusTag status={m.status} map={machineryStatus} /></td>
                  <td>{fmtMoney(m.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}