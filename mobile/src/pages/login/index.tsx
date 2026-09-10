import { useState } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Input } from '@tarojs/components'
import { authApi } from '../../services/api'
import './index.scss'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function login() {
    if (!username.trim() || !password) {
      Taro.showToast({ title: '请输入账号和密码', icon: 'none' })
      return
    }
    setLoading(true)
    try {
      const res = await authApi.login({ username: username.trim(), password })
      Taro.setStorageSync('token', res.token)
      Taro.showToast({ title: '登录成功', icon: 'success' })
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/index/index' })
      }, 700)
    } catch (e: any) {
      Taro.showToast({ title: e?.message || '登录失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className='login-page'>
      <View className='login-hero'>
        <View className='login-logo'>机</View>
        <Text className='login-app'>机械管理</Text>
        <Text className='login-slogan'>企业内部 · 设备台账 · 维修闭环</Text>
      </View>

      <View className='login-card'>
        <Text className='login-card-title'>账号登录</Text>

        <View className='field'>
          <View className='field-icon'>
            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
              <path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' />
              <circle cx='12' cy='7' r='4' />
            </svg>
          </View>
          <Input className='field-input' placeholder='请输入账号' value={username} onInput={(e) => setUsername(e.detail.value)} />
        </View>

        <View className='field'>
          <View className='field-icon'>
            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
              <rect x='3' y='11' width='18' height='11' rx='2' ry='2' />
              <path d='M7 11V7a5 5 0 0 1 10 0v4' />
            </svg>
          </View>
          <Input className='field-input' password placeholder='请输入密码' value={password} onInput={(e) => setPassword(e.detail.value)} />
        </View>

        <View className={`login-btn ${loading ? 'login-btn-disabled' : ''}`} onClick={login}>
          {loading ? (
            <View className='login-btn-loading'>
              <View className='login-spinner' />
              <Text>登录中</Text>
            </View>
          ) : '登 录'}
        </View>

        <View className='test-accounts'>
          <Text className='test-tip'>测试账号：admin / admin123{'\n'}manager / manager123 · operator / operator123</Text>
        </View>
      </View>

      <View className='login-footer'>机械一体化管理平台 v1.0</View>
    </View>
  )
}
