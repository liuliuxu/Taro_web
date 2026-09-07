import { useState } from 'react'
import Taro, { useDidShow, useRouter } from '@tarojs/taro'
import { View, Text, ScrollView } from '@tarojs/components'
import { dispatchApi, userApi } from '../../services/api'
import type { DispatchTask, User } from '../../types'
import { dispatchStatusLabel, dispatchStatusColor, dispatchStatusBg, fmtDate } from '../../utils/bizMeta'
import './index.scss'

export default function TaskDetail() {
  const router = useRouter()
  const id = Number(router.params.id)
  const [t, setT] = useState<DispatchTask | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [showAssign, setShowAssign] = useState(false)
  const [busy, setBusy] = useState(false)

  useDidShow(() => {
    load()
  })

  async function load() {
    try {
      const task = await dispatchApi.getDetail(id)
      setT(task)
      if (task.status === 'created') {
        const u = await userApi.list().catch(() => [] as User[])
        setUsers(u.filter((x) => x.role === 'manager' || x.role === 'operator'))
      }
    } catch (e) {
      Taro.showToast({ title: '加载失败', icon: 'none' })
    }
  }

  async function act(status: string, label: string, extra?: Record<string, unknown>) {
    setBusy(true)
    try {
      await dispatchApi.handle(id, { status, ...(extra || {}) })
      Taro.showToast({ title: label, icon: 'success' })
      setShowAssign(false)
      load()
    } catch (e: any) {
      Taro.showToast({ title: e?.message || '操作失败', icon: 'none' })
    } finally {
      setBusy(false)
    }
  }

  async function doAssign(uid: number) {
    await act('assigned', '已派发', { assigneeUserId: uid })
  }

  function Info({ label, value }: { label: string; value?: string }) {
    return (
      <View className='td-row'>
        <Text className='td-label'>{label}</Text>
        <Text className='td-value'>{value || '—'}</Text>
      </View>
    )
  }

  return (
    <View className='td-page'>
      <ScrollView scrollY className='td-scroll'>
        {t && (
          <>
            <View className='td-header'>
              <Text className='td-status' style={{ color: dispatchStatusColor(t.status), background: dispatchStatusBg(t.status) }}>{dispatchStatusLabel(t.status)}</Text>
              <Text className='td-no'>{t.dispatchNo}</Text>
              <Text className='td-title'>{t.title}</Text>
            </View>

            <View className='td-card'>
              <Info label='所属工程' value={t.projectName} />
              <Info label='调度设备' value={`${t.machineryName}${t.machineryModel ? '（' + t.machineryModel + '）' : ''}`} />
              <Info label='负责人' value={t.assigneeName || '待分配'} />
              <Info label='计划工期' value={`${fmtDate(t.startAt)} ~ ${fmtDate(t.endAt)}`} />
              <Info label='完成进度' value={t.progress !== undefined ? `${t.progress}%` : '—'} />
              <Info label='任务描述' value={t.description} />
              {t.handleNote && <Info label='处理记录' value={t.handleNote} />}
            </View>

            {t.progress !== undefined && t.progress > 0 && (
              <View className='td-progress-card'>
                <View className='td-progress'><View className='td-progress-bar' style={{ width: `${t.progress}%` }} /></View>
              </View>
            )}

            <View className='td-actions'>
              {t.status === 'created' && (
                <>
                  <View className='td-btn td-btn-primary' onClick={() => setShowAssign(true)}>派发任务</View>
                  <View className='td-btn td-btn-danger' onClick={() => act('cancelled', '任务已取消')}>取消</View>
                </>
              )}
              {t.status === 'assigned' && (
                <>
                  <View className='td-btn td-btn-primary' onClick={() => act('ongoing', '已开始执行')}>开始执行</View>
                  <View className='td-btn td-btn-warn' onClick={() => act('cancelled', '任务已取消')}>取消</View>
                </>
              )}
              {t.status === 'ongoing' && (
                <>
                  <View className='td-btn td-btn-extra' onClick={() => act('ongoing', '已更新进度', { progress: Math.min(100, (t.progress || 0) + 20) })}>进度+20%</View>
                  <View className='td-btn td-btn-success' onClick={() => act('done', '任务已完成', { progress: 100 })}>完成</View>
                </>
              )}
            </View>
            <View style={{ height: '30px' }} />
          </>
        )}
      </ScrollView>

      {showAssign && (
        <View className='td-mask' onClick={() => setShowAssign(false)}>
          <View className='td-sheet' onClick={(e) => e.stopPropagation()}>
            <Text className='td-sheet-title'>选择派发对象</Text>
            {busy && <Text className='td-sheet-empty'>操作中...</Text>}
            {!busy && users.length === 0 && <Text className='td-sheet-empty'>暂无可派发人员</Text>}
            {!busy && users.map((u) => (
              <View key={u.id} className='td-user' onClick={() => doAssign(u.id)}>
                <View className='td-avatar'>{u.nickname?.charAt(0) || u.username.charAt(0)}</View>
                <View className='td-user-info'>
                  <Text className='td-user-name'>{u.nickname || u.username}</Text>
                  <Text className='td-user-role'>{u.role === 'manager' ? '设备负责人' : '一线作业人员'}</Text>
                </View>
              </View>
            ))}
            <View className='td-sheet-cancel' onClick={() => setShowAssign(false)}>取消</View>
          </View>
        </View>
      )}
    </View>
  )
}