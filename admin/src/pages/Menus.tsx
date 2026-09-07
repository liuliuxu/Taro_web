import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, Space, message, Switch, InputNumber, Tag } from 'antd'
import { PlusOutlined, FolderOutlined, FileOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { get, post, put, del } from '../api'
import type { SysMenu } from '../types'
import { confirmAction } from '../confirm'

const ICON_OPTIONS = [
  { value: 'dashboard', label: '数据总览' },
  { value: 'bar', label: '数据图表' },
  { value: 'appstore', label: '设备运维' },
  { value: 'tool', label: '设备' },
  { value: 'file', label: '单据' },
  { value: 'safety', label: '巡检' },
  { value: 'project', label: '工程' },
  { value: 'carry', label: '租赁' },
  { value: 'shopping', label: '供应链' },
  { value: 'team', label: '团队' },
  { value: 'cart', label: '采购' },
  { value: 'database', label: '库存' },
  { value: 'audit', label: '审批' },
  { value: 'setting', label: '设置' },
  { value: 'notice', label: '公告' },
  { value: 'user', label: '用户' },
  { value: 'apartment', label: '机构' }
]

interface MenuRow extends SysMenu {
  parentName?: string
}

export default function Menus() {
  const [list, setList] = useState<SysMenu[]>([])
  const [rows, setRows] = useState<MenuRow[]>([])
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<SysMenu | null>(null)
  const [form] = Form.useForm()

  const parents = list.filter((m) => m.type === 'parent')

  async function load() {
    try {
      const data = await get<SysMenu[]>('/admin/menus/list')
      setList(data)
      const parentMap = new Map(data.filter((m) => m.type === 'parent').map((m) => [m.id, m.name]))
      setRows(
        data.map((m) => ({
          ...m,
          parentName: m.parentId != null ? parentMap.get(m.parentId) : undefined
        }))
      )
    } catch (e: any) {
      message.error(e?.message)
    }
  }
  useEffect(() => { load() }, [])

  function openCreate(type: 'parent' | 'item', parentId?: number) {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ type, sorted: 0, enabled: true, cached: true, parentId })
    setModal(true)
  }
  function openEdit(m: SysMenu) {
    setEditing(m)
    form.setFieldsValue({ ...m, sort: m.sort ?? 0 })
    setModal(true)
  }

  async function save() {
    const values = await form.validateFields()
    try {
      if (editing) await put(`/admin/menus/${editing.id}`, values)
      else await post('/admin/menus', values)
      message.success('保存成功')
      setModal(false)
      load()
      window.dispatchEvent(new Event('hm-menus-refresh'))
    } catch (e: any) {
      message.error(e?.message)
    }
  }

  async function remove(m: SysMenu) {
    try {
      await del(`/admin/menus/${m.id}`)
      message.success('已删除')
      load()
      window.dispatchEvent(new Event('hm-menus-refresh'))
    } catch (e: any) {
      message.error(e?.message)
    }
  }

  const columns: ColumnsType<MenuRow> = [
    {
      title: '类型',
      width: 90,
      dataIndex: 'type',
      render: (v) => (v === 'parent' ? <Tag color='blue' icon={<FolderOutlined />}>分组</Tag> : <Tag icon={<FileOutlined />}>菜单</Tag>)
    },
    { title: '名称', dataIndex: 'name', render: (v, r) => (r.type === 'item' ? v : <b>{v}</b>) },
    { title: '路径', dataIndex: 'path', render: (v) => v || '-' },
    { title: '所属分组', dataIndex: 'parentName', width: 120, render: (v) => v || '-' },
    { title: '排序', dataIndex: 'sort', width: 70 },
    {
      title: '启用', dataIndex: 'enabled', width: 80,
      render: (v, r) => <Switch size='small' checked={!!v} onChange={(checked) => onToggle(r, checked)} />
    },
    {
      title: '操作', width: 140,
      render: (_, m) => (
        <Space>
          <Button type='link' size='small' onClick={() => openEdit(m)}>编辑</Button>
          {m.type === 'parent' && (
            <Button type='link' size='small' onClick={() => openCreate('item', m.id)}>添加子菜单</Button>
          )}
          <Button type='link' size='small' danger onClick={() => confirmAction({ title: '确认删除？', content: `确定删除「${m.name}」吗？${m.type === 'parent' ? '其下子菜单将一并删除。' : ''}`, danger: true, onOk: () => remove(m) })}>删除</Button>
        </Space>
      )
    }
  ]

  async function onToggle(m: SysMenu, enabled: boolean) {
    try {
      await put(`/admin/menus/${m.id}`, { ...m, enabled })
      message.success(enabled ? '已启用' : '已停用')
      load()
      window.dispatchEvent(new Event('hm-menus-refresh'))
    } catch (e: any) {
      message.error(e?.message)
    }
  }

  return (
    <div>
      <Space style={{ marginBottom: 12 }}>
        <Button type='primary' icon={<PlusOutlined />} onClick={() => openCreate('parent')}>新增分组</Button>
        <Button onClick={() => openCreate('item')}>新增菜单</Button>
        <span style={{ color: '#999', fontSize: 12 }}>管理左侧导航菜单，增删改后刷新页面侧边栏即时生效</span>
      </Space>
      <Table rowKey='id' dataSource={rows} columns={columns} size='small' pagination={false} />

      <Modal title={editing ? '编辑菜单' : '新增菜单'} open={modal} onOk={save} onCancel={() => setModal(false)} destroyOnClose width={560}>
        <Form form={form} labelCol={{ flex: '0 0 110px' }} wrapperCol={{ flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name='type' label='类型' rules={[{ required: true }]}>
              <Select options={[{ value: 'parent', label: '分组' }, { value: 'item', label: '页面菜单' }]} />
            </Form.Item>
            <Form.Item name='sort' label='排序'><InputNumber style={{ width: '100%' }} /></Form.Item>
          </div>
          <Form.Item name='name' label='名称' rules={[{ required: true, message: '请填写名称' }]}><Input placeholder='如：设备管理' /></Form.Item>
          <Form.Item noStyle shouldUpdate={(a, b) => a.type !== b.type}>
            {({ getFieldValue }) =>
              getFieldValue('type') === 'item' ? (
                <>
                  <Form.Item name='parentId' label='所属分组'>
                    <Select allowClear placeholder='不选则为顶级菜单' options={parents.map((m) => ({ value: m.id, label: m.name }))} />
                  </Form.Item>
                  <Form.Item name='path' label='路径' rules={[{ required: true, message: '请填写菜单路径' }]}><Input placeholder='如：/devices' /></Form.Item>
                </>
              ) : null
            }
          </Form.Item>
          <Form.Item name='icon' label='图标'>
            <Select allowClear placeholder='选择图标' options={ICON_OPTIONS} />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name='enabled' label='启用' valuePropName='checked'><Switch /></Form.Item>
            <Form.Item name='cached' label='页面缓存' valuePropName='checked'><Switch /></Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  )
}