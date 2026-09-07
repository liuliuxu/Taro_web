import { useState } from 'react'
import Taro, { useDidShow, useRouter } from '@tarojs/taro'
import { View, Text, ScrollView } from '@tarojs/components'
import { projectApi, dispatchApi } from '../../services/api'
import type { Project, DispatchTask } from '../../types'
import { projectStatusLabel, projectStatusColor, projectStatusBg, dispatchStatusLabel, dispatchStatusColor, dispatchStatusBg, fmtDate, fmtMoney } from '../../utils/bizMeta'
import './index.scss'

export default function ProjectDetail() {
  const router = useRouter()
  const id = Number(router.params.id)
  const [p, setP] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<DispatchTask[]>([])

  useDidShow(() => {
    load()
  })

  async function load() {
    try {
      const [detail, ts] = await Promise.all([
        projectApi.getDetail(id),
        dispatchApi.getProjectTasks(id).catch(() => [] as DispatchTask[])
      ])
      setP(detail)
      setTasks(ts)
    } catch (e) {
      Taro.showToast({ title: '加载失败', icon: 'none' })
    }
  }

  async function changeStatus(status: string, label: string) {
    try {
      await projectApi.changeStatus(id, status)
      Taro.showToast({ title: label, icon: 'success' })
      load()
    } catch (e: any) {
      Taro.showToast({ title: e?.message || '操作失败', icon: 'none' })
    }
  }

  function Info({ label, value }: { label: string; value?: string }) {
    return (
      <View className='pd-info-row'>
        <Text className='pd-info-label'>{label}</Text>
        <Text className='pd-info-value'>{value || '—'}</Text>
      </View>
    )
  }

  return (
    <View className='pd-page'>
      <ScrollView scrollY className='pd-scroll'>
        {p && (
          <>
            <View className='pd-header'>
              <View className='pd-status' style={{ color: projectStatusColor(p.status), background: projectStatusBg(p.status) }}>{projectStatusLabel(p.status)}</View>
              <Text className='pd-no'>{p.projectNo}</Text>
              <Text className='pd-name'>{p.name}</Text>
              {p.managerName && <Text className='pd-manager'>负责人：{p.managerName}</Text>}
            </View>

            <View className='pd-card'>
              <Info label='客户单位' value={p.customerName} />
              <Info label='联系电话' value={p.customerPhone} />
              <Info label='施工地点' value={p.address} />
              <Info label='计划周期' value={`${fmtDate(p.plannedStart)} ~ ${fmtDate(p.plannedEnd)}`} />
              <Info label='项目预算' value={p.budget ? `${fmtMoney(p.budget)} 元` : undefined} />
              <Info label='项目描述' value={p.description} />
            </View>

            <View className='pd-actions'>
              {p.status === 'created' && (
                <View className='pd-btn pd-btn-primary' onClick={() => changeStatus('active', '项目已启动')}>启动项目</View>
              )}
              {p.status === 'active' && (
                <View className='pd-btn pd-btn-success' onClick={() => changeStatus('finished', '项目已完工')}>完工结算</View>
              )}
              {(p.status === 'created' || p.status === 'active') && (
                <View className='pd-btn pd-btn-danger' onClick={() => changeStatus('cancelled', '项目已取消')}>取消项目</View>
              )}
            </View>

            <View className='pd-task-head'>
              <Text className='pd-task-title'>调度任务（{tasks.length}）</Text>
              <Text className='pd-task-more' onClick={() =>
                Taro.preload({
                  projectId: String(id),
                  projectName: p.name || ''
                }) && Taro.navigateTo({ url: `/pages/dispatch-create/index?projectId=${id}&projectName=${encodeURIComponent(p.name || '')}` })}>＋ 派单</Text>
            </View>
            {tasks.length === 0 ? (
              <View className='pd-empty'>暂无调度任务，点击右上方派单</View>
            ) : (
              tasks.map((t) => (
                <View key={t.id} className='pd-task' onClick={() => Taro.navigateTo({ url: `/pages/task-detail/index?id=${t.id}` })}>
                  <View className='pd-task-top'>
                    <Text className='pd-task-no'>{t.dispatchNo}</Text>
                    <Text className='pd-task-status' style={{ color: dispatchStatusColor(t.status), background: dispatchStatusBg(t.status) }}>{dispatchStatusLabel(t.status)}</Text>
                  </View>
                  <Text className='pd-task-name'>{t.title}</Text>
                  <Text className='pd-task-meta'>设备：{t.machineryName} {t.machineryModel || ''} · 负责人：{t.assigneeName || '待分配'}</Text>
                  {t.progress !== undefined && t.progress > 0 && (
                    <View className='pd-progress'><View className='pd-progress-bar' style={{ width: `${t.progress}%` }} /></View>
                  )}
                </View>
              ))
            )}
            <View style={{ height: '40px' }} />
          </>
        )}
      </ScrollView>
    </View>
  )
}