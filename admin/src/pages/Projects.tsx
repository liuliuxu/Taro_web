import { useState, useEffect } from 'react'
import { get, post, put, qs } from '../api'
import type { Pagination, Project } from '../types'
import { StatusTag, projectStatus, fmtDate, fmtMoney } from '../meta'

interface FormState {
  name: string
  customerName: string
  customerPhone: string
  address: string
  plannedStart: string
  plannedEnd: string
  budget: string
  description: string
}

const EMPTY: FormState = { name: '', customerName: '', customerPhone: '', address: '', plannedStart: '', plannedEnd: '', budget: '', description: '' }

export default function Projects() {
  const [list, setList] = useState<Project[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [status, setStatus] = useState('')
  const [keyword, setKeyword] = useState('')
  const [form, setForm] = useState<FormState>(EMPTY)
  const [editing, setEditing] = useState<Project | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => { load(1) }, [status])

  async function load(p: number) {
    setPage(p)
    try {
      const res = await get<Pagination<Project>>('/admin/projects/list' + qs({ page: p, pageSize, status, keyword }))
      setList(res.list)
      setTotal(res.total)
    } catch (e: any) {
      alert(e?.message || '加载失败')
    }
  }

  function openCreate() {
    setEditing(null)
    setForm(EMPTY)
    setErr('')
    setShowModal(true)
  }

  function openEdit(p: Project) {
    setEditing(p)
    setForm({
      name: p.name, customerName: p.customerName || '', customerPhone: p.customerPhone || '',
      address: p.address || '', plannedStart: p.plannedStart || '', plannedEnd: p.plannedEnd || '',
      budget: p.budget ? String(p.budget) : '', description: p.description || ''
    })
    setErr('')
    setShowModal(true)
  }

  async function save() {
    if (!form.name.trim()) { setErr('请填写项目名称'); return }
    setSaving(true)
    try {
      const body = {
        name: form.name.trim(),
        customerName: form.customerName || undefined,
        customerPhone: form.customerPhone || undefined,
        address: form.address || undefined,
        plannedStart: form.plannedStart || undefined,
        plannedEnd: form.plannedEnd || undefined,
        budget: form.budget ? Number(form.budget) : undefined,
        description: form.description || undefined
      }
      if (editing) {
        await put(`/admin/projects/${editing.id}`, body)
      } else {
        await post('/admin/projects', body)
      }
      setShowModal(false)
      load(page)
    } catch (e: any) {
      setErr(e?.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  async function changeStatus(p: Project, next: string, label: string) {
    let ok = true
    if (next === 'cancelled') ok = window.confirm(`确认取消项目「${p.name}」？`)
    if (!ok) return
    try {
      await post(`/admin/projects/${p.id}/status`, { status: next })
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
          <input className='search-input' placeholder='搜索项目名称/客户' value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') load(1) }} />
          <select className='filter-select' value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value=''>全部状态</option>
            <option value='created'>待启动</option>
            <option value='active'>进行中</option>
            <option value='finished'>已完工</option>
            <option value='cancelled'>已取消</option>
          </select>
          <button className='toolbar-btn secondary' onClick={() => load(1)}>查询</button>
          <div className='spacer' />
          <span style={{ color: 'var(--text-3)' }}>共 {total} 个项目</span>
          <button className='toolbar-btn' onClick={openCreate}>+ 新增项目</button>
        </div>
      </div>

      <div className='page-card'>
        <table className='table'>
          <thead>
            <tr>
              <th>项目编号</th>
              <th>项目名称</th>
              <th>客户单位</th>
              <th>负责人</th>
              <th>工期</th>
              <th>预算（元）</th>
              <th>状态</th>
              <th style={{ width: 200 }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id}>
                <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{p.projectNo}</td>
                <td style={{ fontWeight: 600 }}>{p.name}</td>
                <td>{p.customerName || '—'}</td>
                <td>{p.managerName || '—'}</td>
                <td style={{ fontSize: 12 }}>{fmtDate(p.plannedStart)} ~ {fmtDate(p.plannedEnd)}</td>
                <td>{fmtMoney(p.budget)}</td>
                <td><StatusTag status={p.status} map={projectStatus} /></td>
                <td>
                  <button className='link-btn' onClick={() => openEdit(p)}>编辑</button>
                  {p.status === 'created' && <button className='link-btn success' onClick={() => changeStatus(p, 'active', '启动')}>启动</button>}
                  {p.status === 'active' && <button className='link-btn success' onClick={() => changeStatus(p, 'finished', '完工')}>完工</button>}
                  {(p.status === 'created' || p.status === 'active') && <button className='link-btn danger' onClick={() => changeStatus(p, 'cancelled', '取消')}>取消</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <div className='empty'>暂无项目</div>}
        <div className='pager'>
          <span>第 {page} / {Math.max(1, Math.ceil(total / pageSize))} 页</span>
          <button disabled={page <= 1} onClick={() => load(page - 1)}>上一页</button>
          <button disabled={page >= Math.ceil(total / pageSize)} onClick={() => load(page + 1)}>下一页</button>
        </div>
      </div>

      {showModal && (
        <div className='modal-mask' onClick={() => setShowModal(false)}>
          <div className='modal' onClick={(e) => e.stopPropagation()}>
            <div className='modal-title'>{editing ? '编辑项目' : '新增项目'}</div>
            {err && <div className='warn-banner'>{err}</div>}
            <div className='form-grid'>
              <div className='form-field col-2'>
                <label>项目名称 <span className='req'>*</span></label>
                <input value={form.name} onChange={(e) => set('name', e.target.value)} />
              </div>
              <div className='form-field'>
                <label>客户单位</label>
                <input value={form.customerName} onChange={(e) => set('customerName', e.target.value)} />
              </div>
              <div className='form-field'>
                <label>联系电话</label>
                <input value={form.customerPhone} onChange={(e) => set('customerPhone', e.target.value)} />
              </div>
              <div className='form-field col-2'>
                <label>施工地点</label>
                <input value={form.address} onChange={(e) => set('address', e.target.value)} />
              </div>
              <div className='form-field'>
                <label>计划开工</label>
                <input type='date' value={form.plannedStart} onChange={(e) => set('plannedStart', e.target.value)} />
              </div>
              <div className='form-field'>
                <label>计划完工</label>
                <input type='date' value={form.plannedEnd} onChange={(e) => set('plannedEnd', e.target.value)} />
              </div>
              <div className='form-field col-2'>
                <label>预算（元）</label>
                <input type='number' value={form.budget} onChange={(e) => set('budget', e.target.value)} />
              </div>
              <div className='form-field col-2'>
                <label>项目描述</label>
                <textarea value={form.description} onChange={(e) => set('description', e.target.value)} />
              </div>
            </div>
            <div className='modal-actions'>
              <button className='btn btn-cancel' onClick={() => setShowModal(false)}>取消</button>
              <button className='btn btn-ok' disabled={saving} onClick={save}>{saving ? '保存中...' : '保存'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}