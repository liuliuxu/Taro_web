import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, InputNumber, Select, Space, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { get, post, qs } from '../api'
import type { Machinery, Pagination, RentalContract } from '../types'
import { StatusTag, rentalStatus, fmtDate, fmtMoney } from '../meta'
import { confirmAction } from '../confirm'
import { useCachedState } from '../useCachedState'

export default function Rentals() {
  const [list, setList] = useState<RentalContract[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useCachedState('rt_page', 1)
  const [pageSize] = useState(10)
  const [status, setStatus] = useCachedState('rt_status', '')
  const [keyword, setKeyword] = useCachedState('rt_keyword', '')
  const [machines, setMachines] = useState<Machinery[]>([])
  const [modal, setModal] = useState(false)
  const [form] = Form.useForm()

  async function load(p: number) {
    setPage(p)
    try {
      const res = await get<Pagination<RentalContract>>('/admin/rentals/list' + qs({ page: p, pageSize, status, keyword }))
      setList(res.list)
      setTotal(res.total)
    } catch (e: any) {
      message.error(e?.message || '加载失败')
    }
  }
  useEffect(() => { load(1) }, [status])

  function openCreate() {
    form.resetFields()
    setModal(true)
    get<Pagination<Machinery>>('/admin/machinery/list' + qs({ page: 1, pageSize: 50, status: 'available' }))
      .then((res) => setMachines(res.list)).catch(() => setMachines([]))
  }
  async function save() {
    const values = await form.validateFields()
    try {
      await post('/admin/rentals', values)
      message.success('创建成功')
      setModal(false)
      load(page)
    } catch (e: any) {
      message.error(e?.message || '创建失败')
    }
  }
  async function handle(r: RentalContract, next: string) {
    await post(`/admin/rentals/${r.id}/handle`, { status: next })
    message.success('已更新')
    load(page)
  }

  const columns: ColumnsType<RentalContract> = [
    { title: '合同号', dataIndex: 'contractNo', width: 170 },
    { title: '设备', dataIndex: 'machineryName', render: (v, r) => <b>{v}</b> },
    { title: '承租单位', dataIndex: 'clientCompany' },
    { title: '联系人', dataIndex: 'clientContact' },
    { title: '租期', render: (_, r) => `${fmtDate(r.startDate)} ~ ${fmtDate(r.endDate)}` },
    { title: '日租金（元）', dataIndex: 'dailyRate', render: fmtMoney },
    { title: '合计（元）', dataIndex: 'totalAmount', render: (v) => <b>{fmtMoney(v)}</b> },
    { title: '状态', dataIndex: 'status', render: (s) => <StatusTag status={s} map={rentalStatus} /> },
    {
      title: '操作', width: 160,
      render: (_, r) =>
        r.status === 'active' ? (
          <Space size={0}>
            <Button type='link' size='small' onClick={() => confirmAction({ title: '确认归还', content: `确认设备「${r.machineryName}」已完成归还？`, onOk: () => handle(r, 'returned') })}>归还</Button>
            <Button type='link' size='small' danger onClick={() => confirmAction({ title: '确认取消', content: `确认取消租赁合同「${r.contractNo}」？`, danger: true, onOk: () => handle(r, 'cancelled') })}>取消</Button>
          </Space>
        ) : <span style={{ color: '#999' }}>—</span>
    }
  ]

  return (
    <div>
      <Space style={{ marginBottom: 12 }} wrap>
        <Input.Search placeholder='搜索合同号/设备/承租单位' allowClear style={{ width: 240 }} onSearch={(v) => { setKeyword(v); load(1) }} />
        <Select placeholder='全部状态' allowClear style={{ width: 130 }}
          options={Object.entries(rentalStatus).map(([k, v]) => ({ value: k, label: v.label }))}
          onChange={(v) => setStatus(v || '')} />
        <Button type='primary' icon={<PlusOutlined />} onClick={openCreate}>新建租赁</Button>
      </Space>
      <Table rowKey='id' dataSource={list} columns={columns} size='small'
        pagination={{ current: page, pageSize, total, showTotal: (t) => `共 ${t} 份` }}
        onChange={(pg) => load(pg.current || 1)} />
      <Modal title='新建租赁合同' open={modal} onOk={save} onCancel={() => setModal(false)} destroyOnClose width={640}>
        <Form form={form} labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
          <Form.Item name='machineryId' label='租赁设备' rules={[{ required: true, message: '请选择设备' }]}>
            <Select showSearch optionFilterProp='label'
              options={machines.map((m) => ({ value: m.id, label: `${m.name}（${m.model || m.category}）· ${fmtMoney(m.price)} 元/天` }))} />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name='clientCompany' label='承租单位' rules={[{ required: true, message: '请填写承租单位' }]}><Input /></Form.Item>
            <Form.Item name='dailyRate' label='日租金（元）' rules={[{ required: true, message: '请填写日租金' }]}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
            <Form.Item name='clientContact' label='联系人'><Input /></Form.Item>
            <Form.Item name='clientPhone' label='联系电话'><Input /></Form.Item>
            <Form.Item name='deposit' label='押金（元）'><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
            <Form.Item name='endDate' label='预计归还日期'><Input type='date' /></Form.Item>
          </div>
          <Form.Item name='startDate' label='起租日期'><Input type='date' /></Form.Item>
          <Form.Item name='note' label='备注'><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}