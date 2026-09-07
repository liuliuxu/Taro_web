import { useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { View, Text, ScrollView } from '@tarojs/components'
import { projectApi } from '../../services/api'
import type { Project } from '../../types'
import { projectStatusLabel, projectStatusColor, projectStatusBg, fmtDate, fmtMoney } from '../../utils/bizMeta'
import './index.scss'

const TABS = [
  { key: 'all', label: '全部' },
  { key: 'created', label: '待启动' },
  { key: 'active', label: '进行中' },
  { key: 'finished', label: '已完工' }
]

export default function ProjectList() {
  const [tab, setTab] = useState('all')
  const [list, setList] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)

  useDidShow(() => {
    load(tab)
  })

  async function load(t: string) {
    setLoading(true)
    try {
      const pager = await projectApi.getList({
        page: 1,
        pageSize: 100,
        status: t === 'all' ? undefined : t
      })
      setList(pager.list)
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

  return (
    <View className='pl-page'>
      <ScrollView scrollX className='wo-tab-scroll' showScrollbar={false}>
        <View className='wo-tab-row'>
          {TABS.map((t) => (
            <View key={t.key} className={`wo-tab-chip ${tab === t.key ? 'wo-tab-on' : ''}`} onClick={() => onTab(t.key)}>
              {t.label}
            </View>
          ))}
        </View>
      </ScrollView>

      <ScrollView scrollY className='pl-scroll'>
        {list.length === 0 && !loading ? (
          <View className='pl-empty'>暂无工程项目</View>
        ) : (
          list.map((p) => (
            <View key={p.id} className='pl-card' hoverClass='pl-hover' onClick={() => Taro.navigateTo({ url: `/pages/project-detail/index?id=${p.id}` })}>
              <View className='pl-top'>
                <Text className='pl-no'>{p.projectNo}</Text>
                <Text className='pl-status' style={{ color: projectStatusColor(p.status), background: projectStatusBg(p.status) }}>{projectStatusLabel(p.status)}</Text>
              </View>
              <Text className='pl-name'>{p.name}</Text>
              <Text className='pl-customer'>{p.customerName}</Text>
              <View className='pl-info'>
                <Text className='pl-meta'>周期：{fmtDate(p.plannedStart)} ~ {fmtDate(p.plannedEnd)}</Text>
                <Text className='pl-meta'>预算：{fmtMoney(p.budget)} 元</Text>
                <Text className='pl-meta'>任务：{p.taskCount ?? 0} 项</Text>
              </View>
            </View>
          ))
        )}
        {loading && <View className='pl-empty'>加载中...</View>}
      </ScrollView>

      <View className='wo-fab' onClick={() => Taro.navigateTo({ url: '/pages/project-create/index' })}>+ 新建工程</View>
    </View>
  )
}