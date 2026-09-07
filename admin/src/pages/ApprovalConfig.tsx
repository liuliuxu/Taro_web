import { useState, useEffect } from 'react'
import { Tabs, Table, Button, Modal, Form, Input, Select, Space, message, Popconfirm, Switch, Tag } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { get, post, del } from '../api'
import type { OptionSet, FormDefinition, ProcessDefinition, Org, Pagination, User } from '../types'

interface FieldDef { key: string; label: string; type: string; required?: boolean; options?: { label: string; value: string }[]; optionSetCode?: string }
interface NodeDef { name: string; approverType: string; approverValue: string }

const FIELD_TYPES = [
  { value: 'input', label: '单行文本' },
  { value: 'textarea', label: '多行文本' },
  { value: 'number', label: '数字' },
  { value: 'date', label: '日期' },
  { value: 'select', label: '下拉单选' },
  { value: 'multiple', label: '多选' },
  { value: 'upload', label: '附件上传' },
  { value: 'tree', label: '树形选择' }
]

export default function ApprovalConfig() {
  const [tab, setTab] = useState('process')
  const [optionSets, setOptionSets] = useState<OptionSet[]>([])
  const [forms, setForms] = useState<FormDefinition[]>([])
  const [processes, setProcesses] = useState<ProcessDefinition[]>([])
  const [orgs, setOrgs] = useState<Org[]>([])
  const [users, setUsers] = useState<User[]>([])

  function loadAll() {
    get<OptionSet[]>('/admin/approval/option-sets').then(setOptionSets).catch(() => {})
    get<FormDefinition[]>('/admin/approval/forms').then(setForms).catch(() => {})
    get<ProcessDefinition[]>('/admin/approval/processes').then(setProcesses).catch(() => {})
    get<Org[]>('/admin/orgs/list').then((o) => setOrgs(o.filter((x) => x.status !== 'disabled'))).catch(() => {})
    get<User[]>('/admin/users/list').then(setUsers).catch(() => {})
  }
  useEffect(() => { loadAll() }, [])

  const [osModal, setOsModal] = useState(false)
  const [osForm] = Form.useForm()
  async function saveOptionSet() {
    const v = await osForm.validateFields()
    try {
      parseJsonArray(v.optionsJson, '选项内容')
      await post('/admin/approval/option-sets', v)
      message.success('保存成功')
      setOsModal(false)
      loadAll()
    } catch (e: any) {
      message.error(e?.message)
    }
  }

  const [formModal, setFormModal] = useState(false)
  const [fields, setFields] = useState<FieldDef[]>([])
  const [formMeta, setFormMeta] = useState<FormDefinition | null>(null)
  const [fform] = Form.useForm()
  function openFormCreate() {
    setFormMeta(null)
    fform.resetFields()
    setFields([{ key: '', label: '', type: 'input', required: false }])
    setFormModal(true)
  }
  function openFormEdit(f: FormDefinition) {
    setFormMeta(f)
    fform.setFieldsValue(f)
    setFields(parseJsonArray(f.fieldsJson || '[]', '字段配置'))
    setFormModal(true)
  }
  async function saveForm() {
    const v = await fform.validateFields()
    if (!fields.length) { message.warning('请至少配置一个字段'); return }
    try {
      await post('/admin/approval/forms', {
        id: formMeta?.id,
        name: v.name,
        bizType: v.bizType || v.name,
        remark: v.remark,
        fieldsJson: JSON.stringify(fields)
      })
      message.success('保存成功')
      setFormModal(false)
      loadAll()
    } catch (e: any) {
      message.error(e?.message)
    }
  }

  const [procModal, setProcModal] = useState(false)
  const [nodes, setNodes] = useState<NodeDef[]>([])
  const [procMeta, setProcMeta] = useState<ProcessDefinition | null>(null)
  const [pform] = Form.useForm()
  function openProcCreate() {
    setProcMeta(null)
    pform.resetFields()
    setNodes([{ name: '', approverType: 'role', approverValue: 'manager' }])
    setProcModal(true)
  }
  function openProcEdit(p: ProcessDefinition) {
    setProcMeta(p)
    pform.setFieldsValue(p)
    setNodes((parseJsonArray(p.nodesJson || '[]', '节点配置') as any[]).map((n) => ({
      name: n.name || '', approverType: n.approverType || 'role', approverValue: String(n.approverValue ?? '')
    })))
    setProcModal(true)
  }
  async function saveProcess() {
    const v = await pform.validateFields()
    const clean = nodes.map((n, i) => ({
      index: i,
      name: n.name?.trim(),
      approverType: n.approverType,
      approverValue: String(n.approverValue ?? '').trim()
    })).filter((n) => n.name && (n.approverType === 'all' || n.approverValue))
    if (!clean.length) { message.warning('请至少配置一个审批节点'); return }
    try {
      await post('/admin/approval/processes', {
        id: procMeta?.id,
        name: v.name,
        formId: v.formId,
        remark: v.remark,
        nodesJson: JSON.stringify(clean)
      })
      message.success('保存成功')
      setProcModal(false)
      loadAll()
    } catch (e: any) {
      message.error(e?.message)
    }
  }
  async function togglePublish(p: ProcessDefinition) {
    await post(`/admin/approval/processes/${p.id}/${p.status === 'published' ? 'unpublish' : 'publish'}`)
    message.success(p.status === 'published' ? '已下线' : '已发布')
    loadAll()
  }

  return (
    <>
      <Tabs activeKey={tab} onChange={setTab}
        items={[
        {
          key: 'process', label: '流程定义', children: (
            <div>
              <Space style={{ marginBottom: 12 }}>
                <Button type='primary' icon={<PlusOutlined />} onClick={openProcCreate}>新建流程</Button>
              </Space>
              <Table rowKey='id' size='small' pagination={false} dataSource={processes}
                columns={[
                  { title: '流程名称', dataIndex: 'name', render: (v, p) => <b>{v}</b> },
                  { title: '关联表单', dataIndex: 'formId', render: (id) => forms.find((f) => f.id === id)?.name || '—' },
                  {
                    title: '审批节点', dataIndex: 'nodesJson', render: (json) => {
                      const ns = parseJsonArray(json || '[]', '节点配置') as any[]
                      return <Space size={4} wrap>{ns.map((n, i) => <Tag key={i}>{n.name}</Tag>)}</Space>
                    }
                  },
                  { title: '状态', dataIndex: 'status', render: (s) => <Tag color={s === 'published' ? 'green' : 'default'}>{s === 'published' ? '已发布' : '草稿'}</Tag> },
                  {
                    title: '操作', width: 240,
                    render: (_, p) => (
                      <Space size={0}>
                        <Button type='link' size='small' onClick={() => openProcEdit(p)}>编辑</Button>
                        <Button type='link' size='small' onClick={() => togglePublish(p)}>{p.status === 'published' ? '下线' : '发布'}</Button>
                        <Popconfirm title='确认删除？' onConfirm={async () => { await del(`/admin/approval/processes/${p.id}`); message.success('已删除'); loadAll() }}>
                          <Button type='link' size='small' danger>删除</Button>
                        </Popconfirm>
                      </Space>
                    )
                  }
                ]} />
            </div>
          )
        },
        {
          key: 'form', label: '动态表单', children: (
            <div>
              <Space style={{ marginBottom: 12 }}>
                <Button type='primary' icon={<PlusOutlined />} onClick={openFormCreate}>新建表单</Button>
              </Space>
              <Table rowKey='id' size='small' pagination={false} dataSource={forms}
                columns={[
                  { title: '表单名称', dataIndex: 'name', render: (v) => <b>{v}</b> },
                  { title: '业务类型', dataIndex: 'bizType' },
                  {
                    title: '字段', dataIndex: 'fieldsJson', render: (json) => {
                      const fs = parseJsonArray(json || '[]', '字段配置')
                      return <Space size={4} wrap>{fs.map((f, i) => <Tag key={i}>{f.label}</Tag>)}</Space>
                    }
                  },
                  { title: '说明', dataIndex: 'remark' },
                  {
                    title: '操作', width: 160,
                    render: (_, f) => (
                      <Space size={0}>
                        <Button type='link' size='small' onClick={() => openFormEdit(f)}>编辑</Button>
                        <Popconfirm title='确认删除？' onConfirm={async () => { await del(`/admin/approval/forms/${f.id}`); message.success('已删除'); loadAll() }}>
                          <Button type='link' size='small' danger>删除</Button>
                        </Popconfirm>
                      </Space>
                    )
                  }
                ]} />
            </div>
          )
        },
        {
          key: 'optionset', label: '选项集', children: (
            <div>
              <Space style={{ marginBottom: 12 }}>
                <Button type='primary' icon={<PlusOutlined />} onClick={() => { osForm.resetFields(); setOsModal(true) }}>新建选项集</Button>
              </Space>
              <Table rowKey='id' size='small' pagination={false} dataSource={optionSets}
                columns={[
                  { title: '编码', dataIndex: 'code', render: (v) => <b>{v}</b> },
                  { title: '名称', dataIndex: 'name' },
                  {
                    title: '选项', dataIndex: 'optionsJson', render: (json) => {
                      const os = parseJsonArray(json || '[]', '选项内容')
                      return <Space size={4} wrap>{os.map((o, i) => <Tag key={i}>{o.label}</Tag>)}</Space>
                    }
                  },
                  { title: '说明', dataIndex: 'remark' },
                  {
                    title: '操作', width: 160,
                    render: (_, o) => (
                      <Space size={0}>
                        <Button type='link' size='small' onClick={() => { osForm.setFieldsValue(o); setOsModal(true) }}>编辑</Button>
                        <Popconfirm title='确认删除？' onConfirm={async () => { await del(`/admin/approval/option-sets/${o.id}`); message.success('已删除'); loadAll() }}>
                          <Button type='link' size='small' danger>删除</Button>
                        </Popconfirm>
                      </Space>
                    )
                  }
                ]} />
            </div>
          )
        }
      ]} />

      <Modal title='选项集' open={osModal} onOk={saveOptionSet} onCancel={() => setOsModal(false)} destroyOnClose width={560}>
        <Form form={osForm} layout='vertical'>
          <Form.Item name='code' label='编码' rules={[{ required: true, message: '请填写编码' }]}><Input /></Form.Item>
          <Form.Item name='name' label='名称' rules={[{ required: true, message: '请填写名称' }]}><Input /></Form.Item>
          <Form.Item name='optionsJson' label='选项（JSON）' extra='格式：[{"label":"设备部","value":"equipment"}]'
            rules={[{ required: true, message: '请填写选项' }]}>
            <Input.TextArea rows={5} />
          </Form.Item>
          <Form.Item name='remark' label='说明'><Input /></Form.Item>
        </Form>
      </Modal>

      <Modal title={formMeta ? '编辑表单' : '新建表单'} open={formModal} onOk={saveForm} onCancel={() => setFormModal(false)} width={820}>
        <Form form={fform} layout='vertical'>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name='name' label='表单名称' rules={[{ required: true, message: '请填写名称' }]}><Input /></Form.Item>
            <Form.Item name='bizType' label='业务类型（回调用：purchase/rental/workorder_cost/disposal）'><Input /></Form.Item>
          </div>
          <Form.Item name='remark' label='说明'><Input /></Form.Item>
        </Form>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <b>字段配置</b>
          <Button size='small' type='dashed' icon={<PlusOutlined />} onClick={() => setFields([...fields, { key: '', label: '', type: 'input', required: false }])}>添加字段</Button>
        </div>
        {fields.map((f, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 120px 90px 90px 60px', gap: 8,
            alignItems: 'center', marginBottom: 8, background: '#fafafa', padding: 8, borderRadius: 6
          }}>
            <Input placeholder='字段KEY' value={f.key} onChange={(e) => setFields(fields.map((x, j) => j === i ? { ...x, key: e.target.value } : x))} />
            <Input placeholder='字段标题' value={f.label} onChange={(e) => setFields(fields.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} />
            <Select value={f.type} options={FIELD_TYPES} onChange={(t) => setFields(fields.map((x, j) => j === i ? { ...x, type: t } : x))} />
            {(f.type === 'select' || f.type === 'multiple') && (
              <Select placeholder='选项集' allowClear value={f.optionSetCode}
                onChange={(c) => setFields(fields.map((x, j) => j === i ? { ...x, optionSetCode: c } : x))}
                options={optionSets.map((o) => ({ value: o.code, label: o.code }))} />
            )}
            {(f.type === 'select' || f.type === 'multiple') && <span style={{ fontSize: 12, color: '#999' }}>或</span>}
            <Input placeholder='内联选项a,b' value={(f.options || []).map((o) => o.label).join(',')}
              onChange={(e) => setFields(fields.map((x, j) => j === i ? { ...x, options: e.target.value ? e.target.value.split(',').map((s) => ({ label: s.trim(), value: s.trim() })) : undefined } : x))} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              必填<Switch size='small' checked={!!f.required} onChange={(c) => setFields(fields.map((x, j) => j === i ? { ...x, required: c } : x))} />
              <Button type='text' size='small' danger icon={<DeleteOutlined />} onClick={() => setFields(fields.filter((_, j) => j !== i))} />
            </div>
          </div>
        ))}
      </Modal>

      <Modal title={procMeta ? '编辑流程' : '新建流程'} open={procModal} onOk={saveProcess} onCancel={() => setProcModal(false)} width={720}>
        <Form form={pform} layout='vertical'>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name='name' label='流程名称' rules={[{ required: true, message: '请填写名称' }]}><Input /></Form.Item>
            <Form.Item name='formId' label='关联表单' rules={[{ required: true, message: '请选择表单' }]}>
              <Select options={forms.map((f) => ({ value: f.id, label: f.name }))} />
            </Form.Item>
          </div>
          <Form.Item name='remark' label='说明'><Input /></Form.Item>
        </Form>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <b>审批节点（按顺序执行）</b>
          <Button size='small' type='dashed' icon={<PlusOutlined />} onClick={() => setNodes([...nodes, { name: '', approverType: 'role', approverValue: 'manager' }])}>添加节点</Button>
        </div>
        {nodes.map((n, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 160px 200px 60px', gap: 8, alignItems: 'center', marginBottom: 8, background: '#fafafa', padding: 8, borderRadius: 6 }}>
            <Input placeholder='节点名称' value={n.name} onChange={(e) => setNodes(nodes.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
            <Select value={n.approverType} onChange={(t) => setNodes(nodes.map((x, j) => j === i ? { ...x, approverType: t, approverValue: t === 'role' ? 'manager' : t === 'org' ? '' : '' } : x))}
              options={[
                { value: 'role', label: '按角色' },
                { value: 'org', label: '按机构' },
                { value: 'user', label: '指定用户' }
              ]} />
            {n.approverType === 'role' && (
              <Select value={n.approverValue} onChange={(v) => setNodes(nodes.map((x, j) => j === i ? { ...x, approverValue: v } : x))}
                options={[{ value: 'manager', label: '设备负责人(manager)' }, { value: 'admin', label: '管理员(admin)' }, { value: 'operator', label: '作业人员(operator)' }]} />
            )}
            {n.approverType === 'org' && (
              <Select showSearch optionFilterProp='label' value={n.approverValue || undefined} placeholder='选择机构'
                onChange={(v) => setNodes(nodes.map((x, j) => j === i ? { ...x, approverValue: v } : x))}
                options={orgs.map((o) => ({ value: String(o.id), label: o.name }))} />
            )}
            {n.approverType === 'user' && (
              <Select mode='multiple' value={n.approverValue ? n.approverValue.split(',') : []} placeholder='选择用户'
                onChange={(v) => setNodes(nodes.map((x, j) => j === i ? { ...x, approverValue: (v as string[]).join(',') } : x))}
                options={users.map((u) => ({ value: String(u.id), label: u.nickname || u.username }))} />
            )}
            <Button type='text' size='small' danger icon={<DeleteOutlined />} onClick={() => setNodes(nodes.filter((_, j) => j !== i))} />
          </div>
        ))}
      </Modal>
    </>
  )
}

function parseJsonArray(s: string, label: string): any[] {
  try {
    const v = JSON.parse(s || '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}