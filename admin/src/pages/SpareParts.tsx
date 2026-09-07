import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, InputNumber, Select, Space, message, Tag, Card } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { get, post, put, del, qs } from '../api'
import type { SparePart, StockRecord } from '../types'
import { fmtMoney } from '../meta'
import { confirmAction } from '../confirm'
import { useCachedState } from '../useCachedState'

interface StockRecordRow { id: number; type: string; qty?: number; unit?: string; relateNo?: string; operatorName?: string; remark?: string; createdAt?: string }

export default function SpareParts() {
  const [list, setList] = useState<SparePart[]>([])
  const [records, setRecords] = useState<StockRecordRow[]>([])
  const [keyword, setKeyword] = useCachedState('spp_keyword', '')
  const [category, setCategory] = useCachedState('spp_category', '')
  const [lowStock, setLowStock] = useState(false)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<SparePart | null>(null)
  const [stockTarget, setStockTarget] = useState<SparePart | null>(null)
  const [form] = Form.useForm()

  async function load() {
    try {
      setList(await get<SparePart[]>('/admin/spare-parts/list' + qs({ keyword, category })))
      const rows = await get<StockRecordRow[]>('/admin/spare-parts/stock-records')
      setRecords(rows)
    } catch (e: any) {
      message.error(e?.message)
    }
  }
  useEffect(() => { load() }, [keyword, category])

  function filtered() {
    if (!lowStock) return list
    return list.filter((p) => p.minStock != null && p.stockQty != null && p.stockQty < p.minStock)
  }

  function openCreate() {
    setEditing(null)
    form.resetFields()
    setModal(true)
  }
  function openEdit(p: SparePart) {
    setEditing(p)
    form.setFieldsValue(p)
    setModal(true)
  }
  async function save() {
    const values = await form.validateFields()
    try {
      if (editing) await put(`/admin/spare-parts/${editing.id}`, values)
      else await post('/admin/spare-parts', values)
      message.success('保存成功')
      setModal(false)
      load()
    } catch (e: any) {
      message.error(e?.message)
    }
  }
  async function remove(p: SparePart) {
    await del(`/admin/spare-parts/${p.id}`)
    message.success('已删除')
    load()
  }
  const [stockType, setStockType] = useState<'in' | 'out'>('in')
  const [stockQty, setStockQty] = useState<number>(1)
  async function doStock() {
    if (!stockTarget || !stockQty) return
    await post(`/admin/spare-parts/${stockTarget.id}/stock?type=${stockType}&qty=${stockQty}`)
    message.success('操作成功')
    setStockTarget(null)
    load()
  }

  const columns: ColumnsType<SparePart> = [
    { title: '编号', dataIndex: 'partNo', width: 120 },
    { title: '名称', dataIndex: 'name', render: (v) => <b>{v}</b> },
    { title: '分类', dataIndex: 'category' },
    { title: '规格', dataIndex: 'spec' },
    { title: '库存', dataIndex: 'stockQty', render: (v, p) => <Tag color={p.minStock != null && v != null && v < p.minStock ? 'red' : 'green'}>{v} {p.unit || ''}</Tag> },
    { title: '最低库存', dataIndex: 'minStock', render: (v, p) => `${v ?? 0} ${p.unit || ''}` },
    { title: '单价（元）', dataIndex: 'price' },
    { title: '库房', dataIndex: 'warehouse' },
    {
      title: '操作', width: 200,
      render: (_, p) => (
        <Space size={0}>
          <Button type='link' size='small' onClick={() => { setStockTarget(p); setStockType('in'); setStockQty(1) }}>入库</Button>
          <Button type='link' size='small' onClick={() => { setStockTarget(p); setStockType('out'); setStockQty(1) }}>出库</Button>
          <Button type='link' size='small' onClick={() => openEdit(p)}>编辑</Button>
          <Button type='link' size='small' danger onClick={() => confirmAction({ title: '确认删除？', content: `确定删除备件「${p.name}」吗？`, danger: true, onOk: () => remove(p) })}>删除</Button>
        </Space>
      )
    }
  ]

  return (
    <div>
      <Space style={{ marginBottom: 12 }} wrap>
        <Input.Search placeholder='搜索备件名称/编号' allowClear style={{ width: 220 }} onSearch={(v) => setKeyword(v)} />
        <Select placeholder='全部分类' allowClear style={{ width: 130 }}
          options={['过滤件', '密封件', '油品化工', '易损件', '采购件'].map((c) => ({ value: c, label: c }))}
          onChange={(v) => setCategory(v || '')} />
        <Button onClick={() => setLowStock(!lowStock)}>仅看低库存</Button>
        <Button type='primary' icon={<PlusOutlined />} onClick={openCreate}>新增备件</Button>
      </Space>
      <Table rowKey='id' dataSource={filtered()} columns={columns} size='small' pagination={false} />
      <Card title={`出入库流水（${records.length}）`} size='small' style={{ marginTop: 16 }}>
        <Table rowKey='id' size='small' dataSource={records.slice(0, 50)} pagination={false}
          columns={[
            { title: '备件', dataIndex: 'partName', render: (v) => <b>{v}</b> },
            { title: '类型', dataIndex: 'type', render: (v) => <Tag color={v === 'in' ? 'green' : 'red'}>{v === 'in' ? '入库' : '出库'}</Tag> },
            { title: '数量', dataIndex: 'qty', render: (v, r) => `${v} ${r.unit || ''}` },
            { title: '关联单号', dataIndex: 'relateNo' },
            { title: '操作人', dataIndex: 'operatorName' },
            { title: '时间', dataIndex: 'createdAt' }
          ]} />
      </Card>
      <Modal title={editing ? '编辑备件' : '新增备件'} open={modal} onOk={save} onCancel={() => setModal(false)} destroyOnClose width={680}>
        <Form form={form} labelCol={{ flex: '0 0 110px' }} wrapperCol={{ flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name='partNo' label='编号' rules={[{ required: true, message: '请填写编号' }]}><Input /></Form.Item>
            <Form.Item name='name' label='名称' rules={[{ required: true, message: '请填写名称' }]}><Input /></Form.Item>
            <Form.Item name='category' label='分类'><Input /></Form.Item>
            <Form.Item name='spec' label='规格'><Input /></Form.Item>
            <Form.Item name='stockQty' label='初始库存'><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
            <Form.Item name='minStock' label='最低库存'><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
            <Form.Item name='price' label='单价（元）'><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
            <Form.Item name='unit' label='单位'><Input /></Form.Item>
            <Form.Item name='warehouse' label='库房'><Input /></Form.Item>
          </div>
          <Form.Item name='remark' label='备注'><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
      <Modal title={`${stockType === 'in' ? '入库' : '出库'} · ${stockTarget?.name}`} open={!!stockTarget} onOk={doStock} onCancel={() => setStockTarget(null)}>
        <Select style={{ width: '100%', marginBottom: 12 }} value={stockType} onChange={setStockType}
          options={[{ value: 'in', label: '入库' }, { value: 'out', label: '出库' }]} />
        <InputNumber placeholder='数量' min={1} value={stockQty} onChange={(v) => setStockQty(v ?? 1)} style={{ width: '100%' }} />
      </Modal>
    </div>
  )
}