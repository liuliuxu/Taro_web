import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ConfigProvider, theme, Tabs, Table, Tag, Tree, Select, Input, Button, Tooltip,
  Steps, Segmented, Spin, Empty, message
} from 'antd'
import {
  AppstoreOutlined, CheckCircleOutlined, SwapOutlined, ToolOutlined, FileTextOutlined,
  SyncOutlined, AuditOutlined, ProjectOutlined, AimOutlined, HeatMapOutlined,
  NodeIndexOutlined, TagOutlined, UndoOutlined, ZoomInOutlined, ZoomOutOutlined,
  EnvironmentOutlined, ScheduleOutlined
} from '@ant-design/icons'
import * as echarts from 'echarts'
import { useNavigate } from 'react-router-dom'
import { get, qs } from '../api'
import type { Machinery, WorkOrder, StatsData, ChartsData, Pagination } from '../types'
import { useThemeCtx } from '../theme'
import TwinScene, { TWIN_ZONES, STATUS_META, zoneOfMachine } from './TwinScene'
import styles from './DigitalTwin.module.css'

const WO_STATUS: Record<string, { label: string; color: string }> = {
  created: { label: '待派单', color: 'orange' },
  assigned: { label: '待处理', color: 'gold' },
  processing: { label: '处理中', color: 'blue' },
  review: { label: '待验收', color: 'purple' },
  done: { label: '已完成', color: 'green' },
  cancelled: { label: '已取消', color: 'default' },
}

/* KPI 卡片旁的迷你趋势线 */
function Spark({ seed, color }: { seed: number; color: string }) {
  const pts = Array.from({ length: 14 }, (_, i) => {
    const v = Math.sin(seed * 2.7 + i * 0.8) * 0.5 + 0.5
    return `${(i / 13) * 64},${20 - v * 14}`
  }).join(' ')
  return (
    <svg width={64} height={22} className={styles.kpiSpark}>
      <polyline points={pts} fill='none' stroke={color} strokeWidth={1.5} opacity={0.85} />
    </svg>
  )
}

function ChartBox({ title, option }: { title: string; option: echarts.EChartsOption }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current) return
    const chart = echarts.init(ref.current)
    chart.setOption(option)
    const ro = new ResizeObserver(() => chart.resize())
    ro.observe(ref.current)
    return () => { ro.disconnect(); chart.dispose() }
  }, [option])
  return (
    <div className={styles.chartPanel}>
      <div className={styles.chartTitle}>{title}</div>
      <div ref={ref} style={{ width: '100%', height: 196 }} />
    </div>
  )
}

export default function DigitalTwin() {
  const navigate = useNavigate()
  const { settings } = useThemeCtx()

  const [machines, setMachines] = useState<Machinery[]>([])
  const [stats, setStats] = useState<StatsData | null>(null)
  const [charts, setCharts] = useState<ChartsData | null>(null)
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)

  // 筛选条件
  const [keyword, setKeyword] = useState('')
  const [zoneKey, setZoneKey] = useState<string>('all')
  const [catFilter, setCatFilter] = useState<string | undefined>()
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [brandFilter, setBrandFilter] = useState<string | undefined>()

  // 场景交互
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [showRoutes, setShowRoutes] = useState(true)
  const [showOverlay, setShowOverlay] = useState(true)
  const [showLabels, setShowLabels] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [focusTick, setFocusTick] = useState(0)

  useEffect(() => {
    Promise.all([
      get<Pagination<Machinery>>('/admin/machinery/list' + qs({ page: 1, pageSize: 200 })),
      get<StatsData>('/admin/stats/dashboard').catch(() => null),
      get<ChartsData>('/admin/stats/charts').catch(() => null),
      get<Pagination<WorkOrder>>('/admin/workorders/list' + qs({ page: 1, pageSize: 100 })).catch(() => null),
    ]).then(([m, s, c, w]) => {
      setMachines(m.list)
      setStats(s)
      setCharts(c)
      setWorkOrders(w?.list || [])
    }).catch(e => message.error(e?.message || '加载孪生数据失败'))
      .finally(() => setLoading(false))
  }, [])

  /* ===== 派生数据 ===== */
  const filtered = useMemo(() => machines.filter(m => {
    if (keyword && !(m.name.includes(keyword) || m.model.includes(keyword) || String(m.id).includes(keyword))) return false
    if (zoneKey !== 'all' && zoneOfMachine(m).key !== zoneKey) return false
    if (catFilter && m.category !== catFilter) return false
    if (statusFilter && m.status !== statusFilter) return false
    if (brandFilter && m.brand !== brandFilter) return false
    return true
  }), [machines, keyword, zoneKey, catFilter, statusFilter, brandFilter])

  const selected = useMemo(() => machines.find(m => m.id === selectedId) || null, [machines, selectedId])
  const selectedOrders = useMemo(() => workOrders.filter(w => w.machineryId === selectedId).slice(0, 4), [workOrders, selectedId])

  const countBy = (fn: (m: Machinery) => boolean) => machines.filter(fn).length
  const categoryOptions = useMemo(() => Array.from(new Set(machines.map(m => m.category))).map(c => ({ value: c, label: c })), [machines])
  const brandOptions = useMemo(() => Array.from(new Set(machines.map(m => m.brand).filter(Boolean))).map(b => ({ value: b, label: b })), [machines])

  const treeData = useMemo(() => [{
    key: 'all',
    title: `全部设备（${machines.length}）`,
    children: TWIN_ZONES.map(z => {
      const inZone = machines.filter(m => zoneOfMachine(m).key === z.key)
      const cats = Array.from(new Set(inZone.map(m => m.category)))
      return {
        key: `zone:${z.key}`,
        title: `${z.name}（${inZone.length}）`,
        children: cats.map(c => ({
          key: `zone:${z.key}/cat:${c}`,
          title: `${c}（${inZone.filter(m => m.category === c).length}）`,
        })),
      }
    }),
  }], [machines])

  const treeSelectedKey = useMemo(() => {
    if (catFilter && zoneKey !== 'all') return `zone:${zoneKey}/cat:${catFilter}`
    if (zoneKey !== 'all') return `zone:${zoneKey}`
    return 'all'
  }, [zoneKey, catFilter])

  const kpis = useMemo(() => {
    const wo = stats?.workOrders
    return [
      { label: '设备总数', value: machines.length, color: '#4096ff', icon: <AppstoreOutlined /> },
      { label: '可用', value: countBy(m => m.status === 'available'), color: '#22c55e', icon: <CheckCircleOutlined /> },
      { label: '租用中', value: countBy(m => m.status === 'rented'), color: '#38bdf8', icon: <SwapOutlined /> },
      { label: '维护中', value: countBy(m => m.status === 'maintenance'), color: '#f59e0b', icon: <ToolOutlined /> },
      { label: '工单总数', value: wo?.total ?? 0, color: '#a78bfa', icon: <FileTextOutlined /> },
      { label: '工单处理中', value: (wo?.created ?? 0) + (wo?.assigned ?? 0) + (wo?.processing ?? 0), color: '#fb923c', icon: <SyncOutlined /> },
      { label: '待验收', value: wo?.review ?? 0, color: '#f43f5e', icon: <AuditOutlined /> },
      { label: '在建项目', value: stats?.projects?.active ?? 0, color: '#22d3ee', icon: <ProjectOutlined /> },
    ]
  }, [machines, stats])

  /* ===== 图表配置 ===== */
  const funnelOption = useMemo<echarts.EChartsOption>(() => ({
    tooltip: { trigger: 'item', formatter: '{b}: {c} 台' },
    series: [{
      type: 'funnel',
      top: 8, bottom: 8, left: '12%', width: '76%',
      minSize: '30%',
      label: { position: 'inside', color: '#fff', fontSize: 11, formatter: '{b} {c}' },
      itemStyle: { borderColor: 'rgba(7,17,32,.8)', borderWidth: 1 },
      data: Object.entries(STATUS_META)
        .map(([k, v]) => ({ name: v.label, value: countBy(m => m.status === k), itemStyle: { color: v.color } }))
        .sort((a, b) => b.value - a.value),
    }],
  }), [machines])

  const trendOption = useMemo<echarts.EChartsOption>(() => {
    const rows = charts?.workOrderByMonth || []
    return {
      tooltip: { trigger: 'axis' },
      grid: { top: 24, left: 34, right: 12, bottom: 22 },
      xAxis: {
        type: 'category', data: rows.map(r => r.month),
        axisLine: { lineStyle: { color: 'rgba(120,160,210,.3)' } },
        axisLabel: { color: '#8fa6c0', fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: 'rgba(120,160,210,.14)' } },
        axisLabel: { color: '#8fa6c0', fontSize: 10 },
      },
      series: [{
        type: 'line', smooth: true, symbolSize: 5,
        data: rows.map(r => r.count),
        lineStyle: { color: '#4096ff', width: 2 },
        itemStyle: { color: '#7cc0ff' },
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(64,150,255,.35)' }, { offset: 1, color: 'rgba(64,150,255,0)' },
        ]) },
      }],
    }
  }, [charts])

  /* ===== 交互 ===== */
  const resetFilters = () => { setKeyword(''); setZoneKey('all'); setCatFilter(undefined); setStatusFilter(undefined); setBrandFilter(undefined) }
  const locate = () => {
    if (!selected) { message.info('请先在场景或列表中选中一台设备'); return }
    if (!filtered.some(m => m.id === selected.id)) resetFilters()
    setFocusTick(t => t + 1)
  }
  const resetView = () => { setZoom(1); resetFilters(); setSelectedId(null) }

  const onTreeSelect = (keys: React.Key[]) => {
    const k = String(keys[0] || 'all')
    if (k === 'all') { setZoneKey('all'); setCatFilter(undefined); return }
    const [z, cat] = k.slice('zone:'.length).split('/cat:')
    setZoneKey(z)
    setCatFilter(cat || undefined)
  }

  /* ===== 表格列 ===== */
  const deviceColumns = [
    { title: '编号', dataIndex: 'id', width: 76, render: (v: number) => `EQ-${String(v).padStart(4, '0')}` },
    { title: '名称', dataIndex: 'name', ellipsis: true },
    { title: '分类', dataIndex: 'category', width: 76 },
    { title: '型号', dataIndex: 'model', width: 110, ellipsis: true },
    {
      title: '状态', dataIndex: 'status', width: 84,
      render: (s: string) => <Tag color={STATUS_META[s]?.color} bordered={false}>{STATUS_META[s]?.label || s}</Tag>,
    },
    { title: '所属区域', width: 92, render: (_: unknown, m: Machinery) => zoneOfMachine(m).name },
    { title: '更新时间', dataIndex: 'updatedAt', width: 100, render: (v: string) => (v || '').slice(0, 10) },
  ]
  const orderColumns = [
    { title: '工单号', dataIndex: 'workNo', width: 150, ellipsis: true },
    { title: '标题', dataIndex: 'title', ellipsis: true },
    { title: '设备', dataIndex: 'machineryName', width: 110, ellipsis: true },
    { title: '类型', dataIndex: 'type', width: 64, render: (t: string) => (t === 'repair' ? '维修' : '保养') },
    { title: '优先级', dataIndex: 'priority', width: 64 },
    {
      title: '状态', dataIndex: 'status', width: 80,
      render: (s: string) => <Tag color={WO_STATUS[s]?.color}>{WO_STATUS[s]?.label || s}</Tag>,
    },
    { title: '报修时间', dataIndex: 'createdAt', width: 100, render: (v: string) => (v || '').slice(0, 10) },
  ]

  const pageHeight = settings.multiTab ? 'calc(100vh - 136px)' : 'calc(100vh - 96px)'

  const lifeSteps = selected ? [
    { title: '采购入库', description: (selected.createdAt || '').slice(0, 10) },
    { title: '建档登记', description: (selected.createdAt || '').slice(0, 10) },
    { title: '投放使用', description: selected.status !== 'available' ? (selected.updatedAt || '').slice(0, 10) : '--' },
    { title: '巡检保养', description: selectedOrders.some(o => o.type === 'maintain') ? (selectedOrders.find(o => o.type === 'maintain')?.createdAt || '').slice(0, 10) : '--' },
    { title: '维修处理', description: selectedOrders.some(o => o.type === 'repair') ? (selectedOrders.find(o => o.type === 'repair')?.createdAt || '').slice(0, 10) : '--' },
    { title: '当前状态', description: STATUS_META[selected.status]?.label || selected.status },
  ] : []
  const lifeCurrent = selected ? (selected.status === 'maintenance' ? 4 : selected.status === 'rented' ? 2 : 5) : 0

  return (
    <ConfigProvider theme={{ algorithm: theme.darkAlgorithm, token: { colorPrimary: '#4096ff', borderRadius: 6, fontSize: 13 } }}>
      <div className={styles.page} style={{ height: pageHeight }}>
        {loading ? (
          <div className={styles.loadingWrap}><Spin size='large' tip='正在构建数字孪生场景...' /></div>
        ) : (
          <>
            {/* 顶部 KPI 指标条 */}
            <div className={styles.kpiRow}>
              {kpis.map((k, i) => (
                <div key={k.label} className={styles.kpi}>
                  <span className={styles.kpiIcon} style={{ color: k.color, background: `${k.color}1f`, border: `1px solid ${k.color}55` }}>{k.icon}</span>
                  <span className={styles.kpiMeta}>
                    <span className={styles.kpiLabel}>{k.label}</span>
                    <span className={styles.kpiValue} style={{ color: k.color }}>{k.value}</span>
                  </span>
                  <Spark seed={i + 1} color={k.color} />
                </div>
              ))}
            </div>

            <div className={styles.midRow}>
              {/* 左侧：设备台账 */}
              <aside className={styles.panel}>
                <div className={styles.panelHead}>
                  <span><EnvironmentOutlined /> 设备台账</span>
                  <Tooltip title='重置筛选'>
                    <Button type='text' size='small' icon={<UndoOutlined />} onClick={resetFilters} />
                  </Tooltip>
                </div>
                <div className={styles.panelBody}>
                  <Input.Search placeholder='搜索设备名称/型号' allowClear size='small'
                    value={keyword} onChange={e => setKeyword(e.target.value)} />
                  <Tree
                    className={styles.twinTree}
                    treeData={treeData}
                    defaultExpandAll
                    selectedKeys={[treeSelectedKey]}
                    onSelect={onTreeSelect}
                    blockNode
                  />
                  <div className={styles.filterGroup}>
                    {Object.entries(STATUS_META).map(([k, v]) => (
                      <div key={k}
                        className={`${styles.statusRow} ${statusFilter === k ? styles.statusRowActive : ''}`}
                        onClick={() => setStatusFilter(statusFilter === k ? undefined : k)}>
                        <span className={styles.statusDot} style={{ background: v.color }} />
                        <span>{v.label}</span>
                        <b>{countBy(m => m.status === k)}</b>
                      </div>
                    ))}
                  </div>
                  <div className={styles.filterGroup}>
                    <Select size='small' placeholder='设备分类' allowClear style={{ width: '100%' }}
                      options={categoryOptions} value={catFilter} onChange={setCatFilter} />
                    <Select size='small' placeholder='设备状态' allowClear style={{ width: '100%' }}
                      options={Object.entries(STATUS_META).map(([k, v]) => ({ value: k, label: v.label }))}
                      value={statusFilter} onChange={setStatusFilter} />
                    <Select size='small' placeholder='品牌' allowClear style={{ width: '100%' }}
                      options={brandOptions} value={brandFilter} onChange={setBrandFilter} />
                  </div>
                </div>
              </aside>

              {/* 中部：孪生场景 */}
              <section className={styles.sceneCol}>
                <div className={styles.toolbar}>
                  <Tooltip title='定位选中设备'>
                    <Button size='small' icon={<AimOutlined />} onClick={locate}>设备定位</Button>
                  </Tooltip>
                  <Tooltip title='高亮维护中设备的影响区域'>
                    <Button size='small' type={showOverlay ? 'primary' : 'default'} ghost={showOverlay}
                      icon={<HeatMapOutlined />} onClick={() => setShowOverlay(v => !v)}>风险叠加</Button>
                  </Tooltip>
                  <Tooltip title='显示巡检 / 转运路线'>
                    <Button size='small' type={showRoutes ? 'primary' : 'default'} ghost={showRoutes}
                      icon={<NodeIndexOutlined />} onClick={() => setShowRoutes(v => !v)}>轨迹查看</Button>
                  </Tooltip>
                  <Tooltip title='显示设备名称标签'>
                    <Button size='small' type={showLabels ? 'primary' : 'default'} ghost={showLabels}
                      icon={<TagOutlined />} onClick={() => setShowLabels(v => !v)}>名称标签</Button>
                  </Tooltip>
                  <Tooltip title='复位视角与筛选'>
                    <Button size='small' icon={<UndoOutlined />} onClick={resetView}>复位</Button>
                  </Tooltip>
                  <div className={styles.toolbarRight}>
                    <Segmented size='small' value={zoneKey} onChange={v => setZoneKey(String(v))}
                      options={[{ value: 'all', label: '全场' }, ...TWIN_ZONES.map(z => ({ value: z.key, label: z.name }))]} />
                    <Button size='small' type='text' icon={<ZoomOutOutlined />} onClick={() => setZoom(z => Math.max(0.6, +(z - 0.15).toFixed(2)))} />
                    <Button size='small' type='text' icon={<ZoomInOutlined />} onClick={() => setZoom(z => Math.min(1.8, +(z + 0.15).toFixed(2)))} />
                  </div>
                </div>

                <div className={styles.sceneWrap}>
                  <TwinScene
                    machines={filtered}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    showRoutes={showRoutes}
                    showOverlay={showOverlay}
                    showLabels={showLabels}
                    zoom={zoom}
                    focusTick={focusTick}
                  />
                  {/* 图例 */}
                  <div className={styles.legend}>
                    <div className={styles.legendTitle}>图例</div>
                    {Object.entries(STATUS_META).map(([k, v]) => (
                      <div key={k} className={styles.legendItem}>
                        <span className={styles.legendDot} style={{ background: v.color }} />{v.label}
                      </div>
                    ))}
                    <div className={styles.legendItem}><span className={styles.legendArea} />影响区域</div>
                    <div className={styles.legendItem}><span className={styles.legendLine} style={{ borderColor: '#22c55e' }} />巡检路线</div>
                    <div className={styles.legendItem}><span className={styles.legendLine} style={{ borderColor: '#22d3ee' }} />转运路线</div>
                  </div>
                </div>
              </section>

              {/* 右侧：详情 / 生命周期 */}
              <aside className={styles.panel}>
                <Tabs
                  className={styles.rightTabs}
                  centered
                  size='small'
                  items={[
                    {
                      key: 'detail',
                      label: '设备详情',
                      children: !selected ? (
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='点击场景或列表中的设备查看详情' style={{ marginTop: 40 }} />
                      ) : (
                        <div className={styles.detailBody}>
                          <div className={styles.detailHead}>
                            <span className={styles.detailAvatar}>{selected.name.charAt(0)}</span>
                            <div className={styles.detailHeadMeta}>
                              <b>{selected.name}</b>
                              <Tag color={STATUS_META[selected.status]?.color} bordered={false}>
                                {STATUS_META[selected.status]?.label || selected.status}
                              </Tag>
                            </div>
                          </div>
                          {[
                            ['设备编号', `EQ-${String(selected.id).padStart(4, '0')}`],
                            ['设备分类', selected.category],
                            ['设备型号', selected.model],
                            ['生产厂商', selected.brand || '—'],
                            ['所属区域', zoneOfMachine(selected).name],
                            ['参考价格', selected.price ? `¥ ${selected.price.toLocaleString()}` : '—'],
                            ['库存数量', String(selected.stock ?? 0)],
                            ['整机重量', selected.specs?.weight || '—'],
                            ['额定功率', selected.specs?.power || '—'],
                            ['外形尺寸', selected.specs?.dimensions || '—'],
                            ['登记时间', (selected.createdAt || '').slice(0, 10)],
                          ].map(([k, v]) => (
                            <div key={k} className={styles.detailRow}>
                              <span className={styles.detailLabel}>{k}</span>
                              <span className={styles.detailValue} title={v}>{v}</span>
                            </div>
                          ))}
                          <div className={styles.detailActions}>
                            <Button type='primary' size='small' block onClick={() => navigate('/devices')}>设备管理</Button>
                            <Button size='small' block icon={<ScheduleOutlined />} onClick={() => navigate('/workorders')}>新建工单</Button>
                          </div>
                        </div>
                      ),
                    },
                    {
                      key: 'life',
                      label: '生命周期',
                      children: !selected ? (
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='请先选择设备' style={{ marginTop: 40 }} />
                      ) : (
                        <div className={styles.detailBody}>
                          <Steps size='small' direction='vertical' current={lifeCurrent} items={lifeSteps} />
                          <div className={styles.lifeOrdersTitle}>关联工单</div>
                          {selectedOrders.length === 0 && <div className={styles.lifeEmpty}>暂无关联工单</div>}
                          {selectedOrders.map(o => (
                            <div key={o.id} className={styles.lifeOrder}>
                              <span className={styles.lifeOrderNo}>{o.workNo}</span>
                              <Tag color={WO_STATUS[o.status]?.color}>{WO_STATUS[o.status]?.label || o.status}</Tag>
                              <span className={styles.lifeOrderTime}>{(o.createdAt || '').slice(0, 10)}</span>
                            </div>
                          ))}
                        </div>
                      ),
                    },
                  ]}
                />
              </aside>
            </div>

            {/* 底部：列表 + 分析图表 */}
            <div className={styles.bottomRow}>
              <div className={styles.bottomTable}>
                <Tabs
                  size='small'
                  items={[
                    {
                      key: 'devices',
                      label: `设备列表（${filtered.length}）`,
                      children: (
                        <Table
                          size='small' rowKey='id' columns={deviceColumns as any} dataSource={filtered}
                          pagination={false} scroll={{ y: 176 }}
                          rowClassName={r => (r.id === selectedId ? styles.rowSelected : '')}
                          onRow={r => ({ onClick: () => { setSelectedId(r.id); setFocusTick(t => t + 1) } })}
                        />
                      ),
                    },
                    {
                      key: 'orders',
                      label: `工单动态（${workOrders.length}）`,
                      children: (
                        <Table
                          size='small' rowKey='id' columns={orderColumns as any} dataSource={workOrders}
                          pagination={false} scroll={{ y: 176 }}
                        />
                      ),
                    },
                  ]}
                />
              </div>
              <ChartBox title='设备状态分布（漏斗图）' option={funnelOption} />
              <ChartBox title='月度工单趋势' option={trendOption} />
            </div>
          </>
        )}
      </div>
    </ConfigProvider>
  )
}
