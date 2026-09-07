import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, Space, message, Tag } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { get, post, put, del, qs } from '../api'
import type { Announcement } from '../types'
import { fmtDateTime } from '../meta'
import { confirmAction } from '../confirm'
import { useCachedState } from '../useCachedState'

export default function Announcements() {
  const [list, setList] = useState<Announcement[]>([])
  const [keyword, setKeyword] = useCachedState('an_keyword', '')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Announcement | null>(null)
  const [form] = Form.useForm()

  async function load() {
    try {
      setList(await get<Announcement[]>('/admin/announcements/list' + qs({ keyword })))
    } catch (e: any) {
      message.error(e?.message)
    }
  }
  useEffect(() => { load() }, [keyword])

  function openCreate() {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ type: 'notice', status: 'published' })
    setModal(true)
  }
  function openEdit(a: Announcement) {
    setEditing(a)
    form.setFieldsValue(a)
    setModal(true)
  }
  async function save() {
    const values = await form.validateFields()
    try {
      if (editing) await put(`/admin/announcements/${editing.id}`, values)
      else await post('/admin/announcements', values)
      message.success('保存成功')
      setModal(false)
      load()
    } catch (e: any) {
      message.error(e?.message)
    }
  }
  async function remove(a: Announcement) {
    await del(`/admin/announcements/${a.id}`)
    message.success('已删除')
    load()
  }

  const columns: ColumnsType<Announcement> = [
    { title: '标题', dataIndex: 'title', render: (v) => <b>{v}</b> },
    { title: '类型', dataIndex: 'type', render: (v) => <Tag color={v === 'notice' ? 'blue' : 'orange'}>{v === 'notice' ? '公告' : '通知'}</Tag> },
    { title: '状态', dataIndex: 'status', render: (v) => (v === 'published' ? '已发布' : '草稿') },
    { title: '发布人', dataIndex: 'publisherName' },
    { title: '发布时间', dataIndex: 'createdAt', render: fmtDateTime },
    {
      title: '操作', width: 140,
      render: (_, a) => (
        <Space>
          <Button type='link' size='small' onClick={() => openEdit(a)}>编辑</Button>
          <Button type='link' size='small' danger onClick={() => confirmAction({ title: '确认删除？', content: `确定删除公告「${a.title}」吗？`, danger: true, onOk: () => remove(a) })}>删除</Button>
        </Space>
      )
    }
  ]

  return (
    <div>
      <Space style={{ marginBottom: 12 }}>
        <Input.Search placeholder='搜索标题' allowClear style={{ width: 220 }} onSearch={(v) => setKeyword(v)} />
        <Button type='primary' icon={<PlusOutlined />} onClick={openCreate}>发布公告</Button>
      </Space>
      <Table rowKey='id' dataSource={list} columns={columns} size='small' pagination={false}
        expandable={{
          expandedRowRender: (a) => <div style={{ whiteSpace: 'pre-wrap', color: '#555' }}>{a.content || ''}</div>
        }} />
      <Modal title={editing ? '编辑公告' : '发布公告'} open={modal} onOk={save} onCancel={() => setModal(false)} destroyOnClose width={680}>
        <Form form={form} labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
          <Form.Item name='title' label='标题' rules={[{ required: true, message: '请填写标题' }]}><Input /></Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name='type' label='类型'>
              <Select options={[{ value: 'notice', label: '公告' }, { value: 'notice2', label: '通知' }]} />
            </Form.Item>
            <Form.Item name='status' label='状态'>
              <Select options={[{ value: 'published', label: '已发布' }, { value: 'draft', label: '草稿' }]} />
            </Form.Item>
          </div>
          <Form.Item name='content' label='内容' rules={[{ required: true, message: '请填写内容' }]}>
            <Input.TextArea rows={6} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}