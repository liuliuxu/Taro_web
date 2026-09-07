import { useState, useEffect } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { View, Text, ScrollView } from '@tarojs/components'
import { machineryApi, workOrderApi, authApi } from '../../services/api'
import type { User, WorkOrder, WorkOrderStats } from '../../types'
import { statusLabel, typeLabel, statusColor, statusBg } from '../../utils/workOrderMeta'
import { getCategoryTheme } from '../../utils/deviceVisual'
import './index.scss'

export default function Index() {
  const [user, setUser] = useState<User | null>(null)
  const [loggedIn, setLoggedIn] = useState(false)
  const [stats, setStats] = useState<WorkOrderStats | null>(null)
  const [todos, setTodos] = useState<WorkOrder[]>([])
  const [deviceCount, setDeviceCount] = useState(0)

  useDidShow(() => {
    loadEverything()
  })

  async function loadEverything() {
    const token = Taro.getStorageSync('token')
    setLoggedIn(!!token)
    if (!token) return

    try {
      const profile = await authApi.getProfile()
      setUser(profile)
    } catch (e) {
      /* ignore */
    }
    try {
      const s = await workOrderApi.getStats()
      setStats(s)
    } catch (e) {
      /* ignore */
    }
    try {
      const t = await workOrderApi.getMyTodos()
      setTodos(t.slice(0, 3))
    } catch (e) {
      /* ignore */
    }
    try {
      const d = await machineryApi.getList({ page: 1, pageSize: 1 })
      setDeviceCount(d.total)
    } catch (e) {
      /* ignore */
    }
  }

  function goTo(url: string) {
    Taro.navigateTo({ url })
  }

  function switchTo(url: string) {
    Taro.switchTab({ url })
  }

  function requireLogin() {
    if (!loggedIn) {
      Taro.navigateTo({ url: '/pages/login/index' })
      return false
    }
    return true
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? '上午好' : hour < 18 ? '下午好' : '晚上好'

  function StatCard({ label, value, color, onClick }: { label: string; value: string | number; color: string; onClick?: () => void }) {
    return (
      <View className='stat-card' onClick={onClick} hoverClass='stat-card-hover'>
        <Text className='stat-value' style={{ color }}>{value}</Text>
        <Text className='stat-label'>{label}</Text>
      </View>
    )
  }

  return (
    <ScrollView scrollY className='home-page'>
      {/* 顶部深色区 */}
      <View className='hero'>
        <View className='hero-top flex-between'>
          <View className='hero-user'>
            <View className='hero-avatar'>{user?.nickname?.charAt(0) || '重'}</View>
            <View className='hero-user-info'>
              <Text className='hero-name'>{loggedIn ? `${greeting}，${user?.nickname || '用户'}` : '欢迎使用'}</Text>
              <Text className='hero-sub'>{loggedIn ? (user?.role === 'admin' ? '系统管理员' : user?.role === 'manager' ? '设备负责人' : '一线作业人员') : '请先登录以使用完整功能'}</Text>
            </View>
          </View>
          {!loggedIn ? (
            <View className='login-chip' onClick={() => goTo('/pages/login/index')}>登录</View>
          ) : (
            <View className='hero-badge'>企业版</View>
          )}
        </View>

        {/* 统计卡 */}
        <View className='stat-grid'>
          <StatCard label='设备总数' value={deviceCount} color='#FFFFFF' />
          <StatCard label='待办工单' value={stats?.myTodos ?? 0} color='#FFD9B8' />
          <StatCard label='处理中' value={(stats?.assigned ?? 0) + (stats?.processing ?? 0)} color='#BBDCFF' />
          <StatCard label='已完成' value={stats?.done ?? 0} color='#C8F7DE' />
        </View>
      </View>

      {/* 快捷入口 */}
      <View className='quick-panel'>
        <Text className='panel-title'>快捷操作</Text>
        <View className='quick-grid'>
          <View className='quick-item' hoverClass='quick-hover' onClick={() => requireLogin() && goTo('/pages/workorder-create/index?type=repair')}>
            <View className='quick-icon qi-report'>报</View>
            <Text className='quick-text'>我要报修</Text>
          </View>
          <View className='quick-item' hoverClass='quick-hover' onClick={() => requireLogin() && goTo('/pages/workorder-create/index?type=maintain')}>
            <View className='quick-icon qi-maintain'>养</View>
            <Text className='quick-text'>保养工单</Text>
          </View>
          <View className='quick-item' hoverClass='quick-hover' onClick={() => requireLogin() && switchTo('/pages/workorder-list/index')}>
            <View className='quick-icon qi-todo'>单</View>
            <Text className='quick-text'>工单管理</Text>
          </View>
          <View className='quick-item' hoverClass='quick-hover' onClick={() => requireLogin() && switchTo('/pages/device-list/index')}>
            <View className='quick-icon qi-device'>备</View>
            <Text className='quick-text'>设备台账</Text>
          </View>
          <View className='quick-item' hoverClass='quick-hover' onClick={() => requireLogin() && goTo('/pages/project-list/index')}>
            <View className='quick-icon qi-project'>程</View>
            <Text className='quick-text'>工程项目</Text>
          </View>
          <View className='quick-item' hoverClass='quick-hover' onClick={() => requireLogin() && goTo('/pages/rental-list/index')}>
            <View className='quick-icon qi-rental'>租</View>
            <Text className='quick-text'>租赁管理</Text>
          </View>
        </View>
      </View>

      {/* 我的待办 */}
      <View className='section'>
        <View className='section-head flex-between'>
          <Text className='section-title'>我的待办</Text>
          <Text className='section-more' onClick={() => requireLogin() && switchTo('/pages/workorder-list/index')}>全部 ›</Text>
        </View>
        {!loggedIn ? (
          <View className='empty'>登录后查看我的待办工单</View>
        ) : todos.length === 0 ? (
          <View className='empty'>暂无待办，一切正常</View>
        ) : (
          todos.map((t) => (
            <View key={t.id} className='todo-card' hoverClass='todo-hover' onClick={() => goTo(`/pages/workorder-detail/index?id=${t.id}`)}>
              <View className='todo-left'>
                <Text className='todo-status' style={{ color: statusColor(t.status), background: statusBg(t.status) }}>{statusLabel(t.status)}</Text>
                <View className='todo-body'>
                  <Text className='todo-title'>{t.title}</Text>
                  <Text className='todo-meta'>{typeLabel(t.type)} · {t.machineryName}</Text>
                </View>
              </View>
              <View className={`prio prio-${t.priority}`} />
            </View>
          ))
        )}
      </View>

      {/* 分类浏览 */}
      <View className='section'>
        <View className='section-head flex-between'>
          <Text className='section-title'>设备分类</Text>
          <Text className='section-more' onClick={() => switchTo('/pages/device-list/index')}>全部 ›</Text>
        </View>
        <ScrollView scrollX className='category-scroll' showScrollbar={false}>
          <View className='category-row'>
            {['挖掘机', '装载机', '破碎锤', '自卸车', '泵车', '塔吊', '推土机', '压路机', '钻机'].map((c) => {
              const theme = getCategoryTheme(c)
              return (
                <View key={c} className='category-chip' onClick={() => goTo(`/pages/device-list/index?category=${encodeURIComponent(c)}`)}>
                  <View className='category-dot' style={{ background: `linear-gradient(135deg, ${theme.from}, ${theme.to})` }}>
                    <Text className='category-dot-text'>{theme.icon}</Text>
                  </View>
                  <Text className='category-chip-text'>{c}</Text>
                </View>
              )
            })}
          </View>
        </ScrollView>
      </View>

      <View style={{ height: '30px' }} />
    </ScrollView>
  )
}
