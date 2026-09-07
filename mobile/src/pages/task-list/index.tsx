import { useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { View, Text, ScrollView } from '@tarojs/components'
import { dispatchApi } from '../../services/api'
import type { DispatchTask } from '../../types'
import { dispatchStatusLabel, dispatchStatusColor, dispatchStatusBg, fmtDate } from '../../utils/bizMeta'
import './index.scss'

export default function TaskList() {
  const [list, setList] = useState<DispatchTask[]>([])
  const [loading, setLoading] = useState(false)

  useDidShow(() => {
    load()
  })

  async function load() {
    setLoading(true)
    try {
      setList(await dispatchApi.getMyTasks())
    } catch (e) {
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className='tl-page'>
      <ScrollView scrollY className='tl-scroll'>
        {list.length === 0 && !loading ? (
          <View className='tl-empty'>暂无派发给我的任务</View>
        ) : (
          list.map((t) => (
            <View key={t.id} className='tl-card' hoverClass='tl-hover' onClick={() => Taro.navigateTo({ url: `/pages/task-detail/index?id=${t.id}` })}>
              <View className='tl-top'>
                <Text className='tl-no'>{t.dispatchNo}</Text>
                <Text className='tl-status' style={{ color: dispatchStatusColor(t.status), background: dispatchStatusBg(t.status) }}>{dispatchStatusLabel(t.status)}</Text>
              </View>
              <Text className='tl-title'>{t.title}</Text>
              <Text className='tl-meta'>工程：{t.projectName}</Text>
              <Text className='tl-meta'>设备：{t.machineryName} {t.machineryModel || ''}</Text>
              <Text className='tl-meta'>工期：{fmtDate(t.startAt)} ~ {fmtDate(t.endAt)}</Text>
              {t.progress !== undefined && (
                <View className='tl-progress'><View className='tl-progress-bar' style={{ width: `${t.progress}%` }} /></View>
              )}
            </View>
          ))
        )}
        {loading && <View className='tl-empty'>加载中...</View>}
      </ScrollView>
    </View>
  )
}