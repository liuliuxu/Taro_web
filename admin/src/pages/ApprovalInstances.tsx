import { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import { Table, Drawer, Button, Space, message, Select, Tag, Input, Descriptions, Timeline, Empty, Modal, DatePicker, InputNumber, Upload, TreeSelect } from 'antd'
import { PlusOutlined, UploadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { get, post, qs, upload } from '../api'
import type { ApprovalInstance, FormDefinition, ApprovalTask, OptionSet, ProcessDefinition } from '../types'
import { StatusTag, approvalStatus, fmtDateTime } from '../meta'
import { confirmAction } from '../confirm'

interface Detail {
  instance: ApprovalInstance
  form?: FormDefinition
  tasks?: ApprovalTask[]
  formData?: Record<string, any>
}

interface FieldWrap {
  key: string
  label: string
  type: string
  required?: boolean
  placeholder?: string
  options?: { label: string; value: string }[]
  optionSetCode?: string
  treeData?: { title: string; value: string; children?: { title: string; value: string }[] }[]
}

export default function ApprovalInstances() {
  const [list, setList] = useState<ApprovalInstance[]>([])
  const [status, setStatus] = useState('')
  const [keyword, setKeyword] = useState('')
  const [detail, setDetail] = useState<Detail | null>(null)
  const [comment, setComment] = useState('')

  // 发起审批（匹配自定义表单）
  const [startOpen, setStartOpen] = useState(false)
  const [startable, setStartable] = useState<ProcessDefinition[]>([])
  const [optionSets, setOptionSets] = useState<OptionSet[]>([])
  const [curProcess, setCurProcess] = useState<ProcessDefinition | null>(null)
  const [curForm, setCurForm] = useState<FormDefinition | null>(null)
  const [fields, setFields] = useState<FieldWrap[]>([])
  const [values, setValues] = useState<Record<string, any>>({})
  const [startTitle, setStartTitle] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function load() {
    try {
      setList(await get<ApprovalInstance[]>('/admin/approval/instances' + qs({ page: 0, pageSize: 100, status, keyword })))
    } catch (e: any) {
      message.error(e?.message)
    }
  }
  useEffect(() => { load() }, [status])

  async function openDetail(id: number) {
    try {
      const d = await get<Detail>(`/approval/detail?id=${id}`)
      setDetail(d)
      setComment('')
    } catch (e: any) {
      message.error(e?.message)
    }
  }

  async function act(action: 'approve' | 'reject') {
    if (!detail) return
    try {
      await post(`/approval/${action}?id=${detail.instance.id}${comment ? `&comment=${encodeURIComponent(comment)}` : ''}`)
      message.success(action === 'approve' ? '已通过' : '已驳回')
      setDetail(null)
      load()
    } catch (e: any) {
      message.error(e?.message)
    }
  }

  async function openStart() {
    try {
      const [spList, sets] = await Promise.all([
        get<ProcessDefinition[]>('/approval/startable'),
        get<OptionSet[]>('/approval/option-sets')
      ])
      setStartable(spList)
      setOptionSets(sets)
      setCurProcess(null)
      setCurForm(null)
      setFields([])
      setValues({})
      setStartTitle('')
      setStartOpen(true)
    } catch (e: any) {
      message.error(e?.message)
    }
  }

  async function selectProcess(p: ProcessDefinition) {
    setCurProcess(p)
    setCurForm(null)
    setFields([])
    setValues({})
    try {
      const f = await get<FormDefinition>(`/approval/form?id=${p.formId}`)
      setCurForm(f)
      const fs = parseFieldList(f.fieldsJson)
      setFields(fs)
      const init: Record<string, any> = {}
      fs.forEach((x) => { init[x.key] = x.type === 'multiple' ? [] : '' })
      setValues(init)
    } catch (e: any) {
      message.error(e?.message)
    }
  }

  function selectProcessInit() {
    setCurProcess(null)
    setCurForm(null)
    setFields([])
    setValues({})
  }

  function setVal(key: string, v: any) {
    setValues((prev) => ({ ...prev, [key]: v }))
  }

  async function doUpload(key: string, file: File) {
    try {
      const res = await upload(file)
      const prev = (values[key] || []) as string[]
      setVal(key, [...prev, res.url])
    } catch (e: any) {
      message.error(e?.message || '上传失败')
    }
    return false
  }

  async function submitStart() {
    if (!curProcess) return
    for (const f of fields) {
      if (f.required) {
        const v = values[f.key]
        const empty = v === '' || v === undefined || v === null || (Array.isArray(v) && v.length === 0)
        if (empty) {
          message.warning(`请填写「${f.label}」`)
          return
        }
      }
    }
    setSubmitting(true)
    try {
      await post('/approval/submit', {
        processId: curProcess.id,
        title: startTitle || undefined,
        bizType: curForm?.bizType || undefined,
        formData: values
      })
      message.success('发起成功')
      setStartOpen(false)
      load()
    } catch (e: any) {
      message.error(e?.message)
    } finally {
      setSubmitting(false)
    }
  }

  function renderField(f: FieldWrap) {
    const v = values[f.key]
    switch (f.type) {
      case 'textarea':
        return (
          <div key={f.key} style={{ marginBottom: 12 }}>
            <div style={{ marginBottom: 4 }}><b>{f.label}{f.required && <span style={{ color: '#ff4d4f' }}>*</span>}</b></div>
            <Input.TextArea rows={3} value={String(v || '')} placeholder={f.placeholder || `请输入${f.label}`}
              onChange={(e) => setVal(f.key, e.target.value)} />
          </div>
        )
      case 'number':
        return (
          <div key={f.key} style={{ marginBottom: 12 }}>
            <div style={{ marginBottom: 4 }}><b>{f.label}{f.required && <span style={{ color: '#ff4d4f' }}>*</span>}</b></div>
            <InputNumber style={{ width: '100%' }} value={v === '' ? undefined : v} placeholder={f.placeholder || '请输入数字'}
              onChange={(n) => setVal(f.key, n ?? '')} />
          </div>
        )
      case 'date':
        return (
          <div key={f.key} style={{ marginBottom: 12 }}>
            <div style={{ marginBottom: 4 }}><b>{f.label}{f.required && <span style={{ color: '#ff4d4f' }}>*</span>}</b></div>
            <DatePicker style={{ width: '100%' }} value={v ? dayjs(String(v)) : undefined}
              onChange={(d) => setVal(f.key, d ? d.format('YYYY-MM-DD') : '')} />
          </div>
        )
      case 'select': {
        const opts = resolveFieldOptions(f, optionSets)
        return (
          <div key={f.key} style={{ marginBottom: 12 }}>
            <div style={{ marginBottom: 4 }}><b>{f.label}{f.required && <span style={{ color: '#ff4d4f' }}>*</span>}</b></div>
            <Select style={{ width: '100%' }} value={v || undefined} placeholder='请选择'
              options={opts.map((o) => ({ value: o.value, label: o.label }))}
              onChange={(val) => setVal(f.key, val)} />
          </div>
        )
      }
      case 'multiple': {
        const opts = resolveFieldOptions(f, optionSets)
        return (
          <div key={f.key} style={{ marginBottom: 12 }}>
            <div style={{ marginBottom: 4 }}><b>{f.label}{f.required && <span style={{ color: '#ff4d4f' }}>*</span>}</b></div>
            <Select mode='multiple' style={{ width: '100%' }} value={Array.isArray(v) ? v : []} placeholder='请选择（可多选）'
              options={opts.map((o) => ({ value: o.value, label: o.label }))}
              onChange={(val) => setVal(f.key, val)} />
          </div>
        )
      }
      case 'upload':
        return (
          <div key={f.key} style={{ marginBottom: 12 }}>
            <div style={{ marginBottom: 4 }}><b>{f.label}</b></div>
            <Upload
              beforeUpload={(file) => doUpload(f.key, file)}
              fileList={(Array.isArray(v) ? v : []).map((url: string, i: number) => ({ uid: String(i), name: url.split('/').pop() || url, status: 'done', url }))}
              onRemove={(file) => setVal(f.key, (v as string[]).filter((_, i) => file.uid !== String(i)))}
            >
              <Button icon={<UploadOutlined />}>上传附件</Button>
            </Upload>
          </div>
        )
      case 'tree': {
        const trees = (f.treeData || [])
        return (
          <div key={f.key} style={{ marginBottom: 12 }}>
            <div style={{ marginBottom: 4 }}><b>{f.label}{f.required && <span style={{ color: '#ff4d4f' }}>*</span>}</b></div>
            <TreeSelect style={{ width: '100%' }} treeData={trees as any} value={v || undefined} placeholder='请选择'
              onChange={(val) => setVal(f.key, val)} treeDefaultExpandAll />
          </div>
        )
      }
      default:
        return (
          <div key={f.key} style={{ marginBottom: 12 }}>
            <div style={{ marginBottom: 4 }}><b>{f.label}{f.required && <span style={{ color: '#ff4d4f' }}>*</span>}</b></div>
            <Input value={String(v ?? '')} placeholder={f.placeholder || `请输入${f.label}`}
              onChange={(e) => setVal(f.key, e.target.value)} />
          </div>
        )
    }
  }

  const columns: ColumnsType<ApprovalInstance> = [
    { title: '审批单号', dataIndex: 'approvalNo', width: 180 },
    { title: '标题', dataIndex: 'title', render: (v) => <b>{v}</b> },
    { title: '流程', dataIndex: 'processId', render: (v, r) => r.title },
    { title: '申请人', dataIndex: 'applicantName' },
    { title: '当前节点', dataIndex: 'currentNodeName' },
    { title: '状态', dataIndex: 'status', render: (s) => <StatusTag status={s} map={approvalStatus} /> },
    { title: '发起时间', dataIndex: 'createdAt', render: fmtDateTime },
    { title: '操作', width: 90, render: (_, r) => <Button type='link' size='small' onClick={() => openDetail(r.id)}>详情</Button> }
  ]

  return (
    <div>
      <Space style={{ marginBottom: 12 }} wrap>
        <Button type='primary' icon={<PlusOutlined />} onClick={openStart}>发起审批</Button>
        <Input.Search placeholder='搜索标题/单号' allowClear style={{ width: 220 }} onSearch={(v) => { setKeyword(v); load() }} />
        <Select placeholder='全部状态' allowClear style={{ width: 130 }}
          options={Object.entries(approvalStatus).map(([k, v]) => ({ value: k, label: v.label }))}
          onChange={(v) => setStatus(v || '')} />
      </Space>
      <Table rowKey='id' dataSource={list} columns={columns} size='small'
        pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 条` }} />

      <Drawer title='审批详情' open={!!detail} onClose={() => setDetail(null)} width={560}>
        {detail && (
          <>
            <Descriptions column={2} size='small' bordered
              items={[
                { key: 'no', label: '审批单号', children: detail.instance.approvalNo },
                { key: 'st', label: '状态', children: <StatusTag status={detail.instance.status} map={approvalStatus} /> },
                { key: 'title', label: '标题', children: detail.instance.title },
                { key: 'applier', label: '申请人', children: detail.instance.applicantName },
                { key: 'node', label: '当前节点', children: detail.instance.currentNodeName || '—' },
                { key: 'ctime', label: '发起时间', children: fmtDateTime(detail.instance.createdAt) }
              ]} />

            <h4 style={{ marginTop: 16 }}>表单数据</h4>
            {fieldsOf(detail.form).length === 0 && <Empty description='无字段' />}
            <Descriptions column={1} size='small' bordered
              items={fieldsOf(detail.form).map((f) => {
                const raw = detail.formData?.[f.key]
                let v: string = raw === undefined || raw === null ? '' : String(raw)
                if (f.type === 'multiple') {
                  const arr = raw === undefined ? [] : Array.isArray(raw) ? raw : String(raw).split(',')
                  v = arr.map(String).join('、')
                }
                if (f.type === 'upload' && Array.isArray(raw)) v = raw.map((u) => (typeof u === 'string' ? u : u.url)).join('、')
                return { key: f.key, label: f.label, children: f.type === 'upload' && v ? <Tag>{v}</Tag> : v || '—' }
              })} />

            <h4 style={{ marginTop: 16 }}>审批节点</h4>
            <Timeline
              items={(detail.tasks || []).map((t) => ({
                color: t.status === 'approved' ? 'green' : t.status === 'rejected' ? 'red' : 'gray',
                children: (
                  <div>
                    <b>{t.nodeName}</b>
                    {t.status === 'pending' ? <Tag style={{ marginLeft: 8 }}>待处理</Tag> : <Tag color={t.status === 'approved' ? 'green' : 'red'}>{t.status === 'approved' ? '已通过' : '已驳回'}</Tag>}
                    <div style={{ color: '#999', fontSize: 12 }}>
                      {t.handledByName ? `${t.handledByName} ${t.handledAt ? '· ' + fmtDateTime(t.handledAt) : ''}` : '等待审批'}
                      {t.comment ? ` · ${t.comment}` : ''}
                    </div>
                  </div>
                )
              }))} />

            {detail.instance.status === 'pending' && (
              <div style={{ marginTop: 16 }}>
                <Input.TextArea rows={2} placeholder='审批意见' value={comment} onChange={(e) => setComment(e.target.value)} />
                <Space style={{ marginTop: 8 }}>
                  <Button type='primary' onClick={() => confirmAction({ title: '确认通过', content: '确定通过该审批单吗？', onOk: () => act('approve') })}>通过</Button>
                  <Button danger onClick={() => confirmAction({ title: '确认驳回', content: '确定驳回该审批单吗？', danger: true, onOk: () => act('reject') })}>驳回</Button>
                </Space>
              </div>
            )}
          </>
        )}
      </Drawer>

      <Modal title='发起审批' open={startOpen} onCancel={() => setStartOpen(false)} width={640}
        onOk={submitStart} okText='提交审批' confirmLoading={submitting}>
        {!curProcess && (
          <div>
            <p style={{ color: '#999', marginBottom: 8 }}>选择审批流程（将按流程匹配的自定义表单填写数据）：</p>
            {startable.length === 0 && <Empty description='暂无已发布且绑定表单的流程，请先在「审批配置」中发布' />}
            <Space wrap>
              {startable.map((p) => (
                <Button key={p.id} onClick={() => selectProcess(p)}>{p.name}</Button>
              ))}
            </Space>
          </div>
        )}
        {curProcess && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <b>{curProcess.name}</b>
              <Button type='link' size='small' onClick={() => selectProcessInit()}>换个流程</Button>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ marginBottom: 4 }}><b>申请标题</b></div>
              <Input value={startTitle} placeholder='不填则使用「流程名+申请」' onChange={(e) => setStartTitle(e.target.value)} />
            </div>
            {fields.length === 0 && <Empty description='该流程未配置表单字段' />}
            {fields.map(renderField)}
          </div>
        )}
      </Modal>
    </div>
  )
}

function fieldsOf(form?: FormDefinition): { key: string; label: string; type: string }[] {
  if (!form?.fieldsJson) return []
  try {
    const v = JSON.parse(form.fieldsJson)
    return Array.isArray(v) ? v.map((f: any) => ({ key: f.key, label: f.label, type: f.type })) : []
  } catch {
    return []
  }
}

function parseFieldList(json?: string): FieldWrap[] {
  if (!json) return []
  try {
    const v = JSON.parse(json)
    return Array.isArray(v) ? v as FieldWrap[] : []
  } catch {
    return []
  }
}

function resolveFieldOptions(f: FieldWrap, sets: OptionSet[]): { label: string; value: string }[] {
  if (f.options?.length) return f.options
  if (f.optionSetCode) {
    const set = sets.find((s) => s.code === f.optionSetCode)
    if (set?.optionsJson) {
      try {
        const v = JSON.parse(set.optionsJson)
        if (Array.isArray(v)) return v
      } catch { /* ignore */ }
    }
  }
  return []
}