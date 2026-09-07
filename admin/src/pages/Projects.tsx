import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, InputNumber, Select, Space, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { get, post, put, qs } from '../api'
import type { Pagination, Project } from '../types'
import { StatusTag, projectStatus, fmtDate, fmtMoney } from '../meta'
import { confirmAction } from '../confirm'
import { useCachedState } from '../useCachedState'

export default function Projects() {
  const [list, setList] = useState<Project[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useCachedState('pj_page', 1)
  const [pageSize] = useState(10)
  const [status, setStatus] = useCachedState('pj_status', '')
  const [keyword, setKeyword] = useCachedState('pj_keyword', '')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [form] = Form.useForm()

  async function load(p: number) {
    setPage(p)
    try {
      const res = await get<Pagination<Project>>('/admin/projects/list' + qs({ page: p, pageSize, status, keyword }))
      setList(res.list)
      setTotal(res.total)
    } catch (e: any) {
      message.error(e?.message || '加载失败')
    }
  }
  useEffect(() => { load(1) }, [status])

  function openCreate() {
    setEditing(null)
    form.resetFields()
    setModal(true)
  }
  function openEdit(p: Project) {
    setEditing(p)
    form.setFieldsValue(p)
    setModal(true)
  }
  async function save() {
    const values = await form.validateFields()
    try {
      if (editing) await put(`/admin/projects/${editing.id}`, values)
      else await post('/admin/projects', values)
      message.success('保存成功')
      setModal(false)
      load(page)
    } catch (e: any) {
      message.error(e?.message || '保存失败')
    }
  }
  async function changeStatus(p: Project, next: string) {
    await post(`/admin/projects/${p.id}/status`, { status: next })
    message.success('状态已更新')
    load(page)
  }

  const columns: ColumnsType<Project> = [
    { title: '项目编号', dataIndex: 'projectNo', width: 170 },
    { title: '项目名称', dataIndex: 'name', render: (v) => <b>{v}</b> },
    { title: '客户单位', dataIndex: 'customerName' },
    { title: '负责人', dataIndex: 'managerName' },
    { title: '工期', render: (_, p) => `${fmtDate(p.plannedStart)} ~ ${fmtDate(p.plannedEnd)}` },
    { title: '预算（元）', dataIndex: 'budget', render: fmtMoney },
    { title: '状态', dataIndex: 'status', render: (s) => <StatusTag status={s} map={projectStatus} /> },
    {
      title: '操作', width: 250,
      render: (_, p) => (
        <Space size={0}>
          <Button type='link' size='small' onClick={() => openEdit(p)}>编辑</Button>
          {p.status === 'created' && <Button type='link' size='small' onClick={() => confirmAction({ title: '确认启动', content: `确定启动项目「${p.name}」吗？`, onOk: () => changeStatus(p, 'active') })}>启动</Button>}
          {p.status === 'active' && <Button type='link' size='small' onClick={() => confirmAction({ title: '确认完工', content: `确定将项目「${p.name}」标记为完工吗？`, onOk: () => changeStatus(p, 'finished') })}>完工</Button>}
          {(p.status === 'created' || p.status === 'active') && (
            <Button type='link' size='small' danger onClick={() => confirmAction({ title: '确认取消', content: `确定取消项目「${p.name}」吗？`, danger: true, onOk: () => changeStatus(p, 'cancelled') })}>取消</Button>
          )}
        </Space>
      )
    }
  ]

  return (
    <div>
      <Space style={{ marginBottom: 12 }} wrap>
        <Input.Search placeholder='搜索项目名称/客户' allowClear style={{ width: 240 }} onSearch={(v) => { setKeyword(v); load(1) }} />
        <Select placeholder='全部状态' allowClear style={{ width: 130 }}
          options={Object.entries(projectStatus).map(([k, v]) => ({ value: k, label: v.label }))}
          onChange={(v) => setStatus(v || '')} />
        <Button type='primary' icon={<PlusOutlined />} onClick={openCreate}>新增项目</Button>
      </Space>
      <Table rowKey='id' dataSource={list} columns={columns} size='small'
        pagination={{ current: page, pageSize, total, showTotal: (t) => `共 ${t} 个` }}
        onChange={(pg) => load(pg.current || 1)} />
      <Modal title={editing ? '编辑项目' : '新增项目'} open={modal} onOk={save} onCancel={() => setModal(false)} destroyOnClose width={640}>
        <Form form={form} labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
          <Form.Item name='name' label='项目名称' rules={[{ required: true, message: '请填写项目名称' }]}>
            <Input />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name='customerName' label='客户单位'><Input /></Form.Item>
            <Form.Item name='customerPhone' label='联系电话'><Input /></Form.Item>
            <Form.Item name='plannedStart' label='计划开工'><Input type='date' /></Form.Item>
            <Form.Item name='plannedEnd' label='计划完工'><Input type='date' /></Form.Item>
            <Form.Item name='budget' label='预算（元）'><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
            <Form.Item name='managerName' label='负责人'><Input /></Form.Item>
          </div>
          <Form.Item name='address' label='施工地点'><Input /></Form.Item>
          <Form.Item name='description' label='项目描述'><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}