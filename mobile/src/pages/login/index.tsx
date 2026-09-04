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
        <View className='login-logo'>重</View>
        <Text className='login-app'>重工设备管理</Text>
        <Text className='login-slogan'>企业内部 · 设备台账 · 维修闭环</Text>
      </View>

      <View className='login-form'>
        <Text className='login-form-title'>账号登录</Text>

        <View className='field'>
          <Text className='field-icon'>👤</Text>
          <Input className='field-input' placeholder='请输入账号' value={username} onInput={(e) => setUsername(e.detail.value)} />
        </View>

        <View className='field'>
          <Text className='field-icon'>🔒</Text>
          <Input className='field-input' password placeholder='请输入密码' value={password} onInput={(e) => setPassword(e.detail.value)} />
        </View>

        <View className={`login-btn ${loading ? 'login-btn-disabled' : ''}`} onClick={login}>
          {loading ? '登录中...' : '登 录'}
        </View>

        <View className='test-accounts'>
          <Text className='test-tip'>测试账号：admin/admin123 · manager/manager123 · operator/operator123</Text>
        </View>
      </View>
    </View>
  )
}
