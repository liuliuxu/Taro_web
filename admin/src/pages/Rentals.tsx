import { useState, useEffect } from 'react'
import { get, post, qs } from '../api'
import type { Machinery, Pagination, RentalContract } from '../types'
import { StatusTag, rentalStatus, fmtDate, fmtMoney } from '../meta'

interface FormState {
  machineryId: string
  clientCompany: string
  clientContact: string
  clientPhone: string
  deposit: string
  dailyRate: string
  startDate: string
  endDate: string
  note: string
}

const EMPTY: FormState = { machineryId: '', clientCompany: '', clientContact: '', clientPhone: '', deposit: '', dailyRate: '', startDate: '', endDate: '', note: '' }

export default function Rentals() {
  const [list, setList] = useState<RentalContract[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [status, setStatus] = useState('')
  const [keyword, setKeyword] = useState('')
  const [machines, setMachines] = useState<Machinery[]>([])
  const [form, setForm] = useState<FormState>(EMPTY)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => { load(1) }, [status])

  async function load(p: number) {
    setPage(p)
    try {
      const res = await get<Pagination<RentalContract>>('/admin/rentals/list' + qs({ page: p, pageSize, status, keyword }))
      setList(res.list)
      setTotal(res.total)
    } catch (e: any) {
      alert(e?.message || '加载失败')
    }
  }

  async function openCreate() {
    setForm(EMPTY)
    setErr('')
    setShowModal(true)
    try {
      const res = await get<Pagination<Machinery>>('/admin/machinery/list' + qs({ page: 1, pageSize: 50, status: 'available' }))
      setMachines(res.list)
    } catch {
      setMachines([])
    }
  }

  async function save() {
    if (!form.machineryId) { setErr('请选择租赁设备'); return }
    if (!form.clientCompany.trim()) { setErr('请填写承租单位'); return }
    if (!form.dailyRate || Number(form.dailyRate) <= 0) { setErr('请填写日租金'); return }
    setSaving(true)
    try {
      await post('/admin/rentals', {
        machineryId: Number(form.machineryId),
        clientCompany: form.clientCompany.trim(),
        clientContact: form.clientContact || undefined,
        clientPhone: form.clientPhone || undefined,
        deposit: form.deposit ? Number(form.deposit) : undefined,
        dailyRate: Number(form.dailyRate),
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        note: form.note || undefined
      })
      setShowModal(false)
      load(page)
    } catch (e: any) {
      setErr(e?.message || '创建失败')
    } finally {
      setSaving(false)
    }
  }

  async function handle(r: RentalContract, next: string, label: string) {
    let ok = true
    if (next === 'returned') ok = window.confirm(`确认登记「${r.machineryName}」归还并结算？系统将按实际天数重新计算费用。`)
    if (!ok) return
    try {
      await post(`/admin/rentals/${r.id}/handle`, { status: next })
      load(page)
    } catch (e: any) {
      alert(e?.message || '操作失败')
    }
  }

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  return (
    <div>
      <div className='page-card'>
        <div className='toolbar'>
          <input className='search-input' placeholder='搜索合同号/设备/承租单位' value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') load(1) }} />
          <select className='filter-select' value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value=''>全部状态</option>
            <option value='active'>出租中</option>
            <option value='returned'>已归还</option>
            <option value='cancelled'>已取消</option>
          </select>
          <button className='toolbar-btn secondary' onClick={() => load(1)}>查询</button>
          <div className='spacer' />
          <span style={{ color: 'var(--text-3)' }}>共 {total} 份合同</span>
          <button className='toolbar-btn' onClick={openCreate}>+ 新建租赁</button>
        </div>
      </div>

      <div className='page-card'>
        <table className='table'>
          <thead>
            <tr>
              <th>合同号</th>
              <th>设备</th>
              <th>承租单位</th>
              <th>联系人</th>
              <th>租期</th>
              <th>日租金（元）</th>
              <th>合计（元）</th>
              <th>状态</th>
              <th style={{ width: 120 }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.id}>
                <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{r.contractNo}</td>
                <td style={{ fontWeight: 600 }}>{r.machineryName}{r.machineryModel ? `（${r.machineryModel}）` : ''}</td>
                <td>{r.clientCompany}</td>
                <td>{r.clientContact || '—'}<br /><span style={{ color: 'var(--text-3)', fontSize: 12 }}>{r.clientPhone || ''}</span></td>
                <td style={{ fontSize: 12 }}>{fmtDate(r.startDate)} ~ {fmtDate(r.endDate)}</td>
                <td>{fmtMoney(r.dailyRate)}</td>
                <td style={{ fontWeight: 600 }}>{fmtMoney(r.totalAmount)}</td>
                <td><StatusTag status={r.status} map={rentalStatus} /></td>
                <td>
                  {r.status === 'active' && (
                    <>
                      <button className='link-btn success' onClick={() => handle(r, 'returned', '归还')}>归还</button>
                      <button className='link-btn danger' onClick={() => handle(r, 'cancelled', '取消')}>取消</button>
                    </>
                  )}
                  {r.status !== 'active' && <span style={{ color: 'var(--text-3)' }}>—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <div className='empty'>暂无租赁合同</div>}
        <div className='pager'>
          <span>第 {page} / {Math.max(1, Math.ceil(total / pageSize))} 页</span>
          <button disabled={page <= 1} onClick={() => load(page - 1)}>上一页</button>
          <button disabled={page >= Math.ceil(total / pageSize)} onClick={() => load(page + 1)}>下一页</button>
        </div>
      </div>

      {showModal && (
        <div className='modal-mask' onClick={() => setShowModal(false)}>
          <div className='modal' onClick={(e) => e.stopPropagation()}>
            <div className='modal-title'>新建租赁合同</div>
            {err && <div className='warn-banner'>{err}</div>}
            <div className='form-grid'>
              <div className='form-field col-2'>
                <label>租赁设备 <span className='req'>*</span></label>
                <select value={form.machineryId} onChange={(e) => set('machineryId', e.target.value)}>
                  <option value=''>请选择可用设备</option>
                  {machines.map((m) => <option key={m.id} value={m.id}>{m.name}（{m.model || m.category}）· {fmtMoney(m.price)} 元/天</option>)}
                </select>
              </div>
              <div className='form-field col-2'>
                <label>承租单位 <span className='req'>*</span></label>
                <input value={form.clientCompany} onChange={(e) => set('clientCompany', e.target.value)} />
              </div>
              <div className='form-field'>
                <label>联系人</label>
                <input value={form.clientContact} onChange={(e) => set('clientContact', e.target.value)} />
              </div>
              <div className='form-field'>
                <label>联系电话</label>
                <input value={form.clientPhone} onChange={(e) => set('clientPhone', e.target.value)} />
              </div>
              <div className='form-field'>
                <label>日租金（元）<span className='req'>*</span></label>
                <input type='number' value={form.dailyRate} onChange={(e) => set('dailyRate', e.target.value)} />
              </div>
              <div className='form-field'>
                <label>押金（元）</label>
                <input type='number' value={form.deposit} onChange={(e) => set('deposit', e.target.value)} />
              </div>
              <div className='form-field'>
                <label>起租日期</label>
                <input type='date' value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
              </div>
              <div className='form-field'>
                <label>预计归还日期</label>
                <input type='date' value={form.endDate} onChange={(e) => set('endDate', e.target.value)} />
              </div>
              <div className='form-field col-2'>
                <label>备注</label>
                <textarea value={form.note} onChange={(e) => set('note', e.target.value)} />
              </div>
            </div>
            <div className='modal-actions'>
              <button className='btn btn-cancel' onClick={() => setShowModal(false)}>取消</button>
              <button className='btn btn-ok' disabled={saving} onClick={save}>{saving ? '创建中...' : '创建合同'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}