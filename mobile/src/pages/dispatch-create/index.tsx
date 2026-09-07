import { useState } from 'react'
import Taro, { useDidShow, useRouter } from '@tarojs/taro'
import { View, Text, Input, Textarea, ScrollView, Picker } from '@tarojs/components'
import { machineryApi, dispatchApi, userApi } from '../../services/api'
import type { Machinery, User } from '../../types'
import './index.scss'

export default function DispatchCreate() {
  const router = useRouter()
  const projectId = Number(router.params.projectId)
  const projectName = decodeURIComponent(router.params.projectName || '')

  const [machines, setMachines] = useState<Machinery[]>([])
  const [machineryIndex, setMachineryIndex] = useState(-1)
  const [machineryId, setMachineryId] = useState<number | undefined>(undefined)
  const [users, setUsers] = useState<User[]>([])
  const [userIndex, setUserIndex] = useState(-1)
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [startAt, setStartAt] = useState('')
  const [endAt, setEndAt] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useDidShow(() => {
    load()
  })

  async function load() {
    try {
      const [m, u] = await Promise.all([
        machineryApi.getList({ page: 1, pageSize: 50 }),
        userApi.list().catch(() => [] as User[])
      ])
      setMachines(m.list)
      setUsers(u.filter((x) => x.role === 'manager' || x.role === 'operator'))
    } catch (e) {
      Taro.showToast({ title: '数据加载失败', icon: 'none' })
    }
  }

  async function submit() {
    if (!Taro.getStorageSync('token')) {
      Taro.navigateTo({ url: '/pages/login/index' })
      return
    }
    if (!projectId) {
      Taro.showToast({ title: '缺少工程信息', icon: 'none' })
      return
    }
    if (!machineryId) {
      Taro.showToast({ title: '请选择调度设备', icon: 'none' })
      return
    }
    if (!title.trim()) {
      Taro.showToast({ title: '请填写任务标题', icon: 'none' })
      return
    }
    setSubmitting(true)
    try {
      await dispatchApi.create({
        projectId,
        machineryId,
        title: title.trim(),
        description: desc || undefined,
        assigneeUserId: users[userIndex]?.id,
        startAt: startAt || undefined,
        endAt: endAt || undefined
      })
      Taro.showToast({ title: '派单成功', icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 800)
    } catch (e: any) {
      Taro.showToast({ title: e?.message || '派单失败', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  function Group(props: { label: string; children: any }) {
    return (
      <View className='create-group'>
        <Text className='group-label'>{props.label}</Text>
        {props.children}
      </View>
    )
  }

  return (
    <View className='create-page'>
      <ScrollView scrollY className='create-scroll'>
        <Group label='所属工程'>
          <View className='picker-box picker-filled'>{projectName || `工程 #${projectId}`}</View>
        </Group>
        <Group label='调度设备'>
          <Picker mode='selector' range={machines.map((m) => `${m.name}（${m.model || m.category}）`)} value={machineryIndex} onChange={(e) => {
            const i = Number(e.detail.value)
            setMachineryIndex(i)
            setMachineryId(machines[i]?.id)
          }}>
            <View className={`picker-box ${machineryId ? 'picker-filled' : ''}`}>
              {machineryId ? machines[machineryIndex]?.name || '已选择设备' : '请选择要调度的设备'}
              <Text className='picker-arrow'>›</Text>
            </View>
          </Picker>
        </Group>
        <Group label='任务负责人'>
          <Picker mode='selector' range={users.map((u) => `${u.nickname || u.username}（${u.role === 'manager' ? '设备负责人' : '作业人员'}）`)} value={userIndex} onChange={(e) => setUserIndex(Number(e.detail.value))}>
            <View className={`picker-box ${userIndex >= 0 ? 'picker-filled' : ''}`}>
              {userIndex >= 0 ? users[userIndex]?.nickname || users[userIndex]?.username : '不指定（保持待派发）'}
              <Text className='picker-arrow'>›</Text>
            </View>
          </Picker>
        </Group>
        <Group label='任务标题'>
          <Input className='text-input' placeholder='如：临港大道段路基开挖' value={title} onInput={(e) => setTitle(e.detail.value)} />
        </Group>
        <Group label='任务描述'>
          <Textarea className='text-area' placeholder='作业范围、工程量要求、注意事项等' value={desc} onInput={(e) => setDesc(e.detail.value)} maxlength={500} />
        </Group>
        <Group label='计划开始'>
          <Picker mode='date' value={startAt} onChange={(e) => setStartAt(e.detail.value)}>
            <View className={`picker-box ${startAt ? 'picker-filled' : ''}`}>
              {startAt || '请选择开始日期'}
              <Text className='picker-arrow'>›</Text>
            </View>
          </Picker>
        </Group>
        <Group label='计划结束'>
          <Picker mode='date' value={endAt} onChange={(e) => setEndAt(e.detail.value)}>
            <View className={`picker-box ${endAt ? 'picker-filled' : ''}`}>
              {endAt || '请选择结束日期'}
              <Text className='picker-arrow'>›</Text>
            </View>
          </Picker>
        </Group>
        <View style={{ height: '40px' }} />
      </ScrollView>

      <View className='create-footer'>
        <View className='submit-btn' onClick={submit}>
          {submitting ? '提交中...' : '发布派单'}
        </View>
      </View>
    </View>
  )
}