import { useState } from 'react'
import Taro from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import { AtInput, AtButton } from 'taro-ui'
import { authApi } from '../../services/api'
import './index.scss'

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!username || !password) {
      Taro.showToast({ title: '请输入账号和密码', icon: 'none' })
      return
    }
    if (mode === 'register' && !phone) {
      Taro.showToast({ title: '请输入手机号', icon: 'none' })
      return
    }
    setLoading(true)
    try {
      if (mode === 'login') {
        const data = await authApi.login({ username, password })
        Taro.setStorageSync('token', data.token)
        Taro.showToast({ title: '登录成功', icon: 'success' })
      } else {
        await authApi.register({ username, password, phone })
        const data = await authApi.login({ username, password })
        Taro.setStorageSync('token', data.token)
        Taro.showToast({ title: '注册成功', icon: 'success' })
      }
      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className='login-page'>
      <View className='login-header'>
        <Text className='app-name'>重工机械</Text>
        <Text className='app-desc'>专业重工设备服务平台</Text>
      </View>

      <View className='login-form'>
        <AtInput
          name='username'
          title='账号'
          type='text'
          placeholder='请输入账号'
          value={username}
          onChange={(v) => setUsername(String(v))}
        />
        <AtInput
          name='password'
          title='密码'
          type='password'
          placeholder='请输入密码'
          value={password}
          onChange={(v) => setPassword(String(v))}
        />
        {mode === 'register' && (
          <AtInput
            name='phone'
            title='手机号'
            type='phone'
            placeholder='请输入手机号'
            value={phone}
            onChange={(v) => setPhone(String(v))}
          />
        )}

        <View className='mode-switch'>
          <Text
            className={`mode-link ${mode === 'login' ? 'active' : ''}`}
            onClick={() => setMode('login')}
          >
            登录
          </Text>
          <Text className='mode-divider'>|</Text>
          <Text
            className={`mode-link ${mode === 'register' ? 'active' : ''}`}
            onClick={() => setMode('register')}
          >
            注册
          </Text>
        </View>

        <AtButton
          type='primary'
          onClick={handleSubmit}
          loading={loading}
          className='submit-btn'
        >
          {mode === 'login' ? '登 录' : '注 册'}
        </AtButton>
      </View>
    </View>
  )
}
