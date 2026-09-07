import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, Space, message, Tag, InputNumber, DatePicker } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { get, post, put, del, qs } from '../api'
import type { Org, User } from '../types'
import { roleLabel } from '../meta'
import { confirmAction } from '../confirm'
import { useCachedState } from '../useCachedState'
import dayjs from 'dayjs'

const ROLES = ['admin', 'manager', 'operator', 'customer']

export default function UsersPage() {
  const [list, setList] = useState<User[]>([])
  const [orgs, setOrgs] = useState<Org[]>([])
  const [keyword, setKeyword] = useCachedState('us_keyword', '')
  const [role, setRole] = useCachedState('us_role', '')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [form] = Form.useForm()
  const me = JSON.parse(localStorage.getItem('hm_user') || '{}') as User

  async function load() {
    try {
      const data = await get<User[]>('/admin/users/list' + qs({ keyword, role }))
      setList(data)
    } catch (e: any) {
      message.error(e?.message || '加载失败')
    }
  }
  useEffect(() => { load() }, [role])
  useEffect(() => {
    get<Org[]>('/admin/orgs/list').then(setOrgs).catch(() => {})
  }, [])

  function openCreate() {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ role: 'operator' })
    setModal(true)
  }
  function openEdit(u: User) {
    setEditing(u)
    form.setFieldsValue({ ...u, password: '', hireDate: u.hireDate ? dayjs(u.hireDate) : undefined })
    setModal(true)
  }
  async function save() {
    const values = await form.validateFields()
    try {
      if (editing) {
        const body: Record<string, unknown> = {
          nickname: values.nickname || undefined,
          phone: values.phone || undefined,
          email: values.email || undefined,
          role: values.role,
          orgId: values.orgId || undefined,
          password: values.password || undefined,
          hireDate: values.hireDate || undefined,
          workYears: values.workYears ?? undefined,
          annualLeave: values.annualLeave ?? undefined,
          compensatoryLeave: values.compensatoryLeave ?? undefined,
          overtime: values.overtime ?? undefined
        }
        await put(`/admin/users/${editing.id}`, body)
      } else {
        await post('/admin/users', { ...values, password: values.password })
      }
      message.success('保存成功')
      setModal(false)
      load()
    } catch (e: any) {
      message.error(e?.message || '保存失败')
    }
  }
  async function remove(u: User) {
    if (u.role === 'admin') { message.warning('不能删除管理员账号'); return }
    await del(`/admin/users/${u.id}`)
    message.success('已删除')
    load()
  }

  const columns: ColumnsType<User> = [
    { title: '用户名', dataIndex: 'username', render: (v) => <b>{v}</b> },
    { title: '姓名', dataIndex: 'nickname' },
    { title: '角色', dataIndex: 'role', render: (r) => <Tag color={r === 'admin' ? 'red' : r === 'manager' ? 'blue' : 'default'}>{roleLabel[r] || r}</Tag> },
    { title: '手机号', dataIndex: 'phone' },
    { title: '邮箱', dataIndex: 'email' },
    { title: '机构', dataIndex: 'orgId', render: (orgId) => {
        const org = orgs.find((o) => o.id === orgId)
        return org ? org.name : (orgId == null ? <Tag>集团</Tag> : '—')
      } },
    { title: '入职日期', dataIndex: 'hireDate', render: (d) => d || '—' },
    { title: '工龄(年)', dataIndex: 'workYears', render: (v) => v ?? '—' },
    { title: '年假(天)', dataIndex: 'annualLeave', render: (v) => v ?? '—' },
    { title: '调休(时)', dataIndex: 'compensatoryLeave', render: (v) => v ?? '—' },
    { title: '加班(时)', dataIndex: 'overtime', render: (v) => v ?? '—' },
    { title: '创建时间', dataIndex: 'createdAt', render: (d) => d?.slice(0, 10) || '—' },
    {
      title: '操作', width: 140,
      render: (_, u) => (
        <Space>
          <Button type='link' size='small' onClick={() => openEdit(u)}>编辑</Button>
          {u.id !== me.id && u.role !== 'admin' && (
            <Button type='link' size='small' danger onClick={() => confirmAction({ title: '确认删除？', content: `确定删除用户「${u.nickname || u.username}」吗？`, danger: true, onOk: () => remove(u) })}>删除</Button>
          )}
        </Space>
      )
    }
  ]

  return (
    <div>
      <Space style={{ marginBottom: 12 }} wrap>
        <Input.Search placeholder='搜索用户名/姓名/手机号' allowClear style={{ width: 220 }} onSearch={(v) => { setKeyword(v); load() }} />
        <Select placeholder='全部角色' allowClear style={{ width: 140 }}
          options={ROLES.map((r) => ({ value: r, label: roleLabel[r] || r }))}
          onChange={(v) => setRole(v || '')} />
        <Button type='primary' icon={<PlusOutlined />} onClick={openCreate}>新增用户</Button>
      </Space>
      <Table rowKey='id' dataSource={list} columns={columns} size='small' pagination={false} />
      <Modal title={editing ? `编辑用户 · ${editing.username}` : '新增用户'} open={modal} onOk={save} onCancel={() => setModal(false)} destroyOnClose width={680}>
        <Form form={form} labelCol={{ flex: '0 0 110px' }} wrapperCol={{ flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name='username' label='用户名' rules={[{ required: true, message: '请填写用户名' }]}>
              <Input disabled={!!editing} />
            </Form.Item>
            <Form.Item name='password' label={editing ? '重置密码（留空不变）' : '初始密码'} rules={editing ? [] : [{ required: true, message: '请填写初始密码' }]}>
              <Input.Password placeholder={editing ? '留空则不修改' : '设置登录密码'} />
            </Form.Item>
            <Form.Item name='nickname' label='姓名'><Input /></Form.Item>
            <Form.Item name='role' label='角色' rules={[{ required: true }]}>
              <Select options={ROLES.map((r) => ({ value: r, label: roleLabel[r] || r }))} />
            </Form.Item>
            <Form.Item name='orgId' label='所属机构'>
              <Select allowClear placeholder='默认同当前机构' options={orgs.map((o) => ({ value: o.id, label: o.name }))} />
            </Form.Item>
            <Form.Item name='phone' label='手机号'><Input /></Form.Item>
            <Form.Item name='email' label='邮箱'><Input /></Form.Item>
            <Form.Item name='hireDate' label='入职日期'><DatePicker style={{ width: '100%' }} /></Form.Item>
            <Form.Item name='workYears' label='工龄(年)'><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
            <Form.Item name='annualLeave' label='年假(天)'><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
            <Form.Item name='compensatoryLeave' label='调休(时)'><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
            <Form.Item name='overtime' label='加班(时)'><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  )
}