import { useState } from 'react'
import Taro, { useDidShow, useRouter } from '@tarojs/taro'
import { View, Text, ScrollView } from '@tarojs/components'
import { machineryApi } from '../../services/api'
import type { Machinery } from '../../types'
import { getCategoryTheme } from '../../utils/deviceVisual'
import './index.scss'

export default function DeviceDetail() {
  const router = useRouter()
  const id = Number(router.params.id)
  const [m, setM] = useState<Machinery | null>(null)

  useDidShow(() => {
    load()
  })

  async function load() {
    try {
      const res = await machineryApi.getDetail(id)
      setM(res)
    } catch (e) {
      Taro.showToast({ title: '加载失败', icon: 'none' })
    }
  }

  function reportRepair() {
    if (!Taro.getStorageSync('token')) {
      Taro.navigateTo({ url: '/pages/login/index' })
      return
    }
    Taro.navigateTo({ url: `/pages/workorder-create/index?type=repair&deviceId=${id}` })
  }

  if (!m) return <View className='detail-loading'>加载中...</View>

  const theme = getCategoryTheme(m.category)
  const statusMap: Record<string, string> = {
    available: '在册',
    rented: '外派中',
    maintenance: '维修中'
  }
  const specRows = [
    { label: '整机重量', value: `${m.specs?.weight || '-'} t` },
    { label: '额定功率', value: `${m.specs?.power || '-'} kW` },
    { label: '外形尺寸', value: m.specs?.dimensions || '-' },
    { label: '作业容量', value: m.specs?.capacity || '-' }
  ]

  return (
    <View className='detail-page'>
      <ScrollView scrollY className='detail-scroll'>
        {/* 头部图 */}
        <View className='detail-hero' style={{ background: `linear-gradient(160deg, ${theme.from}, ${theme.to})` }}>
          <View className='detail-hero-icon'>{m.category.charAt(0)}</View>
          <View className='detail-hero-info'>
            <Text className='detail-hero-name'>{m.name}</Text>
            <Text className='detail-hero-sub'>{m.brand} · {m.model} · {m.category}</Text>
          </View>
          <View className='detail-hero-status'>{statusMap[m.status] || m.status}</View>
        </View>

        {/* 基础信息 */}
        <View className='detail-card'>
          <Text className='detail-card-title'>设备信息</Text>
          <View className='desc'>
            <Text className='desc-text'>{m.description || '暂无描述'}</Text>
          </View>
          {specRows.map((r) => (
            <View key={r.label} className='spec-row'>
              <Text className='spec-label'>{r.label}</Text>
              <Text className='spec-value'>{r.value}</Text>
            </View>
          ))}
          <View className='spec-row'>
            <Text className='spec-label'>登记时间</Text>
            <Text className='spec-value'>{m.createdAt ? m.createdAt.slice(0, 10) : '-'}</Text>
          </View>
        </View>

        {/* 提示 */}
        <View className='detail-card'>
          <Text className='detail-card-title'>使用说明</Text>
          <View className='tip-row'>
            <Text className='tip-bullet'>·</Text>
            <Text className='tip-text'>设备维修保养请通过【报修/保养】提交工单，由系统统一派单处理</Text>
          </View>
          <View className='tip-row'>
            <Text className='tip-bullet'>·</Text>
            <Text className='tip-text'>外派/维修中的设备不建议安排新的作业任务</Text>
          </View>
        </View>

        <View style={{ height: '30px' }} />
      </ScrollView>

      {/* 底部操作 */}
      <View className='detail-footer'>
        <View className='footer-btn btn-report' onClick={reportRepair}>报修工单</View>
        <View className='footer-btn btn-maintain' onClick={() => Taro.navigateTo({ url: `/pages/workorder-create/index?type=maintain&deviceId=${id}` })}>保养工单</View>
      </View>
    </View>
  )
}
