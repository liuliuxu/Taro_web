import { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Table, Tag, Typography, Button } from 'antd'
import { get } from '../api'
import type { FinanceData, Machinery, StatsData } from '../types'

export default function Dashboard() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [fin, setFin] = useState<FinanceData | null>(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setErr('')
    try {
      const data = await get<StatsData>('/admin/stats/dashboard')
      setStats(data)
      const f = await get<FinanceData>('/admin/stats/finance')
      setFin(f)
    } catch (e: any) {
      setErr(e?.message || '加载失败')
    }
  }

  if (err) {
    return (
      <Card>
        <Typography.Text type='danger'>仪表盘加载失败：{err}</Typography.Text>
        <Button style={{ marginLeft: 12 }} onClick={load}>重新加载</Button>
      </Card>
    )
  }
  if (!stats) return <Card loading />

  const d = stats.devices || {}
  const p = stats.projects || {}
  const w = stats.workOrders || {}
  const r = stats.rentals || {}
  const cats = stats.deviceCategories || {}
  const catItems = Object.entries(cats).sort((a, b) => b[1] - a[1])

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <Card><Statistic title='设备总数' value={d.total ?? 0} suffix={<Typography.Text type='secondary' style={{ fontSize: 12 }}>可用 {(d.available ?? 0)} · 出租 {(d.rented ?? 0)} · 维修 {(d.maintenance ?? 0)}</Typography.Text>} /></Card>
        </Col>
        <Col xs={12} md={6}>
          <Card><Statistic title='进行中工程' value={p.active ?? 0} suffix={<Typography.Text type='secondary' style={{ fontSize: 12 }}>待启动 {(p.created ?? 0)} · 完工 {(p.finished ?? 0)}</Typography.Text>} /></Card>
        </Col>
        <Col xs={12} md={6}>
          <Card><Statistic title='工单总数' value={w.total ?? 0} suffix={<Typography.Text type='secondary' style={{ fontSize: 12 }}>进行中 {(w.assigned ?? 0) + (w.processing ?? 0)}</Typography.Text>} /></Card>
        </Col>
        <Col xs={12} md={6}>
          <Card><Statistic title='出租中合同' value={r.active ?? 0} suffix={<Typography.Text type='secondary' style={{ fontSize: 12 }}>已归还 {(r.returned ?? 0)}</Typography.Text>} /></Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={12}>
          <Card title='财务报表概览' size='small'>
            {fin ? (
              <Row gutter={[8, 8]}>
                <Col span={12}><Statistic title='租赁应收' value={fin.rentalExpected} precision={2} prefix='¥' /></Col>
                <Col span={12}><Statistic title='租赁实收' value={fin.rentalActual} precision={2} prefix='¥' /></Col>
                <Col span={12}><Statistic title='采购支出' value={fin.purchaseTotal} precision={2} prefix='¥' /></Col>
                <Col span={12}><Statistic title='客户合同额' value={fin.contractTotal} precision={2} prefix='¥' /></Col>
              </Row>
            ) : (
              <Tag>暂无财务数据</Tag>
            )}
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title='设备分类分布' size='small'>
            {catItems.length === 0 ? (
              <Typography.Text type='secondary'>暂无数据</Typography.Text>
            ) : (
              <Table
                size='small'
                pagination={false}
                dataSource={catItems.map(([k, v], i) => ({ key: i, name: k, count: v }))}
                columns={[
                  { title: '分类', dataIndex: 'name' },
                  {
                    title: '台数', dataIndex: 'count',
                    render: (v) => <Tag color='blue'>{v}</Tag>
                  }
                ]}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Card title='维修中设备预警' size='small' style={{ marginTop: 16 }}>
        <Table
          rowKey='id'
          size='small'
          pagination={false}
          dataSource={stats.maintenanceDevices || []}
          columns={[
            { title: '设备名称', dataIndex: 'name' },
            { title: '型号', dataIndex: 'model' },
            { title: '分类', dataIndex: 'category' },
            { title: '状态', dataIndex: 'status', render: (s) => <Tag color='orange'>{s === 'maintenance' ? '维修中' : s}</Tag> },
            { title: '日租金（元）', dataIndex: 'price' }
          ]}
        />
      </Card>
    </div>
  )
}