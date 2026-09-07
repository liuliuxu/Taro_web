import { useState, useEffect } from 'react'
import { get, post, put, del, qs } from '../api'
import type { Machinery, Pagination } from '../types'
import { StatusTag, machineryStatus, fmtMoney } from '../meta'

const CATEGORIES = ['挖掘机', '装载机', '破碎锤', '自卸车', '泵车', '塔吊', '推土机', '压路机', '钻机']
const STATUSES = ['available', 'rented', 'maintenance']

interface FormState {
  name: string
  model: string
  category: string
  brand: string
  description: string
  price: string
  stock: string
  status: string
  specWeight: string
  specPower: string
  specDimensions: string
  specCapacity: string
  recommended: boolean
}

const EMPTY: FormState = {
  name: '', model: '', category: '挖掘机', brand: '', description: '',
  price: '', stock: '', status: 'available',
  specWeight: '', specPower: '', specDimensions: '', specCapacity: '', recommended: false
}

export default function Devices() {
  const [list, setList] = useState<Machinery[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const [form, setForm] = useState<FormState>(EMPTY)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => { load(1) }, [category, status])

  async function load(p: number) {
    setPage(p)
    try {
      const res = await get<Pagination<Machinery>>('/admin/machinery/list' + qs({ page: p, pageSize, category, keyword, status }))
      setList(res.list)
      setTotal(res.total)
    } catch (e: any) {
      setErr(e?.message || '加载失败')
    }
  }

  function openCreate() {
    setEditingId(null)
    setForm(EMPTY)
    setErr('')
    setShowModal(true)
  }

  function openEdit(m: Machinery) {
    setEditingId(m.id)
    setForm({
      name: m.name, model: m.model || '', category: m.category || '挖掘机', brand: m.brand || '',
      description: m.description || '', price: String(m.price || ''), stock: String(m.stock ?? ''),
      status: m.status, specWeight: m.specs?.weight || '', specPower: m.specs?.power || '',
      specDimensions: m.specs?.dimensions || '', specCapacity: m.specs?.capacity || '',
      recommended: !!m.recommended
    })
    setErr('')
    setShowModal(true)
  }

  async function save() {
    if (!form.name.trim()) { setErr('请填写设备名称'); return }
    if (!form.price || Number(form.price) < 0) { setErr('请填写有效的租金价格'); return }
    const body = {
      name: form.name.trim(),
      model: form.model || undefined,
      category: form.category,
      brand: form.brand || undefined,
      description: form.description || undefined,
      price: Number(form.price),
      stock: form.stock ? Number(form.stock) : 0,
      status: form.status,
      specWeight: form.specWeight || undefined,
      specPower: form.specPower || undefined,
      specDimensions: form.specDimensions || undefined,
      specCapacity: form.specCapacity || undefined,
      recommended: form.recommended
    }
    setSaving(true)
    try {
      if (editingId) {
        await put(`/admin/machinery/${editingId}`, body)
      } else {
        await post('/admin/machinery', body)
      }
      setShowModal(false)
      load(page)
    } catch (e: any) {
      setErr(e?.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  async function remove(m: Machinery) {
    if (!window.confirm(`确认删除设备「${m.name}」？此操作不可恢复。`)) return
    try {
      await del(`/admin/machinery/${m.id}`)
      load(page)
    } catch (e: any) {
      alert(e?.message || '删除失败')
    }
  }

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  return (
    <div>
      <div className='page-card'>
        <div className='toolbar'>
          <input className='search-input' placeholder='搜索设备名称/型号/分类' value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') load(1) }} />
          <select className='filter-select' value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value=''>全部分类</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className='filter-select' value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value=''>全部状态</option>
            <option value='available'>可用</option>
            <option value='rented'>已出租</option>
            <option value='maintenance'>维修中</option>
          </select>
          <button className='toolbar-btn secondary' onClick={() => load(1)}>查询</button>
          <div className='spacer' />
          <span style={{ color: 'var(--text-3)' }}>共 {total} 台设备</span>
          <button className='toolbar-btn' onClick={openCreate}>+ 新增设备</button>
        </div>
      </div>

      <div className='page-card'>
        {err && <div className='warn-banner'>{err}</div>}
        <table className='table'>
          <thead>
            <tr>
              <th>设备名称</th>
              <th>型号</th>
              <th>分类</th>
              <th>品牌</th>
              <th>日租金（元）</th>
              <th>状态</th>
              <th>推荐</th>
              <th style={{ width: 140 }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {list.map((m) => (
              <tr key={m.id}>
                <td style={{ fontWeight: 600 }}>{m.name}</td>
                <td>{m.model || '—'}</td>
                <td>{m.category}</td>
                <td>{m.brand || '—'}</td>
                <td>{fmtMoney(m.price)}</td>
                <td><StatusTag status={m.status} map={machineryStatus} /></td>
                <td>{m.recommended ? '★' : '—'}</td>
                <td>
                  <button className='link-btn' onClick={() => openEdit(m)}>编辑</button>
                  <button className='link-btn danger' onClick={() => remove(m)}>删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <div className='empty'>暂无设备</div>}
        <div className='pager'>
          <span>第 {page} / {Math.max(1, Math.ceil(total / pageSize))} 页</span>
          <button disabled={page <= 1} onClick={() => load(page - 1)}>上一页</button>
          <button disabled={page >= Math.ceil(total / pageSize)} onClick={() => load(page + 1)}>下一页</button>
        </div>
      </div>

      {showModal && (
        <div className='modal-mask' onClick={() => setShowModal(false)}>
          <div className='modal' onClick={(e) => e.stopPropagation()}>
            <div className='modal-title'>{editingId ? '编辑设备' : '新增设备'}</div>
            {err && <div className='warn-banner'>{err}</div>}
            <div className='form-grid'>
              <div className='form-field'>
                <label>设备名称 <span className='req'>*</span></label>
                <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder='如：液压挖掘机' />
              </div>
              <div className='form-field'>
                <label>型号</label>
                <input value={form.model} onChange={(e) => set('model', e.target.value)} placeholder='如：CAT 320' />
              </div>
              <div className='form-field'>
                <label>分类</label>
                <select value={form.category} onChange={(e) => set('category', e.target.value)}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className='form-field'>
                <label>品牌</label>
                <input value={form.brand} onChange={(e) => set('brand', e.target.value)} />
              </div>
              <div className='form-field'>
                <label>日租金（元）<span className='req'>*</span></label>
                <input type='number' value={form.price} onChange={(e) => set('price', e.target.value)} />
              </div>
              <div className='form-field'>
                <label>库存数量</label>
                <input type='number' value={form.stock} onChange={(e) => set('stock', e.target.value)} />
              </div>
              <div className='form-field'>
                <label>状态</label>
                <select value={form.status} onChange={(e) => set('status', e.target.value)}>
                  {STATUSES.map((s) => <option key={s} value={s}>{machineryStatus[s]?.label}</option>)}
                </select>
              </div>
              <div className='form-field'>
                <label>规格 · 自重</label>
                <input value={form.specWeight} onChange={(e) => set('specWeight', e.target.value)} />
              </div>
              <div className='form-field'>
                <label>规格 · 功率</label>
                <input value={form.specPower} onChange={(e) => set('specPower', e.target.value)} />
              </div>
              <div className='form-field'>
                <label>规格 · 尺寸</label>
                <input value={form.specDimensions} onChange={(e) => set('specDimensions', e.target.value)} />
              </div>
              <div className='form-field'>
                <label>规格 · 斗容/产能</label>
                <input value={form.specCapacity} onChange={(e) => set('specCapacity', e.target.value)} />
              </div>
              <div className='form-field'>
                <label>推荐展示</label>
                <select value={form.recommended ? '1' : '0'} onChange={(e) => set('recommended', e.target.value === '1')}>
                  <option value='0'>否</option>
                  <option value='1'>是</option>
                </select>
              </div>
              <div className='form-field col-2'>
                <label>设备描述</label>
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