import { useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { View, Text, ScrollView } from '@tarojs/components'
import { inspectApi } from '../../services/api'
import type { InspectionPlan } from '../../types'
import { fmtDate } from '../../utils/bizMeta'
import './index.scss'

export default function InspectList() {
  const [list, setList] = useState<InspectionPlan[]>([])
  const [loading, setLoading] = useState(false)

  useDidShow(() => load())

  async function load() {
    setLoading(true)
    try {
      setList(await inspectApi.todo())
    } catch (e: any) {
      Taro.showToast({ title: e?.message || '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  function complete(p: InspectionPlan) {
    Taro.showModal({
      title: '确认完成',
      content: `确认已对设备「${p.machineryName}」完成${p.type === 'inspection' ? '巡检' : '保养'}？完成后将自动生成下期计划。`,
      confirmText: '确认',
      confirmColor: '#FF6B1A',
      success: async (res) => {
        if (!res.confirm) return
        try {
          await inspectApi.complete(p.id!)
          Taro.showToast({ title: '已完成', icon: 'success' })
          load()
        } catch (e: any) {
          Taro.showToast({ title: e?.message || '操作失败', icon: 'none' })
        }
      }
    })
  }

  return (
    <View className='in-page'>
      <ScrollView scrollY className='in-scroll'>
        {list.length === 0 && !loading && <View className='in-empty'>暂无待执行的巡检/保养任务</View>}
        {list.map((p) => {
          const overdue = (p.nextDueAt || '') < new Date().toISOString().slice(0, 10)
          return (
            <View key={p.id} className='in-card'>
              <View className='in-top'>
                <Text className={`in-type ${p.type === 'inspection' ? 'in-insp' : 'in-maint'}`}>{p.type === 'inspection' ? '巡检' : '保养'}</Text>
                <Text className={`in-due ${overdue ? 'in-low' : ''}`}>{overdue ? '已逾期' : '待执行'}</Text>
              </View>
              <Text className='in-mach'>{p.machineryName}</Text>
              <Text className='in-content'>{p.content}</Text>
              <View className='in-info'>
                <Text className='in-meta'>下次到期：{fmtDate(p.nextDueAt)}（周期 {p.cycleDays ?? 0} 天）</Text>
                <Text className='in-meta'>上次完成：{fmtDate(p.lastDoneAt)}</Text>
                {p.remark && <Text className='in-meta'>备注：{p.remark}</Text>}
              </View>
              <View className={`in-btn ${overdue ? 'in-btn-low' : ''}`} onClick={() => complete(p)}>标记完成</View>
            </View>
          )
        })}
        {loading && <View className='in-empty'>加载中...</View>}
      </ScrollView>
    </View>
  )
}