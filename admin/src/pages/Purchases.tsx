import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, InputNumber, Select, Space, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { get, post, del, qs } from '../api'
import type { PurchaseOrder, Supplier } from '../types'
import { StatusTag, purchaseStatus, fmtMoney } from '../meta'
import { confirmAction } from '../confirm'
import { useCachedState } from '../useCachedState'

export default function Purchases() {
  const [list, setList] = useState<PurchaseOrder[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [status, setStatus] = useCachedState('pc_status', '')
  const [keyword, setKeyword] = useCachedState('pc_keyword', '')
  const [modal, setModal] = useState(false)
  const [form] = Form.useForm()

  async function load() {
    try {
      setList(await get<PurchaseOrder[]>('/admin/purchases/list' + qs({ status, keyword })))
    } catch (e: any) {
      message.error(e?.message)
    }
  }
  useEffect(() => { load() }, [status])
  useEffect(() => {
    get<Supplier[]>('/admin/suppliers/list').then(setSuppliers).catch(() => {})
  }, [])

  function openCreate() {
    form.resetFields()
    setModal(true)
  }
  async function save() {
    const values = await form.validateFields()
    try {
      const supplier = suppliers.find((s) => s.id === values.supplierId)
      await post('/admin/purchases', { ...values, supplierName: supplier?.name })
      message.success('创建成功')
      setModal(false)
      load()
    } catch (e: any) {
      message.error(e?.message)
    }
  }
  async function act(id: number, action: string) {
    await post(`/admin/purchases/${id}/status?status=${action}`)
    message.success('已更新')
    load()
  }
  async function receive(id: number) {
    await post(`/admin/purchases/${id}/receive`)
    message.success('已入库')
    load()
  }
  async function remove(p: PurchaseOrder) {
    await del(`/admin/purchases/${p.id}`)
    message.success('已删除')
    load()
  }

  const columns: ColumnsType<PurchaseOrder> = [
    { title: '采购单号', dataIndex: 'orderNo', width: 170 },
    { title: '物料名称', dataIndex: 'itemName', render: (v) => <b>{v}</b> },
    { title: '供应商', dataIndex: 'supplierName' },
    { title: '数量', dataIndex: 'quantity', render: (v, r) => v != null ? `${v} ${r.unit || ''}` : '—' },
    { title: '单价（元）', dataIndex: 'unitPrice' },
    { title: '总额（元）', dataIndex: 'totalAmount', render: (v) => <b>{fmtMoney(v)}</b> },
    { title: '申请人', dataIndex: 'applicantName' },
    { title: '状态', dataIndex: 'status', render: (s) => <StatusTag status={s} map={purchaseStatus} /> },
    {
      title: '操作', width: 320,
      render: (_, p) => (
        <Space size={0}>
          {p.status === 'pending' && (
            <>
              <Button type='link' size='small' onClick={() => confirmAction({ title: '确认审批', content: `确定通过采购单「${p.itemName}」吗？`, onOk: () => act(p.id, 'approve') })}>审批</Button>
              <Button type='link' size='small' danger onClick={() => confirmAction({ title: '确认驳回', content: `确定驳回采购单「${p.itemName}」吗？`, danger: true, onOk: () => act(p.id, 'reject') })}>驳回</Button>
              <Button type='link' size='small' danger onClick={() => confirmAction({ title: '确认取消', content: `确定取消采购单「${p.itemName}」吗？`, danger: true, onOk: () => act(p.id, 'cancel') })}>取消</Button>
            </>
          )}
          {p.status === 'approved' && <Button type='link' size='small' onClick={() => confirmAction({ title: '确认付款', content: `确定登记「${p.itemName}」为已付款？`, onOk: () => act(p.id, 'paid') })}>记付款</Button>}
          {(p.status === 'approved' || p.status === 'paid') && <Button type='link' size='small' onClick={() => confirmAction({ title: '确认入库', content: `确定「${p.itemName}」已到货入库？`, onOk: () => receive(p.id) })}>入库</Button>}
          <Button type='link' size='small' danger onClick={() => confirmAction({ title: '确认删除？', content: `确定删除采购单「${p.itemName}」吗？`, danger: true, onOk: () => remove(p) })}>删除</Button>
        </Space>
      )
    }
  ]

  return (
    <div>
      <Space style={{ marginBottom: 12 }} wrap>
        <Input.Search placeholder='搜索单号/物料/供应商' allowClear style={{ width: 240 }} onSearch={(v) => { setKeyword(v); load() }} />
        <Select placeholder='全部状态' allowClear style={{ width: 130 }}
          options={Object.entries(purchaseStatus).map(([k, v]) => ({ value: k, label: v.label }))}
          onChange={(v) => setStatus(v || '')} />
        <Button type='primary' icon={<PlusOutlined />} onClick={openCreate}>新建采购</Button>
      </Space>
      <Table rowKey='id' dataSource={list} columns={columns} size='small' pagination={false} />
      <Modal title='新建采购申请' open={modal} onOk={save} onCancel={() => setModal(false)} destroyOnClose width={680}>
        <Form form={form} labelCol={{ flex: '0 0 110px' }} wrapperCol={{ flex: 1 }}>
          <Form.Item name='itemName' label='物料名称' rules={[{ required: true, message: '请填写物料名称' }]}><Input /></Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name='supplierId' label='供应商'><Select allowClear options={suppliers.map((s) => ({ value: s.id, label: s.name }))} /></Form.Item>
            <Form.Item name='unit' label='单位'><Input /></Form.Item>
            <Form.Item name='quantity' label='数量'><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
            <Form.Item name='unitPrice' label='单价（元）'><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
          </div>
          <Form.Item name='remark' label='备注'><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}