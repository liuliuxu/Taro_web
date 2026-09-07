import { useEffect, useRef, useState } from 'react'
import { Card, Row, Col, Typography } from 'antd'
import * as echarts from 'echarts'
import { get } from '../api'
import type { ChartsData } from '../types'
import { useThemeCtx } from '../theme'

const PALETTE = ['#FF6B1A', '#0EA5E9', '#22C55E', '#8B5CF6', '#F59E0B', '#F43F5E', '#14B8A6', '#6366F1', '#F97316', '#84CC16']
const STATUS_LABEL: Record<string, string> = {
  created: '待派单',
  assigned: '待处理',
  processing: '处理中',
  review: '待验收',
  done: '已完成',
  cancelled: '已取消',
  pending: '待审批',
  approved: '已审批',
  rejected: '已驳回',
  paid: '已付款',
  received: '已入库',
  active: '进行中',
  finished: '已完工',
  returned: '已归还',
  draft: '草稿'
}

function Chart({ option, height = 260 }: { option: echarts.EChartsOption; height?: number }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const chart = echarts.init(ref.current)
    chart.setOption(option)
    const onResize = () => chart.resize()
    window.addEventListener('resize', onResize)
    const ro = new ResizeObserver(() => chart.resize())
    ro.observe(ref.current)
    return () => {
      window.removeEventListener('resize', onResize)
      ro.disconnect()
      chart.dispose()
    }
  }, [option])

  return <div ref={ref} style={{ width: '100%', height }} />
}

export default function Charts() {
  const [data, setData] = useState<ChartsData | null>(null)
  const [err, setErr] = useState('')
  const { settings } = useThemeCtx()
  const ORANGE = settings.color

  useEffect(() => {
    get<ChartsData>('/admin/stats/charts').then(setData).catch((e) => setErr(e?.message || '加载失败'))
  }, [])

  if (err) return <Typography.Text type='danger'>图表数据加载失败：{err}</Typography.Text>
  if (!data) return <Card loading />

  const d = data
  const pie = (rows: [string, number][], name: string) => ({
    tooltip: { trigger: 'item' as const },
    legend: { bottom: 0, type: 'scroll' },
    color: PALETTE,
    series: [{
      type: 'pie' as const,
      radius: ['42%', '68%'],
      center: ['50%', '45%'],
      label: { show: false },
      data: rows.map(([n, v]) => ({ name: STATUS_LABEL[n] || n, value: v })).filter((x) => x.value > 0)
    }]
  })

  const bar = (rows: [string, number][], name: string, horizontal = false) => ({
    tooltip: { trigger: 'axis' as const },
    grid: { left: horizontal ? 90 : 8, right: 12, top: 30, bottom: 8, containLabel: true },
    xAxis: horizontal
      ? { type: 'value' as const, axisLabel: { color: '#999' } }
      : { type: 'category' as const, data: rows.map(([n]) => STATUS_LABEL[n] || n), axisLabel: { color: '#999' } },
    yAxis: horizontal
      ? { type: 'category' as const, data: rows.map(([n]) => STATUS_LABEL[n] || n), axisLabel: { color: '#999' } }
      : { type: 'value' as const, axisLabel: { color: '#999' } },
    series: [{
      name,
      type: 'bar' as const,
      data: rows.map(([, v]) => v),
      itemStyle: { color: ORANGE, borderRadius: horizontal ? [0, 6, 6, 0] : [6, 6, 0, 0] },
      barMaxWidth: 28
    }]
  })

  const line = (rows: { month: string; count: number }[], name: string) => ({
    tooltip: { trigger: 'axis' as const },
    grid: { left: 8, right: 8, top: 30, bottom: 8, containLabel: true },
    xAxis: { type: 'category' as const, data: rows.map((r) => r.month), axisLabel: { color: '#999' } },
    yAxis: { type: 'value' as const, axisLabel: { color: '#999' } },
    series: [{
      name,
      type: 'line' as const,
      smooth: true,
      data: rows.map((r) => r.count),
      itemStyle: { color: ORANGE },
      areaStyle: { color: 'rgba(255,107,26,0.15)' },
      symbolSize: 6
    }]
  })

  const amountBar = (rows: { month: string; amount: number }[]) => ({
    tooltip: { trigger: 'axis' as const, valueFormatter: (v: number) => `¥${(v || 0).toFixed(2)}万` },
    grid: { left: 8, right: 8, top: 30, bottom: 8, containLabel: true },
    xAxis: { type: 'category' as const, data: rows.map((r) => r.month), axisLabel: { color: '#999' } },
    yAxis: { type: 'value' as const, axisLabel: { color: '#999' } },
    series: [{
      name: '采购金额（元）', type: 'bar' as const,
      data: rows.map((r) => r.amount),
      itemStyle: { color: '#0EA5E9', borderRadius: [6, 6, 0, 0] },
      barMaxWidth: 28
    }]
  })

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title='设备分类分布' size='small'>
            <Chart option={pie(Object.entries(d.deviceCategory || {}), '设备')} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title='设备品牌分布' size='small'>
            <Chart option={bar(Object.entries(d.deviceBrand || {}).sort((a, b) => a[0].localeCompare(b[0])), '品牌', true)} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title='工单状态分布' size='small'>
            <Chart option={bar((d.workOrderByStatus || []).map((s) => [s.status, s.count]), '工单')} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title='工单近6月新增趋势' size='small'>
            <Chart option={line(d.workOrderByMonth || [], '新增工单')} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title='工程项目状态' size='small'>
            <Chart option={pie(Object.entries(d.projectByStatus || {}), '工程')} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title='租赁合同状态' size='small'>
            <Chart option={pie(Object.entries(d.rentalByStatus || {}), '租赁')} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title='客户合同状态' size='small'>
            <Chart option={pie(Object.entries(d.contractByStatus || {}), '合同')} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title='采购申请状态分布' size='small'>
            <Chart option={bar(Object.entries(d.purchaseByStatus || {}), '采购')} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title='采购近6月金额' size='small'>
            <Chart option={amountBar(d.purchaseByMonth || [])} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title='审批实例状态分布' size='small'>
            <Chart option={pie(Object.entries(d.approvalByStatus || {}), '审批')} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title='审批近6月发起趋势' size='small'>
            <Chart option={line(d.approvalByMonth || [], '审批数量')} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title='库存货值（按分类）' size='small'>
            <Chart option={bar(Object.entries(d.stockValueByCategory || {}).map(([k, v]) => [k, Math.round(v)]), '货值', true)} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title='供应商品类分布' size='small'>
            <Chart option={bar(Object.entries(d.supplierByCategory || {}), '供应商')} />
          </Card>
        </Col>
      </Row>
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={12}>
          <Card title='用户角色分布' size='small'>
            <Chart option={pie(Object.entries(d.userByRole || {}), '用户')} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title='机构总数' size='small'>
            <div style={{ fontSize: 56, fontWeight: 800, color: ORANGE }}>{d.orgCount ?? 0}</div>
            <Typography.Text type='secondary'>当前可见组织架构节点</Typography.Text>
          </Card>
        </Col>
      </Row>
    </div>
  )
}