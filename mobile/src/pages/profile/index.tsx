import { useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { View, Text, ScrollView } from '@tarojs/components'
import { authApi, workOrderApi, machineryApi } from '../../services/api'
import type { User, WorkOrder } from '../../types'
import { statusLabel, statusColor, statusBg, typeLabel } from '../../utils/workOrderMeta'
import './index.scss'

export default function Profile() {
  const [user, setUser] = useState<User | null>(null)
  const [loggedIn, setLoggedIn] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [todos, setTodos] = useState<WorkOrder[]>([])

  useDidShow(() => {
    const token = Taro.getStorageSync('token')
    setLoggedIn(!!token)
    if (token) {
      loadData()
    }
  })

  async function loadData() {
    try {
      const p = await authApi.getProfile()
      setUser(p)
    } catch (e) {
      Taro.removeStorageSync('token')
      setLoggedIn(false)
    }
    try {
      setStats(await workOrderApi.getStats())
    } catch (e) { /* ignore */ }
    try {
      setTodos((await workOrderApi.getMyTodos()).slice(0, 3))
    } catch (e) { /* ignore */ }
  }

  const roleLabel = user?.role === 'admin' ? '管理员' : user?.role === 'manager' ? '设备负责人' : user?.role === 'operator' ? '作业人员' : '成员'

  function logout() {
    Taro.showModal({
      title: '退出登录',
      content: '确定要退出当前账号吗？',
      success: (r) => {
        if (r.confirm) {
          Taro.removeStorageSync('token')
          setLoggedIn(false)
          setUser(null)
          Taro.showToast({ title: '已退出', icon: 'none' })
        }
      }
    })
  }

  const menuItems = [
    { label: '设备台账', value: '查看全部设备', action: () => Taro.switchTab({ url: '/pages/device-list/index' }) },
    { label: '工单管理', value: '报修 / 派单 / 处理', action: () => Taro.switchTab({ url: '/pages/workorder-list/index' }) },
    { label: '新建工单', value: '发起报修或保养', action: () => Taro.navigateTo({ url: '/pages/workorder-create/index' }) },
    { label: '工程项目', value: '立项 / 进度 / 调度', action: () => Taro.navigateTo({ url: '/pages/project-list/index' }) },
    { label: '我的任务', value: '派发给我的调度任务', action: () => Taro.navigateTo({ url: '/pages/task-list/index' }) },
    { label: '租赁管理', value: '租赁合同 / 登记归还', action: () => Taro.navigateTo({ url: '/pages/rental-list/index' }) }
  ]

  return (
    <ScrollView scrollY className='profile-page'>
      {/* 头部 */}
      <View className='profile-hero'>
        {loggedIn && user ? (
          <View className='profile-user'>
            <View className='profile-avatar'>{user.nickname?.charAt(0) || user.username.charAt(0)}</View>
            <View className='profile-user-info'>
              <Text className='profile-name'>{user.nickname || user.username}</Text>
              <Text className='profile-role'>{roleLabel} · 企业成员</Text>
            </View>
          </View>
        ) : (
          <View className='profile-user' onClick={() => Taro.navigateTo({ url: '/pages/login/index' })}>
            <View className='profile-avatar guest'>?</View>
            <View className='profile-user-info'>
              <Text className='profile-name'>未登录</Text>
              <Text className='profile-role'>点击登录进入工作台</Text>
            </View>
          </View>
        )}
      </View>

      {loggedIn && (
        <>
          {/* 我的统计 */}
          <View className='stat-card'>
            <View className='stat-item'>
              <Text className='stat-num'>{stats?.total ?? 0}</Text>
              <Text className='stat-label'>工单总数</Text>
            </View>
            <View className='stat-divider' />
            <View className='stat-item'>
              <Text className='stat-num orange'>{stats?.myTodos ?? 0}</Text>
              <Text className='stat-label'>我的待办</Text>
            </View>
            <View className='stat-divider' />
            <View className='stat-item'>
              <Text className='stat-num green'>{stats?.done ?? 0}</Text>
              <Text className='stat-label'>已完成</Text>
            </View>
          </View>

          {/* 我的待办 */}
          <View className='section'>
            <View className='section-head'>
              <Text className='section-title'>我的待办</Text>
              <Text className='section-more' onClick={() => Taro.switchTab({ url: '/pages/workorder-list/index' })}>全部 ›</Text>
            </View>
            {todos.length === 0 ? (
              <View className='empty'>暂无待办，一切正常</View>
            ) : (
              todos.map((t) => (
                <View key={t.id} className='todo-item' onClick={() => Taro.navigateTo({ url: `/pages/workorder-detail/index?id=${t.id}` })}>
                  <View className='todo-item-left'>
                    <Text className='todo-item-status' style={{ color: statusColor(t.status), background: statusBg(t.status) }}>{statusLabel(t.status)}</Text>
                    <View className='todo-item-body'>
                      <Text className='todo-item-title'>{t.title}</Text>
                      <Text className='todo-item-meta'>{typeLabel(t.type)} · {t.machineryName}</Text>
                    </View>
                  </View>
                  <Text className='todo-item-arrow'>›</Text>
                </View>
              ))
            )}
          </View>
        </>
      )}

      {/* 功能菜单 */}
      <View className='section'>
        <View className='section-head'>
          <Text className='section-title'>功能入口</Text>
        </View>
        <View className='menu-card'>
          {menuItems.map((m, i) => (
            <View key={m.label} className={`menu-item ${i === menuItems.length - 1 ? 'menu-last' : ''}`} onClick={m.action}>
              <Text className='menu-label'>{m.label}</Text>
              <View className='menu-right'>
                <Text className='menu-value'>{m.value}</Text>
                <Text className='menu-arrow'>›</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* 关于 */}
      <View className='section'>
        <View className='menu-card'>
          <View className='menu-item menu-last'>
            <Text className='menu-label'>版本</Text>
            <View className='menu-right'>
              <Text className='menu-value'>v1.1 企业内部版</Text>
            </View>
          </View>
        </View>
      </View>

      {loggedIn && (
        <View className='logout-btn' onClick={logout}>退出登录</View>
      )}
      {!loggedIn && (
        <View className='logout-btn primary' onClick={() => Taro.navigateTo({ url: '/pages/login/index' })}>立即登录</View>
      )}
      <View style={{ height: '40px' }} />
    </ScrollView>
  )
}
