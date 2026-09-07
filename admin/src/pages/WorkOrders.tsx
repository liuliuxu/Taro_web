import { useState, useEffect } from 'react'
import { Table, Button, Modal, Space, Select, Input, InputNumber, message, Descriptions, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { get, post, qs } from '../api'
import type { Pagination, User, WorkOrder } from '../types'
import { StatusTag, workOrderStatus, priorityLabel, roleLabel } from '../meta'
import { useCachedState } from '../useCachedState'

export default function WorkOrders() {
  const [list, setList] = useState<WorkOrder[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useCachedState('wo_page', 1)
  const [pageSize] = useState(10)
  const [status, setStatus] = useCachedState('wo_status', '')
  const [keyword, setKeyword] = useCachedState('wo_keyword', '')
  const [detail, setDetail] = useState<WorkOrder | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [assignTarget, setAssignTarget] = useState<WorkOrder | null>(null)
  const [handleTarget, setHandleTarget] = useState<WorkOrder | null>(null)

  async function load(p: number) {
    setPage(p)
    try {
      const res = await get<Pagination<WorkOrder>>('/admin/workorders/list' + qs({ page: p, pageSize, status, keyword }))
      setList(res.list)
      setTotal(res.total)
    } catch (e: any) {
      message.error(e?.message || '加载失败')
    }
  }
  useEffect(() => { load(1) }, [status])

  async function openDetail(id: number) {
    try {
      setDetail(await get<WorkOrder>(`/admin/workorders/${id}`))
    } catch (e: any) {
      message.error(e?.message || '加载失败')
    }
  }

  async function openAssign(w: WorkOrder) {
    setAssignTarget(w)
    if (users.length === 0) {
      try {
        const us = await get<User[]>('/admin/users/list')
        setUsers(us.filter((u) => u.role === 'manager' || u.role === 'operator'))
      } catch { setUsers([]) }
    }
  }

  const [assignUserId, setAssignUserId] = useState<number | undefined>()
  const [assignStatus, setAssignStatus] = useState('assigned')
  async function doAssign() {
    if (!assignTarget || !assignUserId) { message.warning('请选择处理人'); return }
    try {
      await post(`/admin/workorders/${assignTarget.id}/assign`, { assigneeUserId: assignUserId, status: assignStatus })
      message.success('已派单')
      setAssignTarget(null)
      load(page)
    } catch (e: any) {
      message.error(e?.message || '派单失败')
    }
  }

  const [handleStatus, setHandleStatus] = useState('processing')
  const [handleNote, setHandleNote] = useState('')
  const [cost, setCost] = useState<number>()
  function openHandle(w: WorkOrder) {
    setHandleTarget(w)
    setHandleStatus(w.status === 'processing' ? 'review' : w.status === 'review' ? 'done' : 'processing')
    setHandleNote(w.handleNote || '')
    setCost(w.cost)
  }
  async function doHandle() {
    if (!handleTarget) return
    const body: Record<string, unknown> = { status: handleStatus, handleNote: handleNote || undefined }
    if (handleStatus === 'review' && cost !== undefined) body.cost = cost
    try {
      await post(`/admin/workorders/${handleTarget.id}/handle`, body)
      message.success('已提交')
      setHandleTarget(null)
      load(page)
    } catch (e: any) {
      message.error(e?.message || '操作失败')
    }
  }

  const actions: Record<string, { id: string; label: string }[]> = {
    created: [{ id: 'processing', label: '直接处理中' }, { id: 'review', label: '直接提交验收' }],
    assigned: [{ id: 'processing', label: '开始处理' }, { id: 'review', label: '提交验收' }],
    processing: [{ id: 'review', label: '提交验收' }],
    review: [{ id: 'done', label: '验收完成' }]
  }

  const columns: ColumnsType<WorkOrder> = [
    { title: '工单号', dataIndex: 'workNo', width: 170 },
    { title: '标题', dataIndex: 'title', render: (v) => <b>{v}</b> },
    { title: '类型', dataIndex: 'type', render: (t) => (t === 'repair' ? '维修' : '保养') },
    { title: '优先级', dataIndex: 'priority', render: (p) => <Tag color={p === 'urgent' ? 'red' : p === 'high' ? 'orange' : 'default'}>{priorityLabel[p]}</Tag> },
    { title: '设备', dataIndex: 'machineryName' },
    { title: '处理人', dataIndex: 'assigneeName', render: (v) => v || '—' },
    { title: '状态', dataIndex: 'status', render: (s) => <StatusTag status={s} map={workOrderStatus} /> },
    {
      title: '操作', width: 180,
      render: (_, w) => (
        <Space size={0}>
          <Button type='link' size='small' onClick={() => openDetail(w.id)}>查看</Button>
          {w.status === 'created' && <Button type='link' size='small' onClick={() => openAssign(w)}>派单</Button>}
          {(w.status === 'assigned' || w.status === 'processing' || w.status === 'review') && (
            <Button type='link' size='small' onClick={() => openHandle(w)}>处理</Button>
          )}
        </Space>
      )
    }
  ]

  return (
    <div>
      <Space style={{ marginBottom: 12 }} wrap>
        <Input.Search placeholder='搜索单号/标题/设备' allowClear style={{ width: 240 }} onSearch={(v) => { setKeyword(v); load(1) }} />
        <Select placeholder='全部状态' allowClear style={{ width: 130 }}
          options={Object.entries(workOrderStatus).map(([k, v]) => ({ value: k, label: v.label }))}
          onChange={(v) => setStatus(v || '')} />
        <Button onClick={() => load(1)}>查询</Button>
      </Space>
      <Table rowKey='id' dataSource={list} columns={columns} size='small'
        pagination={{ current: page, pageSize, total, showTotal: (t) => `共 ${t} 条` }}
        onChange={(pg) => load(pg.current || 1)} />

      <Modal title='工单详情' open={!!detail} onCancel={() => setDetail(null)} footer={null}>
        {detail && (
          <Descriptions column={2} size='small' bordered>
            <Descriptions.Item label='工单号'>{detail.workNo}</Descriptions.Item>
            <Descriptions.Item label='状态'><StatusTag status={detail.status} map={workOrderStatus} /></Descriptions.Item>
            <Descriptions.Item label='类型/优先级'>{detail.type === 'repair' ? '维修' : '保养'} / {priorityLabel[detail.priority]}</Descriptions.Item>
            <Descriptions.Item label='设备'>{detail.machineryName}</Descriptions.Item>
            <Descriptions.Item label='报修人'>{detail.reportUserName}</Descriptions.Item>
            <Descriptions.Item label='处理人'>{detail.assigneeName || '未派单'}</Descriptions.Item>
            <Descriptions.Item label='标题' span={2}>{detail.title}</Descriptions.Item>
            <Descriptions.Item label='问题描述' span={2}>{detail.description || '—'}</Descriptions.Item>
            <Descriptions.Item label='处理记录' span={2}>{detail.handleNote || '—'}</Descriptions.Item>
            <Descriptions.Item label='费用（元）'>{detail.cost ?? '—'}</Descriptions.Item>
            <Descriptions.Item label='完成时间'>{detail.completedAt || '—'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      <Modal title='派单给处理人' open={!!assignTarget} onOk={doAssign} onCancel={() => setAssignTarget(null)}>
        <Space direction='vertical' style={{ width: '100%' }}>
          <Select placeholder='选择处理人' style={{ width: '100%' }} value={assignUserId} onChange={setAssignUserId}
            options={users.map((u) => ({ value: u.id, label: `${u.nickname || u.username}（${roleLabel[u.role] || u.role}）` }))} />
          <Select placeholder='派单后状态' style={{ width: '100%' }} value={assignStatus} onChange={setAssignStatus}
            options={[{ value: 'assigned', label: '待处理' }, { value: 'processing', label: '处理中' }, { value: 'review', label: '待验收' }]} />
        </Space>
      </Modal>

      <Modal title='处理工单' open={!!handleTarget} onOk={doHandle} onCancel={() => setHandleTarget(null)}>
        {handleTarget && (
          <Space direction='vertical' style={{ width: '100%' }}>
            <Select style={{ width: '100%' }} value={handleStatus} onChange={setHandleStatus}
              options={(actions[handleTarget.status] || []).map((a) => ({ value: a.id, label: a.label }))} />
            <Input.TextArea rows={3} placeholder='处理结果 / 维修说明' value={handleNote} onChange={(e) => setHandleNote(e.target.value)} />
            {handleStatus === 'review' && (
              <InputNumber placeholder='费用（元）' style={{ width: '100%' }} value={cost} onChange={(v) => setCost(v ?? undefined)} min={0} />
            )}
          </Space>
        )}
      </Modal>
    </div>
  )
}