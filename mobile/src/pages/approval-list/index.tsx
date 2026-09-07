import { useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { View, Text, ScrollView } from '@tarojs/components'
import { approvalApi } from '../../services/api'
import type { ApprovalInstance } from '../../types'
import './index.scss'

const APPROVAL_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: '审批中', color: '#F59E0B', bg: '#FEF3E2' },
  approved: { label: '已通过', color: '#0E9F6E', bg: '#E7F8F0' },
  rejected: { label: '已驳回', color: '#EF4444', bg: '#FDECEC' },
  withdrawn: { label: '已撤回', color: '#98A5B3', bg: '#EEF1F4' }
}

const TABS = [
  { key: 'mine', label: '我的申请' },
  { key: 'todo', label: '待我审批' }
]

export default function ApprovalList() {
  const [tab, setTab] = useState<'mine' | 'todo'>('mine')
  const [mine, setMine] = useState<ApprovalInstance[]>([])
  const [todo, setTodo] = useState<ApprovalInstance[]>([])
  const [loading, setLoading] = useState(false)

  useDidShow(() => load())

  async function load() {
    setLoading(true)
    try {
      const [m, t] = await Promise.all([approvalApi.myApps(), approvalApi.todo()])
      setMine(m)
      setTodo(t)
    } catch (e: any) {
      Taro.showToast({ title: e?.message || '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const list = tab === 'mine' ? mine : todo

  return (
    <View className='al-page'>
      <ScrollView scrollX className='wo-tab-scroll' showScrollbar={false}>
        <View className='wo-tab-row'>
          {TABS.map((t) => (
            <View key={t.key} className={`wo-tab-chip ${tab === t.key ? 'wo-tab-on' : ''}`} onClick={() => setTab(t.key as 'mine')}>
              {t.label}
            </View>
          ))}
        </View>
      </ScrollView>

      <ScrollView scrollY className='wo-tab-body'>
        {list.length === 0 && !loading && <View className='al-empty'>{tab === 'todo' ? '暂无待审批事项' : '还没有发起过审批'}</View>}
        {list.map((it) => {
          const st = APPROVAL_STATUS[it.status] || { label: it.status, color: '#98A5B3', bg: '#EEF1F4' }
          const highlight = tab === 'todo' && it.status === 'pending'
          return (
            <View key={it.id} className='al-card' onClick={() => Taro.navigateTo({ url: `/pages/approval-detail/index?id=${it.id}` })}>
              <View className='al-top'>
                <Text className='al-no'>#{it.approvalNo}</Text>
                <Text className='al-status' style={{ color: st.color, background: st.bg }}>{st.label}</Text>
              </View>
              <Text className='al-title'>{it.title}</Text>
              <Text className='al-meta'>申请人：{it.applicantName || '—'} · {it.applicantId}</Text>
              <Text className='al-meta'>当前节点：{highlight ? it.currentNodeName || '等待审批' : (it.resultNote ? `结果：${it.resultNote}` : (it.currentNodeName || '—'))}</Text>
            </View>
          )
        })}
        {loading && <View className='al-empty'>加载中...</View>}
      </ScrollView>

      <View className='wo-fab' onClick={() => Taro.navigateTo({ url: '/pages/approval-create/index' })}>+ 发起审批</View>
    </View>
  )
}