import { useState } from 'react'
import Taro, { useDidShow, useRouter } from '@tarojs/taro'
import { View, Text, Input, ScrollView } from '@tarojs/components'
import { workOrderApi, userApi, authApi } from '../../services/api'
import type { WorkOrder, User } from '../../types'
import { statusLabel, typeLabel, priorityLabel, statusColor, statusBg } from '../../utils/workOrderMeta'
import './index.scss'

export default function WorkOrderDetail() {
  const router = useRouter()
  const id = Number(router.params.id)
  const [w, setW] = useState<WorkOrder | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [me, setMe] = useState<User | null>(null)
  const [showAssign, setShowAssign] = useState(false)
  const [note, setNote] = useState('')
  const [cost, setCost] = useState('')
  const [showHandle, setShowHandle] = useState<null | 'review' | 'processing'>(null)

  useDidShow(() => {
    load()
  })

  async function load() {
    try {
      const res = await workOrderApi.getDetail(id)
      setW(res)
    } catch (e) {
      Taro.showToast({ title: '加载失败', icon: 'none' })
    }
    try {
      const profile = await authApi.getProfile()
      setMe(profile)
    } catch (e) {
      /* ignore */
    }
    try {
      const us = await userApi.list()
      setUsers(us.filter((u) => u.username !== 'admin'))
    } catch (e) {
      /* ignore */
    }
  }

  function requireLogin() {
    if (!Taro.getStorageSync('token')) {
      Taro.navigateTo({ url: '/pages/login/index' })
      return false
    }
    return true
  }

  async function doAssign(target: number) {
    if (!requireLogin()) return
    try {
      const next = await workOrderApi.assign(id, { assigneeUserId: target })
      setW(next)
      setShowAssign(false)
      Taro.showToast({ title: '派单成功', icon: 'success' })
    } catch (e: any) {
      Taro.showToast({ title: e?.message || '派单失败', icon: 'none' })
    }
  }

  async function confirmHandle(target: 'review' | 'processing' | 'done') {
    if (!requireLogin()) return
    const payload: any = { status: target }
    if (note) payload.handleNote = note
    if (cost && target === 'review') payload.cost = Number(cost)
    try {
      const next = await workOrderApi.handle(id, payload)
      setW(next)
      setNote('')
      setCost('')
      setShowHandle(null)
      Taro.showToast({ title: '操作成功', icon: 'success' })
    } catch (e: any) {
      Taro.showToast({ title: e?.message || '操作失败', icon: 'none' })
    }
  }

  async function doSimple(target: string) {
    if (!requireLogin()) return
    try {
      const next = await workOrderApi.handle(id, { status: target })
      setW(next)
      Taro.showToast({ title: '操作成功', icon: 'success' })
    } catch (e: any) {
      Taro.showToast({ title: e?.message || '操作失败', icon: 'none' })
    }
  }

  if (!w) return <View className='detail-loading'>加载中...</View>

  const isMy = !!me && w.assigneeUserId === me.id
  const canAssign = w.status === 'created' && !!me && (me.role === 'admin' || me.role === 'manager')
  const canStart = w.status === 'assigned' && isMy
  const canSubmitReview = w.status === 'processing' && isMy
  const canAccept = w.status === 'review'
  const canCancel = !['done', 'cancelled'].includes(w.status)

  const infoRows = [
    { label: '工单编号', value: w.workNo },
    { label: '工单类型', value: typeLabel(w.type) },
    { label: '优先级', value: priorityLabel(w.priority) },
    { label: '关联设备', value: w.machineryName + (w.machineryModel ? ' · ' + w.machineryModel : '') },
    { label: '上报人', value: w.reportUserName },
    { label: '处理人', value: w.assigneeName || '未派单' },
    { label: '上报时间', value: w.reportedAt ? w.reportedAt.slice(0, 16).replace('T', ' ') : '-' },
    { label: '完成时间', value: w.completedAt ? w.completedAt.slice(0, 16).replace('T', ' ') : '-' },
    { label: '费用', value: w.cost ? `¥${w.cost}` : '-' }
  ]

  return (
    <View className='detail-page'>
      <ScrollView scrollY className='detail-scroll'>
        <View className='head-band'>
          <Text className='head-status' style={{ color: statusColor(w.status), background: statusBg(w.status) }}>{statusLabel(w.status)}</Text>
        </View>

        <View className='card title-card'>
          <Text className='title'>{w.title}</Text>
          <Text className='desc'>{w.description || '暂无描述'}</Text>
        </View>

        <View className='card'>
          <Text className='card-title'>工单信息</Text>
          {infoRows.map((r) => (
            <View key={r.label} className='info-row'>
              <Text className='info-label'>{r.label}</Text>
              <Text className={`info-value ${r.value === '未派单' ? 'info-empty' : ''}`}>{r.value}</Text>
            </View>
          ))}
          {w.handleNote && (
            <View className='note-block'>
              <Text className='note-label'>处理说明</Text>
              <Text className='note-text'>{w.handleNote}</Text>
            </View>
          )}
        </View>
        <View style={{ height: '30px' }} />
      </ScrollView>

      {/* 处理人选择弹层 */}
      {showAssign && (
        <View className='mask' onClick={() => setShowAssign(false)}>
          <View className='assign-sheet' onClick={(e) => e.stopPropagation()}>
            <Text className='assign-title'>选择处理人</Text>
            {users.map((u) => (
              <View key={u.id} className='assign-item' onClick={() => doAssign(u.id)}>
                <View className='assign-avatar'>{u.nickname?.charAt(0) || u.username.charAt(0)}</View>
                <View className='assign-info'>
                  <Text className='assign-name'>{u.nickname || u.username}</Text>
                  <Text className='assign-role'>{u.role === 'manager' ? '设备负责人' : '一线作业人员'}</Text>
                </View>
              </View>
            ))}
            {users.length === 0 && <Text className='assign-empty'>暂无可分配处理人</Text>}
          </View>
        </View>
      )}

      {/* 处理说明弹层 */}
      {showHandle && (
        <View className='mask' onClick={() => setShowHandle(null)}>
          <View className='handle-sheet' onClick={(e) => e.stopPropagation()}>
            <Text className='assign-title'>{showHandle === 'review' ? '完成·提交验收' : '处理工单'}</Text>
            {showHandle === 'review' && (
              <View className='form-row'>
                <Text className='form-label'>费用(元)</Text>
                <Input className='form-input' type='digit' placeholder='选填，如 3500' value={cost} onInput={(e) => setCost(e.detail.value)} />
              </View>
            )}
            <View className='form-row'>
              <Text className='form-label'>处理说明</Text>
              <Input className='form-input' placeholder='选填，处理措施 / 备注' value={note} onInput={(e) => setNote(e.detail.value)} />
            </View>
            <View className='sheet-actions'>
              <View className='sheet-btn ghost' onClick={() => setShowHandle(null)}>取消</View>
              <View className='sheet-btn primary' onClick={() => confirmHandle(showHandle === 'review' ? 'review' : 'processing')}>确认</View>
            </View>
          </View>
        </View>
      )}

      {/* 底部操作 */}
      <View className='footer'>
        {canAssign && <View className='footer-btn primary' onClick={() => setShowAssign(true)}>派单</View>}
        {canStart && <View className='footer-btn primary' onClick={() => setShowHandle('processing')}>开始处理</View>}
        {canSubmitReview && <View className='footer-btn primary' onClick={() => setShowHandle('review')}>完成·提交验收</View>}
        {canAccept && <View className='footer-btn primary' onClick={() => doSimple('done')}>验收通过</View>}
        {canCancel && <View className='footer-btn danger' onClick={() => doSimple('cancelled')}>取消工单</View>}
      </View>
    </View>
  )
}
