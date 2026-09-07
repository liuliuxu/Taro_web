import { useState, useEffect } from 'react'
import { Table, Drawer, Button, Space, message, Select, Tag, Input, Descriptions, Timeline, Empty } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { get, post, qs } from '../api'
import type { ApprovalInstance, FormDefinition, ApprovalTask } from '../types'
import { StatusTag, approvalStatus, fmtDateTime } from '../meta'
import { confirmAction } from '../confirm'

interface Detail {
  instance: ApprovalInstance
  form?: FormDefinition
  tasks?: ApprovalTask[]
  formData?: Record<string, any>
}

export default function ApprovalInstances() {
  const [list, setList] = useState<ApprovalInstance[]>([])
  const [status, setStatus] = useState('')
  const [keyword, setKeyword] = useState('')
  const [detail, setDetail] = useState<Detail | null>(null)
  const [comment, setComment] = useState('')

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