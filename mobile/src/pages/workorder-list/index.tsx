import { useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { View, Text, ScrollView } from '@tarojs/components'
import { workOrderApi } from '../../services/api'
import type { WorkOrder } from '../../types'
import { statusLabel, typeLabel, statusColor, statusBg, priorityLabel } from '../../utils/workOrderMeta'
import './index.scss'

const TABS = [
  { key: 'all', label: '全部' },
  { key: 'todo', label: '待我处理' },
  { key: 'processing', label: '处理中' },
  { key: 'reported', label: '我报修的' },
  { key: 'done', label: '已完成' }
]

export default function WorkOrderList() {
  const [tab, setTab] = useState('all')
  const [list, setList] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(false)

  useDidShow(() => {
    load(tab)
  })

  async function load(t: string) {
    setLoading(true)
    try {
      let res: WorkOrder[]
      if (t === 'todo') {
        res = await workOrderApi.getMyTodos()
      } else if (t === 'reported') {
        res = await workOrderApi.getMyReported()
      } else if (t === 'processing') {
        const pager = await workOrderApi.getList({ page: 1, pageSize: 100, status: 'processing' })
        res = pager.list
      } else if (t === 'done') {
        const pager = await workOrderApi.getList({ page: 1, pageSize: 100, status: 'done' })
        res = pager.list
      } else {
        const pager = await workOrderApi.getList({ page: 1, pageSize: 100 })
        res = pager.list
      }
      setList(res)
    } catch (e) {
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  function onTab(t: string) {
    setTab(t)
    load(t)
  }

  function goDetail(id: number) {
    Taro.navigateTo({ url: `/pages/workorder-detail/index?id=${id}` })
  }

  return (
    <View className='wo-list'>
      <ScrollView scrollX className='wo-tab-scroll' showScrollbar={false}>
        <View className='wo-tab-row'>
          {TABS.map((t) => (
            <View key={t.key} className={`wo-tab-chip ${tab === t.key ? 'wo-tab-on' : ''}`} onClick={() => onTab(t.key)}>
              {t.label}
            </View>
          ))}
        </View>
      </ScrollView>

      <ScrollView scrollY className='wo-scroll'>
        {list.length === 0 && !loading ? (
          <View className='wo-empty'>暂无工单</View>
        ) : (
          list.map((w) => (
            <View key={w.id} className='wo-card' hoverClass='wo-hover' onClick={() => goDetail(w.id)}>
              <View className='wo-card-top'>
                <Text className='wo-no'>{w.workNo}</Text>
                <Text className={`wo-status`} style={{ color: statusColor(w.status), background: statusBg(w.status) }}>{statusLabel(w.status)}</Text>
              </View>
              <View className='wo-title-row'>
                <Text className={`wo-prio wo-${w.priority}`}>{priorityLabel(w.priority)}</Text>
                <Text className='wo-title'>{w.title}</Text>
              </View>
              <Text className='wo-desc' numberOfLines={1}>{w.description || '暂无描述'}</Text>
              <View className='wo-meta'>
                <Text className='wo-meta-item'>{typeLabel(w.type)}</Text>
                <Text className='wo-meta-item'>设备：{w.machineryName}</Text>
                <Text className='wo-meta-item'>{w.reportedAt ? w.reportedAt.slice(5, 16) : ''}</Text>
              </View>
              <View className='wo-assignee'>
                <Text className='wo-assignee-label'>{w.status === 'created' ? '待派单给处理人' : `处理人：${w.assigneeName || w.assigneeUserId || '-'}`}</Text>
                {w.status === 'created' && <Text className='wo-arrow'>›</Text>}
              </View>
            </View>
          ))
        )}
        {loading && <View className='wo-empty'>加载中...</View>}
      </ScrollView>

      <View className='wo-fab' onClick={() => Taro.navigateTo({ url: '/pages/workorder-create/index' })}>+ 新建工单</View>
    </View>
  )
}
