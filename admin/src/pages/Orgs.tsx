import { useState, useEffect } from 'react'
import { Tree, Button, Modal, Form, Input, Select, Space, message, Card, Row, Col } from 'antd'
import { PlusOutlined, EditOutlined } from '@ant-design/icons'
import { get, post, put, del } from '../api'
import type { Org } from '../types'
import { confirmAction } from '../confirm'

export default function Orgs() {
  const [tree, setTree] = useState<Org[]>([])
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Org | null>(null)
  const [form] = Form.useForm()

  async function load() {
    try {
      setTree(await get<Org[]>('/admin/orgs/tree'))
    } catch (e: any) {
      message.error(e?.message)
    }
  }
  useEffect(() => { load() }, [])

  const flatten = (nodes: Org[]): Org[] => nodes.flatMap((n) => [n, ...flatten(n.children || [])])
  const flat = flatten(tree)

  function openCreate(parentId?: number) {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ parentId })
    setModal(true)
  }
  function openEdit(o: Org) {
    setEditing(o)
    form.setFieldsValue(o)
    setModal(true)
  }
  async function save() {
    const values = await form.validateFields()
    try {
      if (editing) {
        await put(`/admin/orgs/${editing.id}`, { ...values, code: editing.code })
      } else {
        await post('/admin/orgs', { ...values, status: 'enabled' })
      }
      message.success('保存成功')
      setModal(false)
      load()
    } catch (e: any) {
      message.error(e?.message || '保存失败')
    }
  }
  async function remove(o: Org) {
    if (o.children?.length) {
      message.warning('请先删除下级机构')
      return
    }
    await del(`/admin/orgs/${o.id}`)
    message.success('已删除')
    load()
  }

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={10}>
        <Card title='机构树（上级可见下级）' size='small'
          extra={<Button type='primary' icon={<PlusOutlined />} size='small' onClick={() => openCreate(undefined)}>新增根机构</Button>}>
          <Tree
            treeData={flat.map((o) => ({
              key: o.id,
              title: (
                <Space>
                  <span>{o.name}</span>
                  <Button type='text' size='small' icon={<PlusOutlined />} onClick={() => openCreate(o.id)} />
                  <Button type='text' size='small' icon={<EditOutlined />} onClick={() => openEdit(o)} />
                  <Button type='text' size='small' danger onClick={() => confirmAction({ title: '确认删除？', content: `确定删除机构「${o.name}」吗？`, danger: true, onOk: () => remove(o) })}>删</Button>
                </Space>
              )
            }))}
            defaultExpandAll
          />
        </Card>
      </Col>
      <Col xs={24} md={14}>
        <Card title='全部机构' size='small'>
          <table className='table'>
            <thead><tr><th>编码</th><th>名称</th><th>层级</th><th>状态</th><th>操作</th></tr></thead>
            <tbody>
              {flat.map((o) => (
                <tr key={o.id}>
                  <td style={{ fontFamily: 'monospace' }}>{o.code}</td>
                  <td><b>{o.name}</b></td>
                  <td>{['集团', '公司', '部门/车队'][o.orgLevel || 0] || o.orgLevel}</td>
                  <td>{o.status === 'enabled' ? '启用' : '停用'}</td>
                  <td>
                    <Space>
                      <Button type='link' size='small' onClick={() => openEdit(o)}>编辑</Button>
                      <Button type='link' size='small' danger onClick={() => confirmAction({ title: '确认删除？', content: `确定删除机构「${o.name}」吗？`, danger: true, onOk: () => remove(o) })}>删除</Button>
                    </Space>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </Col>
      <Modal title={editing ? '编辑机构' : '新增机构'} open={modal} onOk={save} onCancel={() => setModal(false)} destroyOnClose width={560}>
        <Form form={form} labelCol={{ flex: '0 0 110px' }} wrapperCol={{ flex: 1 }}>
          {!editing && (
            <Form.Item name='parentId' label='上级机构'>
              <Select allowClear placeholder='不选则为顶级机构' options={flat.filter((o) => o.id !== undefined).map((o) => ({ value: o.id, label: o.name }))} />
            </Form.Item>
          )}
          <Form.Item name='code' label='机构编码' rules={[{ required: true, message: '请填写编码' }]}>
            <Input disabled={!!editing} />
          </Form.Item>
          <Form.Item name='name' label='机构名称' rules={[{ required: true, message: '请填写名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name='managerName' label='负责人'><Input /></Form.Item>
          <Form.Item name='remark' label='备注'><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </Row>
  )
}