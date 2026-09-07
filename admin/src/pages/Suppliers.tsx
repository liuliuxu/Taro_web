import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, Space, message, Popconfirm, Tag } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { get, post, put, del, qs } from '../api'
import type { Supplier } from '../types'

export default function Suppliers() {
  const [list, setList] = useState<Supplier[]>([])
  const [keyword, setKeyword] = useState('')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [form] = Form.useForm()

  async function load() {
    try {
      setList(await get<Supplier[]>('/admin/suppliers/list' + qs({ keyword })))
    } catch (e: any) {
      message.error(e?.message)
    }
  }
  useEffect(() => { load() }, [keyword])

  function openCreate() {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ creditLevel: 'B', status: 'enabled' })
    setModal(true)
  }
  function openEdit(s: Supplier) {
    setEditing(s)
    form.setFieldsValue(s)
    setModal(true)
  }
  async function save() {
    const values = await form.validateFields()
    try {
      if (editing) await put(`/admin/suppliers/${editing.id}`, values)
      else await post('/admin/suppliers', values)
      message.success('保存成功')
      setModal(false)
      load()
    } catch (e: any) {
      message.error(e?.message)
    }
  }
  async function remove(s: Supplier) {
    await del(`/admin/suppliers/${s.id}`)
    message.success('已删除')
    load()
  }

  const columns: ColumnsType<Supplier> = [
    { title: '供应商名称', dataIndex: 'name', render: (v) => <b>{v}</b> },
    { title: '联系人', dataIndex: 'contact' },
    { title: '电话', dataIndex: 'phone' },
    { title: '品类', dataIndex: 'category' },
    { title: '地址', dataIndex: 'address' },
    { title: '信用等级', dataIndex: 'creditLevel', render: (v) => <Tag color={v === 'A' ? 'green' : v === 'B' ? 'blue' : 'orange'}>{v}</Tag> },
    { title: '状态', dataIndex: 'status', render: (v) => (v === 'enabled' ? '启用' : '停用') },
    {
      title: '操作', width: 130,
      render: (_, s) => (
        <Space>
          <Button type='link' size='small' onClick={() => openEdit(s)}>编辑</Button>
          <Popconfirm title='确认删除？' onConfirm={() => remove(s)}>
            <Button type='link' size='small' danger>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div>
      <Space style={{ marginBottom: 12 }}>
        <Input.Search placeholder='搜索供应商/联系人' allowClear style={{ width: 240 }} onSearch={(v) => setKeyword(v)} />
        <Button type='primary' icon={<PlusOutlined />} onClick={openCreate}>新增供应商</Button>
      </Space>
      <Table rowKey='id' dataSource={list} columns={columns} size='small' pagination={false} />
      <Modal title={editing ? '编辑供应商' : '新增供应商'} open={modal} onOk={save} onCancel={() => setModal(false)} destroyOnClose>
        <Form form={form} layout='vertical'>
          <Form.Item name='name' label='供应商名称' rules={[{ required: true, message: '请填写名称' }]}><Input /></Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name='contact' label='联系人'><Input /></Form.Item>
            <Form.Item name='phone' label='电话'><Input /></Form.Item>
            <Form.Item name='category' label='供应品类'><Input /></Form.Item>
            <Form.Item name='creditLevel' label='信用等级'>
              <Select options={[{ value: 'A', label: 'A' }, { value: 'B', label: 'B' }, { value: 'C', label: 'C' }]} />
            </Form.Item>
          </div>
          <Form.Item name='address' label='地址'><Input /></Form.Item>
          <Form.Item name='remark' label='备注'><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}