import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, InputNumber, Select, Space, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { get, post, put, del, qs } from '../api'
import type { Contract } from '../types'
import { StatusTag, contractStatus, fmtDate, fmtMoney } from '../meta'
import { confirmAction } from '../confirm'
import { useCachedState } from '../useCachedState'

export default function Contracts() {
  const [list, setList] = useState<Contract[]>([])
  const [status, setStatus] = useCachedState('ct_status', '')
  const [keyword, setKeyword] = useCachedState('ct_keyword', '')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Contract | null>(null)
  const [form] = Form.useForm()

  async function load() {
    try {
      setList(await get<Contract[]>('/admin/contracts/list' + qs({ status, keyword })))
    } catch (e: any) {
      message.error(e?.message)
    }
  }
  useEffect(() => { load() }, [status])

  function openCreate() {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ type: '租赁', status: 'draft' })
    setModal(true)
  }
  function openEdit(c: Contract) {
    setEditing(c)
    form.setFieldsValue(c)
    setModal(true)
  }
  async function save() {
    const values = await form.validateFields()
    try {
      if (editing) await put(`/admin/contracts/${editing.id}`, values)
      else await post('/admin/contracts', values)
      message.success('保存成功')
      setModal(false)
      load()
    } catch (e: any) {
      message.error(e?.message)
    }
  }
  async function remove(c: Contract) {
    await del(`/admin/contracts/${c.id}`)
    message.success('已删除')
    load()
  }

  const columns: ColumnsType<Contract> = [
    { title: '合同号', dataIndex: 'contractNo', width: 180 },
    { title: '客户名称', dataIndex: 'customerName', render: (v) => <b>{v}</b> },
    { title: '类型', dataIndex: 'type' },
    { title: '联系人', dataIndex: 'contact' },
    { title: '电话', dataIndex: 'phone' },
    { title: '金额（元）', dataIndex: 'amount', render: fmtMoney },
    { title: '期限', render: (_, c) => `${fmtDate(c.startDate)} ~ ${fmtDate(c.endDate)}` },
    { title: '状态', dataIndex: 'status', render: (s) => <StatusTag status={s} map={contractStatus} /> },
    {
      title: '操作', width: 140,
      render: (_, c) => (
        <Space>
          <Button type='link' size='small' onClick={() => openEdit(c)}>编辑</Button>
          <Button type='link' size='small' danger onClick={() => confirmAction({ title: '确认删除？', content: `确定删除合同「${c.contractNo} · ${c.customerName}」吗？`, danger: true, onOk: () => remove(c) })}>删除</Button>
        </Space>
      )
    }
  ]

  return (
    <div>
      <Space style={{ marginBottom: 12 }} wrap>
        <Input.Search placeholder='搜索合同号/客户' allowClear style={{ width: 240 }} onSearch={(v) => { setKeyword(v); load() }} />
        <Select placeholder='全部状态' allowClear style={{ width: 130 }}
          options={Object.entries(contractStatus).map(([k, v]) => ({ value: k, label: v.label }))}
          onChange={(v) => setStatus(v || '')} />
        <Button type='primary' icon={<PlusOutlined />} onClick={openCreate}>新建合同</Button>
      </Space>
      <Table rowKey='id' dataSource={list} columns={columns} size='small' pagination={false} />
      <Modal title={editing ? '编辑合同' : '新建合同'} open={modal} onOk={save} onCancel={() => setModal(false)} destroyOnClose width={680}>
        <Form form={form} labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
          <Form.Item name='customerName' label='客户名称' rules={[{ required: true, message: '请填写客户名称' }]}><Input /></Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name='type' label='类型'>
              <Select options={[{ value: '租赁', label: '租赁' }, { value: '购买', label: '购买' }, { value: '服务', label: '服务' }]} />
            </Form.Item>
            <Form.Item name='amount' label='金额（元）'><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
            <Form.Item name='contact' label='联系人'><Input /></Form.Item>
            <Form.Item name='phone' label='电话'><Input /></Form.Item>
            <Form.Item name='startDate' label='开始日期'><Input type='date' /></Form.Item>
            <Form.Item name='endDate' label='结束日期'><Input type='date' /></Form.Item>
            <Form.Item name='status' label='状态'>
              <Select options={Object.entries(contractStatus).map(([k, v]) => ({ value: k, label: v.label }))} />
            </Form.Item>
          </div>
          <Form.Item name='remark' label='备注'><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}