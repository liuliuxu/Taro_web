import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, InputNumber, Select, Space, message, Popconfirm, Tag } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { get, post, put, del, qs } from '../api'
import type { InspectionPlan, Pagination, Machinery, User } from '../types'
import { StatusTag, inspectionStatus, fmtDate } from '../meta'

export default function Inspection() {
  const [list, setList] = useState<InspectionPlan[]>([])
  const [machines, setMachines] = useState<Machinery[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [status, setStatus] = useState('')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<InspectionPlan | null>(null)
  const [form] = Form.useForm()

  async function load() {
    try {
      setList(await get<InspectionPlan[]>('/admin/inspection-plans/list' + qs({ status })))
    } catch (e: any) {
      message.error(e?.message)
    }
  }
  useEffect(() => { load() }, [status])
  useEffect(() => {
    get<Pagination<Machinery>>('/admin/machinery/list' + qs({ page: 1, pageSize: 50 })).then((r) => setMachines(r.list)).catch(() => {})
    get<User[]>('/admin/users/list').then(setUsers).catch(() => {})
  }, [])

  function openCreate() {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ type: 'inspection', cycleDays: 30 })
    setModal(true)
  }
  function openEdit(p: InspectionPlan) {
    setEditing(p)
    form.setFieldsValue(p)
    setModal(true)
  }
  async function save() {
    const values = await form.validateFields()
    const machine = machines.find((m) => m.id === values.machineryId)
    const assignee = users.find((u) => u.id === values.assigneeId)
    const body = { ...values, machineryName: machine?.name, assigneeName: assignee != null ? assignee.nickname || assignee.username : undefined }
    try {
      if (editing) await put(`/admin/inspection-plans/${editing.id}`, body)
      else await post('/admin/inspection-plans', body)
      message.success('保存成功')
      setModal(false)
      load()
    } catch (e: any) {
      message.error(e?.message)
    }
  }
  async function remove(p: InspectionPlan) {
    await del(`/admin/inspection-plans/${p.id}`)
    message.success('已删除')
    load()
  }

  const columns: ColumnsType<InspectionPlan> = [
    { title: '设备', dataIndex: 'machineryName', render: (v) => <b>{v}</b> },
    {
      title: '类型', dataIndex: 'type', render: (v) => <Tag color={v === 'inspection' ? 'blue' : 'purple'}>{v === 'inspection' ? '巡检' : '保养'}</Tag>
    },
    { title: '内容', dataIndex: 'content' },
    { title: '周期（天）', dataIndex: 'cycleDays' },
    { title: '下次到期', dataIndex: 'nextDueAt', render: (v) => <b style={{ color: v && v < new Date().toISOString().slice(0, 10) ? '#cf1322' : undefined }}>{fmtDate(v)}</b> },
    { title: '负责人', dataIndex: 'assigneeName' },
    { title: '上次完成', dataIndex: 'lastDoneAt', render: fmtDate },
    { title: '状态', dataIndex: 'status', render: (v) => <StatusTag status={v} map={inspectionStatus} /> },
    {
      title: '操作', width: 130,
      render: (_, p) => (
        <Space>
          <Button type='link' size='small' onClick={() => openEdit(p)}>编辑</Button>
          <Popconfirm title='确认删除？' onConfirm={() => remove(p)}>
            <Button type='link' size='small' danger>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div>
      <Space style={{ marginBottom: 12 }}>
        <Select placeholder='全部状态' allowClear style={{ width: 130 }}
          options={[
            { value: '', label: '全部状态' },
            { value: 'created', label: '待执行' },
            { value: 'completed', label: '已完成' },
            { value: 'overdue', label: '逾期' }
          ]}
          onChange={(v) => setStatus(v || '')} />
        <Button type='primary' icon={<PlusOutlined />} onClick={openCreate}>新增巡检/保养计划</Button>
      </Space>
      <Table rowKey='id' dataSource={list} columns={columns} size='small' pagination={false} />
      <Modal title={editing ? '编辑计划' : '新增巡检/保养计划'} open={modal} onOk={save} onCancel={() => setModal(false)} destroyOnClose width={640}>
        <Form form={form} layout='vertical'>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name='machineryId' label='设备' rules={[{ required: true, message: '请选择设备' }]}>
              <Select showSearch optionFilterProp='label' options={machines.map((m) => ({ value: m.id, label: m.name }))} />
            </Form.Item>
            <Form.Item name='type' label='类型'>
              <Select options={[{ value: 'inspection', label: '巡检' }, { value: 'maintenance', label: '保养' }]} />
            </Form.Item>
            <Form.Item name='cycleDays' label='周期（天）' rules={[{ required: true, message: '请填写周期' }]}>
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name='assigneeId' label='负责人'>
              <Select options={users.map((u) => ({ value: u.id, label: u.nickname || u.username }))} />
            </Form.Item>
          </div>
          <Form.Item name='content' label='巡检/保养内容' rules={[{ required: true, message: '请填写内容' }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name='remark' label='备注'><Input /></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}