import { useState } from 'react'
import Taro, { useDidShow, useRouter } from '@tarojs/taro'
import { View, Text, Input, Textarea, ScrollView, Picker } from '@tarojs/components'
import { machineryApi, workOrderApi } from '../../services/api'
import type { Machinery } from '../../types'
import './index.scss'

const PRIORITIES = [
  { key: 'low', label: '低' },
  { key: 'medium', label: '中' },
  { key: 'high', label: '高' },
  { key: 'urgent', label: '紧急' }
]

export default function WorkOrderCreate() {
  const router = useRouter()
  const [type, setType] = useState<'repair' | 'maintain'>((router.params.type as any) || 'repair')
  const [machines, setMachines] = useState<Machinery[]>([])
  const [machineryId, setMachineryId] = useState<number | undefined>(Number(router.params.deviceId) || undefined)
  const [machineryIndex, setMachineryIndex] = useState(-1)
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [priority, setPriority] = useState('medium')
  const [submitting, setSubmitting] = useState(false)

  useDidShow(() => {
    loadMachines()
  })

  async function loadMachines() {
    try {
      const res = await machineryApi.getList({ page: 1, pageSize: 50 })
      setMachines(res.list)
      const idx = res.list.findIndex((m) => m.id === machineryId)
      if (idx >= 0) setMachineryIndex(idx)
    } catch (e) {
      Taro.showToast({ title: '设备加载失败', icon: 'none' })
    }
  }

  function onSelectType(t: 'repair' | 'maintain') {
    setType(t)
    if (!title) {
      setTitle(t === 'repair' ? '' : '')
    }
  }

  async function submit() {
    if (!Taro.getStorageSync('token')) {
      Taro.navigateTo({ url: '/pages/login/index' })
      return
    }
    if (!machineryId) {
      Taro.showToast({ title: '请选择关联设备', icon: 'none' })
      return
    }
    if (!title.trim()) {
      Taro.showToast({ title: '请填写工单标题', icon: 'none' })
      return
    }
    setSubmitting(true)
    try {
      await workOrderApi.create({
        machineryId,
        title: title.trim(),
        description: desc || undefined,
        type,
        priority: priority || 'medium'
      })
      Taro.showToast({ title: '提交成功', icon: 'success' })
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/workorder-list/index' })
      }, 800)
    } catch (e: any) {
      Taro.showToast({ title: e?.message || '提交失败', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  const priorityPicker = PRIORITIES.map((p) => p.label).join(',')

  return (
    <View className='create-page'>
      <ScrollView scrollY className='create-scroll'>
        {/* 类型 */}
        <View className='create-group'>
          <Text className='group-label'>工单类型</Text>
          <View className='type-row'>
            <View className={`type-chip ${type === 'repair' ? 'type-on-repair' : ''}`} onClick={() => onSelectType('repair')}>🔧 维修</View>
            <View className={`type-chip ${type === 'maintain' ? 'type-on-maintain' : ''}`} onClick={() => onSelectType('maintain')}>🛡 保养</View>
          </View>
        </View>

        {/* 设备选择 */}
        <View className='create-group'>
          <Text className='group-label'>关联设备</Text>
          <Picker mode='selector' range={machines.map((m) => m.name)} value={machineryIndex} onChange={(e) => {
            const i = Number(e.detail.value)
            setMachineryIndex(i)
            setMachineryId(machines[i]?.id)
          }}>
            <View className={`picker-box ${machineryId ? 'picker-filled' : ''}`}>
              {machineryId ? (machines[machineryIndex]?.name || '已选择设备') : '请选择需要报修的设备'}
              <Text className='picker-arrow'>›</Text>
            </View>
          </Picker>
        </View>

        {/* 优先级 */}
        <View className='create-group'>
          <Text className='group-label'>优先级</Text>
          <View className='prio-row'>
            {PRIORITIES.map((p) => (
              <View key={p.key} className={`prio-chip ${priority === p.key ? `prio-on-${p.key}` : ''}`} onClick={() => setPriority(p.key)}>
                {p.label}
              </View>
            ))}
          </View>
        </View>

        {/* 标题 */}
        <View className='create-group'>
          <Text className='group-label'>工单标题 <Text className='required'>*</Text></Text>
          <Input className='text-input' placeholder={type === 'repair' ? '如：液压系统漏油，需紧急检修' : '如：500小时例行保养'} value={title} onInput={(e) => setTitle(e.detail.value)} />
        </View>

        {/* 描述 */}
        <View className='create-group'>
          <Text className='group-label'>问题描述</Text>
          <Textarea className='text-area' placeholder='请详细描述故障现象、发生时间、影响范围等' value={desc} onInput={(e) => setDesc(e.detail.value)} maxlength={500} />
        </View>

        <View style={{ height: '40px' }} />
      </ScrollView>

      <View className='create-footer'>
        <View className='submit-btn' onClick={submit}>
          {submitting ? '提交中...' : '提交工单'}
        </View>
      </View>
    </View>
  )
}
