import { useState, useEffect } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { View, Text, ScrollView } from '@tarojs/components'
import { authApi, workOrderApi } from '../../services/api'
import type { User } from '../../types'
import { applyTheme } from '../../app'
import './index.scss'

const THEMES = [
  { key: 'dark', label: '深色模式', desc: '护眼夜间主题' },
  { key: 'light', label: '浅色模式', desc: '默认明亮主题' },
  { key: 'green', label: '墨绿主题', desc: '深邃墨绿强调色' },
  { key: 'blue', label: '科技蓝主题', desc: '科技蓝强调色' }
]

const CUSTOM_COLORS = ['#FF5A2E', '#16A34A', '#0E86D4', '#ED8936', '#8B5CF6', '#D6336C']

const PRESET_ORANGE = '#FF6B1A'

function isCustomColor(v: unknown): v is string {
  return typeof v === 'string' && v.startsWith('#')
}

export default function Profile() {
  const [user, setUser] = useState<User | null>(null)
  const [loggedIn, setLoggedIn] = useState(false)
  // 默认用户防止渲染时 user 为 null
  const defaultUser: User = {
    id: 0, username: '游客', nickname: '游客', phone: '', email: '', role: 'customer',
    avatar: '', createdAt: '', hireDate: '', workYears: 0, annualLeave: 0, compensatoryLeave: 0, overtime: 0
  }
  // 统一使用 safeUser，保证永远不为 null
  const safeUser = user || defaultUser
  const [stats, setStats] = useState<any>(null)

  useDidShow(() => {
    const token = Taro.getStorageSync('token')
    setLoggedIn(!!token)
    if (token) {
      loadData()
    }
  })

  useEffect(() => {
    // 确保 loggedIn 为 true 时 user 永不为 null
    if (loggedIn && user === null) {
      setUser(defaultUser)
    }
  }, [loggedIn, user])

  async function loadData() {
    try {
      const p = await authApi.getProfile()
      setUser(p || defaultUser)
    } catch (e) {
      Taro.removeStorageSync('token')
      setLoggedIn(false)
      setUser(defaultUser)
    }
    try {
      setStats(await workOrderApi.getStats())
    } catch (e) { /* ignore */ }
  }

  const roleLabel = safeUser.role === 'admin' ? '管理员'
    : safeUser.role === 'manager' ? '设备负责人'
    : safeUser.role === 'operator' ? '作业人员'
    : '成员'

  function logout() {
    Taro.showModal({
      title: '退出登录',
      content: '确定要退出当前账号吗？',
      success: (r) => {
        if (r.confirm) {
          Taro.removeStorageSync('token')
          setLoggedIn(false)
          // 先跳转，再清理 state，避免渲染报错
          Taro.reLaunch({ url: '/pages/login/index' })
          setUser(null)
          Taro.showToast({ title: '已退出', icon: 'none' })
        }
      }
    })
  }

  const [themeKey, setThemeKey] = useState('orange')
  const [modeKey, setModeKey] = useState('light')
  useDidShow(() => {
    setThemeKey(Taro.getStorageSync('themeColor') || 'orange')
    setModeKey(Taro.getStorageSync('theme') || 'light')
  })

  function pickTheme(t: string) {
    if (t === 'dark' || t === 'light') {
      Taro.setStorageSync('theme', t)
      setModeKey(t)
    } else {
      Taro.setStorageSync('themeColor', t)
      setThemeKey(t)
    }
    applyTheme()
    Taro.showToast({ title: '主题已切换', icon: 'none' })
  }

  // 跳转到编辑资料页
  function goEditProfile() {
    Taro.navigateTo({ url: '/pages/edit-profile/index' })
  }

  // 只有 loggedIn && user 时才渲染已登录内容
  const showLoggedInContent = loggedIn && user

  return (
    <ScrollView scrollY className='profile-page'>
      {/* 头部 */}
      <View className='profile-hero'>
        {showLoggedInContent ? (
          <View className='profile-user'>
            <View className='profile-avatar'>{safeUser.nickname?.charAt(0) || safeUser.username.charAt(0)}</View>
            <View className='profile-user-info'>
              <Text className='profile-name'>{safeUser.nickname || safeUser.username}</Text>
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

      {showLoggedInContent && (
        <>
          {/* 我的统计 */}
          <View className='pf-stat-card'>
            <View className='pf-stat-item'>
              <Text className='pf-stat-num'>{stats?.total ?? 0}</Text>
              <Text className='pf-stat-label'>工单总数</Text>
            </View>
            <View className='pf-stat-divider' />
            <View className='pf-stat-item'>
              <Text className='pf-stat-num orange'>{stats?.myTodos ?? 0}</Text>
              <Text className='pf-stat-label'>我的待办</Text>
            </View>
            <View className='pf-stat-divider' />
            <View className='pf-stat-item'>
              <Text className='pf-stat-num green'>{stats?.done ?? 0}</Text>
              <Text className='pf-stat-label'>已完成</Text>
            </View>
          </View>

          {/* 我的资料 - 合并为单卡片，点击跳转详情页 */}
          <View className='section' onClick={goEditProfile}>
            <View className='section-head flex-between'>
              <Text className='section-title'>我的资料</Text>
              <Text className='section-more'>查看详情 ›</Text>
            </View>
            <View className='profile-info-card'>
              <View className='profile-info-main'>
                <View className='profile-info-avatar'>{safeUser.nickname?.charAt(0) || safeUser.username.charAt(0)}</View>
                <View className='profile-info-text'>
                  <Text className='profile-info-name'>{safeUser.nickname || safeUser.username}</Text>
                  <Text className='profile-info-role'>{roleLabel}</Text>
                  <Text className='profile-info-phone'>{safeUser.phone || '未填写手机号'}</Text>
                </View>
              </View>
              <View className='profile-info-stats'>
                <View className='profile-info-stat'>
                  <Text className='profile-info-stat-label'>工龄</Text>
                  <Text className='profile-info-stat-value'>{safeUser.workYears != null ? `${safeUser.workYears} 年` : '—'}</Text>
                </View>
                <View className='profile-info-stat'>
                  <Text className='profile-info-stat-label'>年假</Text>
                  <Text className='profile-info-stat-value'>{safeUser.annualLeave != null ? `${safeUser.annualLeave} 天` : '—'}</Text>
                </View>
                <View className='profile-info-stat'>
                  <Text className='profile-info-stat-label'>调休</Text>
                  <Text className='profile-info-stat-value'>{safeUser.compensatoryLeave != null ? `${safeUser.compensatoryLeave} 小时` : '—'}</Text>
                </View>
                <View className='profile-info-stat'>
                  <Text className='profile-info-stat-label'>加班</Text>
                  <Text className='profile-info-stat-value'>{safeUser.overtime != null ? `${safeUser.overtime} 小时` : '—'}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 主题设置 */}
          <View className='section'>
            <View className='section-head'>
              <Text className='section-title'>主题设置</Text>
            </View>
            <View className='menu-card'>
              {THEMES.map((t, i) => (
                <View key={t.key} className={`menu-item ${i === THEMES.length - 1 ? 'menu-last' : ''}`} onClick={() => pickTheme(t.key)}>
                  <Text className='menu-label'>{t.label}</Text>
                  <View className='menu-right'>
                    <Text className='menu-value'>{t.desc}</Text>
                    <Text className='menu-arrow'>{(t.key === 'dark' || t.key === 'light') ? (modeKey === t.key ? '✓' : '›') : (themeKey === t.key ? '✓' : '›')}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* 自定义主题色 */}
            <View className='theme-colors'>
              {[PRESET_ORANGE, ...CUSTOM_COLORS].map((c) => {
                const active = isCustomColor(themeKey) ? c.toLowerCase() === themeKey.toLowerCase() : (!themeKey || themeKey === 'orange') && c === PRESET_ORANGE
                return (
                  <View key={c} className={`theme-color-dot ${active ? 'on' : ''}`} style={{ background: c }} onClick={() => pickTheme(c)} />
                )
              })}
            </View>
            <Text className='theme-colors-tip'>选择强调色，橙色为默认主题</Text>
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

          <View className='logout-btn' onClick={logout}>退出登录</View>
          <View style={{ height: '40px' }} />
        </>
      )}
    </ScrollView>
  )
}