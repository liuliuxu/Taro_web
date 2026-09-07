import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, InputNumber, Switch, Space, message, Popconfirm } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { get, post, put, del, qs } from '../api'
import type { Machinery, Pagination } from '../types'
import { StatusTag, machineryStatus, fmtMoney } from '../meta'

const CATEGORIES = ['挖掘机', '装载机', '破碎锤', '自卸车', '泵车', '塔吊', '推土机', '压路机', '钻机']

export default function Devices() {
  const [list, setList] = useState<Machinery[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [keyword, setKeyword] = useState('')
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Machinery | null>(null)
  const [form] = Form.useForm()

  async function load(p: number) {
    setPage(p)
    try {
      const res = await get<Pagination<Machinery>>('/admin/machinery/list' + qs({ page: p, pageSize, keyword, ...filters }))
      setList(res.list)
      setTotal(res.total)
    } catch (e: any) {
      message.error(e?.message || '加载失败')
    }
  }
  useEffect(() => { load(1) }, [filters])

  function openCreate() {
    setEditing(null)
    form.resetFields()
    setModal(true)
  }
  function openEdit(m: Machinery) {
    setEditing(m)
    form.setFieldsValue(m)
    setModal(true)
  }
  async function save() {
    const values = await form.validateFields()
    try {
      if (editing) await put(`/admin/machinery/${editing.id}`, values)
      else await post('/admin/machinery', values)
      message.success('保存成功')
      setModal(false)
      load(page)
    } catch (e: any) {
      message.error(e?.message || '保存失败')
    }
  }
  async function remove(m: Machinery) {
    await del(`/admin/machinery/${m.id}`)
    message.success('已删除')
    load(page)
  }

  const columns: ColumnsType<Machinery> = [
    { title: '设备名称', dataIndex: 'name', render: (v) => <b>{v}</b> },
    { title: '型号', dataIndex: 'model' },
    { title: '分类', dataIndex: 'category' },
    { title: '品牌', dataIndex: 'brand' },
    { title: '日租金（元）', dataIndex: 'price', render: fmtMoney },
    { title: '状态', dataIndex: 'status', render: (s) => <StatusTag status={s} map={machineryStatus} /> },
    { title: '推荐', dataIndex: 'recommended', render: (v) => (v ? '★' : '—') },
    {
      title: '操作', width: 130,
      render: (_, m) => (
        <Space>
          <Button type='link' size='small' onClick={() => openEdit(m)}>编辑</Button>
          <Popconfirm title='确认删除？' onConfirm={() => remove(m)}>
            <Button type='link' size='small' danger>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div>
      <Space style={{ marginBottom: 12 }} wrap>
        <Input.Search placeholder='搜索设备名称/型号' allowClear style={{ width: 220 }} onSearch={(v) => { setKeyword(v); load(1) }} />
        <Select placeholder='全部分类' allowClear style={{ width: 130 }} options={CATEGORIES.map((c) => ({ value: c, label: c }))}
          onChange={(v) => setFilters((f) => ({ ...f, category: v || '' }))} />
        <Select placeholder='全部状态' allowClear style={{ width: 130 }}
          options={Object.entries(machineryStatus).map(([k, v]) => ({ value: k, label: v.label }))}
          onChange={(v) => setFilters((f) => ({ ...f, status: v || '' }))} />
        <Button type='primary' icon={<PlusOutlined />} onClick={openCreate}>新增设备</Button>
      </Space>
      <Table
        rowKey='id'
        dataSource={list}
        columns={columns}
        pagination={{ current: page, pageSize, total, showTotal: (t) => `共 ${t} 台` }}
        onChange={(pg) => load(pg.current || 1)}
      />
      <Modal title={editing ? '编辑设备' : '新增设备'} open={modal} onOk={save} onCancel={() => setModal(false)} destroyOnClose width={640}>
        <Form form={form} layout='vertical' initialValues={{ category: '挖掘机', status: 'available', stock: 0, recommended: false }}>
          <Form.Item name='name' label='设备名称' rules={[{ required: true, message: '请填写设备名称' }]}>
            <Input placeholder='如：液压挖掘机' />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name='model' label='型号'><Input /></Form.Item>
            <Form.Item name='category' label='分类'><Select options={CATEGORIES.map((c) => ({ value: c, label: c }))} /></Form.Item>
            <Form.Item name='brand' label='品牌'><Input /></Form.Item>
            <Form.Item name='price' label='日租金（元）' rules={[{ required: true, message: '请填写租金' }]}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
            <Form.Item name='stock' label='库存数量'><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
            <Form.Item name='status' label='状态'>
              <Select options={Object.entries(machineryStatus).map(([k, v]) => ({ value: k, label: v.label }))} />
            </Form.Item>
            <Form.Item name='recommended' label='推荐展示' valuePropName='checked'><Switch /></Form.Item>
            <Form.Item name='specWeight' label='规格·自重'><Input /></Form.Item>
            <Form.Item name='specPower' label='规格·功率'><Input /></Form.Item>
            <Form.Item name='specDimensions' label='规格·尺寸'><Input /></Form.Item>
            <Form.Item name='specCapacity' label='规格·斗容/产能'><Input /></Form.Item>
          </div>
          <Form.Item name='description' label='设备描述'><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}