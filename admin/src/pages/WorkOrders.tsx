import { useState, useEffect } from 'react'
import { get, post, qs } from '../api'
import type { Pagination, User, WorkOrder } from '../types'
import { StatusTag, workOrderStatus, priorityLabel, roleLabel, fmtDate } from '../meta'

export default function WorkOrders() {
  const [list, setList] = useState<WorkOrder[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [status, setStatus] = useState('')
  const [keyword, setKeyword] = useState('')
  const [detail, setDetail] = useState<WorkOrder | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [showAssign, setShowAssign] = useState(false)
  const [showHandle, setShowHandle] = useState(false)
  const [assignUserId, setAssignUserId] = useState('')
  const [assignStatus, setAssignStatus] = useState('assigned')
  const [handleStatus, setHandleStatus] = useState('processing')
  const [handleNote, setHandleNote] = useState('')
  const [cost, setCost] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { load(1) }, [status])

  async function load(p: number) {
    setPage(p)
    try {
      const res = await get<Pagination<WorkOrder>>('/admin/workorders/list' + qs({ page: p, pageSize, status, keyword }))
      setList(res.list)
      setTotal(res.total)
    } catch (e: any) {
      alert(e?.message || '加载失败')
    }
  }

  async function openDetail(id: number) {
    try {
      setDetail(await get<WorkOrder>(`/admin/workorders/${id}`))
    } catch (e: any) {
      alert(e?.message || '加载失败')
    }
  }

  async function openAssign(w: WorkOrder) {
    setDetail(w)
    setAssignUserId('')
    setAssignStatus('assigned')
    setSaving(false)
    try {
      const us = await get<User[]>('/admin/users/list')
      setUsers(us.filter((u) => u.role === 'manager' || u.role === 'operator'))
    } catch { setUsers([]) }
    setShowAssign(true)
  }

  async function doAssign() {
    if (!detail || !assignUserId) { alert('请选择处理人'); return }
    setSaving(true)
    try {
      await post(`/admin/workorders/${detail.id}/assign`, { assigneeUserId: Number(assignUserId), status: assignStatus })
      setShowAssign(false)
      setDetail(null)
      load(page)
    } catch (e: any) {
      alert(e?.message || '派单失败')
    } finally {
      setSaving(false)
    }
  }

  async function openHandle(w: WorkOrder) {
    setDetail(w)
    setHandleStatus(w.status === 'created' ? 'processing' : w.status === 'assigned' ? 'processing' : w.status === 'processing' ? 'review' : 'done')
    setHandleNote(w.handleNote || '')
    setCost(w.cost ? String(w.cost) : '')
    setSaving(false)
    setShowHandle(true)
  }

  async function doHandle() {
    if (!detail) return
    const body: Record<string, unknown> = { status: handleStatus, handleNote: handleNote || undefined }
    if (handleStatus === 'review' && cost) body.cost = Number(cost)
    setSaving(true)
    try {
      await post(`/admin/workorders/${detail.id}/handle`, body)
      setShowHandle(false)
      setDetail(null)
      load(page)
    } catch (e: any) {
      alert(e?.message || '操作失败')
    } finally {
      setSaving(false)
    }
  }

  const handleActions: Record<string, { id: string; label: string }[]> = {
    created: [{ id: 'processing', label: '直接处理中' }, { id: 'review', label: '直接提交验收' }],
    assigned: [{ id: 'processing', label: '开始处理' }, { id: 'review', label: '提交验收' }],
    processing: [{ id: 'review', label: '提交验收' }],
    review: [{ id: 'done', label: '验收完成' }]
  }

  return (
    <div>
      <div className='page-card'>
        <div className='toolbar'>
          <input className='search-input' placeholder='搜索单号/标题/设备' value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') load(1) }} />
          <select className='filter-select' value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value=''>全部状态</option>
            <option value='created'>待派单</option>
            <option value='assigned'>待处理</option>
            <option value='processing'>处理中</option>
            <option value='review'>待验收</option>
            <option value='done'>已完成</option>
            <option value='cancelled'>已取消</option>
          </select>
          <button className='toolbar-btn secondary' onClick={() => load(1)}>查询</button>
          <div className='spacer' />
          <span style={{ color: 'var(--text-3)' }}>共 {total} 条工单</span>
        </div>
      </div>

      <div className='page-card'>
        <table className='table'>
          <thead>
            <tr>
              <th>工单号</th>
              <th>标题</th>
              <th>类型</th>
              <th>优先级</th>
              <th>设备</th>
              <th>处理人</th>
              <th>状态</th>
              <th>报修时间</th>
              <th style={{ width: 170 }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {list.map((w) => (
              <tr key={w.id}>
                <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{w.workNo}</td>
                <td style={{ fontWeight: 600, maxWidth: 220 }}>{w.title}</td>
                <td>{w.type === 'repair' ? '维修' : '保养'}</td>
                <td style={{ color: w.priority === 'urgent' ? 'var(--red)' : w.priority === 'high' ? '#D97706' : 'var(--text-2)' }}>{priorityLabel[w.priority] || w.priority}</td>
                <td>{w.machineryName}</td>
                <td>{w.assigneeName || '—'}</td>
                <td><StatusTag status={w.status} map={workOrderStatus} /></td>
                <td style={{ fontSize: 12, color: 'var(--text-3)' }}>{w.reportedAt ? fmtDate(w.reportedAt) : '—'}</td>
                <td>
                  <button className='link-btn' onClick={() => openDetail(w.id)}>查看</button>
                  {w.status === 'created' && <button className='link-btn success' onClick={() => openAssign(w)}>派单</button>}
                  {(w.status === 'assigned' || w.status === 'processing' || w.status === 'review') && (
                    <button className='link-btn success' onClick={() => openHandle(w)}>处理</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <div className='empty'>暂无工单</div>}
        <div className='pager'>
          <span>第 {page} / {Math.max(1, Math.ceil(total / pageSize))} 页</span>
          <button disabled={page <= 1} onClick={() => load(page - 1)}>上一页</button>
          <button disabled={page >= Math.ceil(total / pageSize)} onClick={() => load(page + 1)}>下一页</button>
        </div>
      </div>

      {/* 详情 */}
      {detail && !showAssign && !showHandle && (
        <div className='modal-mask' onClick={() => setDetail(null)}>
          <div className='modal' onClick={(e) => e.stopPropagation()}>
            <div className='modal-title' style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              工单详情
              <StatusTag status={detail.status} map={workOrderStatus} />
            </div>
            <div className='detail-grid'>
              <div className='detail-item'><div className='k'>工单号</div><div className='v'>{detail.workNo}</div></div>
              <div className='detail-item'><div className='k'>类型 / 优先级</div><div className='v'>{detail.type === 'repair' ? '维修' : '保养'} / {priorityLabel[detail.priority] || detail.priority}</div></div>
              <div className='detail-item'><div className='k'>设备</div><div className='v'>{detail.machineryName}{detail.machineryModel ? `（${detail.machineryModel}）` : ''}</div></div>
              <div className='detail-item'><div className='k'>报修人</div><div className='v'>{detail.reportUserName}</div></div>
              <div className='detail-item'><div className='k'>处理人</div><div className='v'>{detail.assigneeName || '未派单'}</div></div>
              <div className='detail-item'><div className='k'>报修时间</div><div className='v'>{detail.reportedAt || '—'}</div></div>
              <div className='detail-item'><div className='k'>费用（元）</div><div className='v'>{detail.cost ?? '—'}</div></div>
              <div className='detail-item'><div className='k'>完成时间</div><div className='v'>{detail.completedAt ? fmtDate(detail.completedAt) : '—'}</div></div>
              <div className='detail-item'><div className='k'>标题</div><div className='v'>{detail.title}</div></div>
              <div className='detail-item'><div className='k'>问题描述</div><div className='v'>{detail.description || '—'}</div></div>
              <div className='detail-item'><div className='k'>处理记录</div><div className='v'>{detail.handleNote || '—'}</div></div>
            </div>
            <div className='modal-actions'>
              {detail.status === 'created' && <button className='btn btn-ok' onClick={() => openAssign(detail)}>派单</button>}
              {(detail.status === 'assigned' || detail.status === 'processing' || detail.status === 'review') && (
                <button className='btn btn-ok' onClick={() => openHandle(detail)}>处理工单</button>
              )}
              <button className='btn btn-cancel' onClick={() => setDetail(null)}>关闭</button>
            </div>
          </div>
        </div>
      )}

      {/* 派单 */}
      {showAssign && detail && (
        <div className='modal-mask' onClick={() => setShowAssign(false)}>
          <div className='modal' onClick={(e) => e.stopPropagation()}>
            <div className='modal-title'>派单给处理人</div>
            <div className='form-grid'>
              <div className='form-field col-2'>
                <label>处理人 <span className='req'>*</span></label>
                <select value={assignUserId} onChange={(e) => setAssignUserId(e.target.value)}>
                  <option value=''>请选择</option>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.nickname || u.username}（{roleLabel[u.role] || u.role}）</option>)}
                </select>
              </div>
              <div className='form-field col-2'>
                <label>派单后状态</label>
                <select value={assignStatus} onChange={(e) => setAssignStatus(e.target.value)}>
                  <option value='assigned'>待处理（待对方开始）</option>
                  <option value='processing'>处理中（直接开始）</option>
                  <option value='review'>待验收（直接完成处理）</option>
                </select>
              </div>
            </div>
            <div className='modal-actions'>
              <button className='btn btn-cancel' onClick={() => setShowAssign(false)}>取消</button>
              <button className='btn btn-ok' disabled={saving} onClick={doAssign}>{saving ? '提交中...' : '确认派单'}</button>
            </div>
          </div>
        </div>
      )}

      {/* 处理 */}
      {showHandle && detail && (
        <div className='modal-mask' onClick={() => setShowHandle(false)}>
          <div className='modal' onClick={(e) => e.stopPropagation()}>
            <div className='modal-title'>处理工单</div>
            <div className='form-grid'>
              <div className='form-field col-2'>
                <label>目标状态</label>
                <select value={handleStatus} onChange={(e) => setHandleStatus(e.target.value)}>
                  {(handleActions[detail.status] || []).map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
                </select>
              </div>
              <div className='form-field col-2'>
                <label>处理结果 / 维修说明</label>
                <textarea value={handleNote} onChange={(e) => setHandleNote(e.target.value)} placeholder='填写处理过程、更换配件等' />
              </div>
              <div className='form-field col-2'>
                <label>费用（元）{handleStatus === 'review' ? '（必填）' : ''}</label>
                <input type='number' value={cost} onChange={(e) => setCost(e.target.value)} placeholder='如：2800' />
              </div>
            </div>
            <div className='modal-actions'>
              <button className='btn btn-cancel' onClick={() => setShowHandle(false)}>取消</button>
              <button className='btn btn-ok' disabled={saving} onClick={doHandle}>{saving ? '提交中...' : '确认提交'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}