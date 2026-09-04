import { useState, useEffect } from 'react'
import Taro, { useLoad, useDidShow } from '@tarojs/taro'
import { View, Text, Image } from '@tarojs/components'
import { AtList, AtListItem, AtAvatar, AtTag } from 'taro-ui'
import { authApi, orderApi } from '../../services/api'
import type { User, Order } from '../../types'
import './index.scss'

export default function Profile() {
  const [user, setUser] = useState<User | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useDidShow(() => {
    checkLogin()
  })

  async function checkLogin() {
    const token = Taro.getStorageSync('token')
    if (token) {
      setIsLoggedIn(true)
      loadUser()
      loadOrders()
    } else {
      setIsLoggedIn(false)
    }
  }

  async function loadUser() {
    try {
      const data = await authApi.getProfile()
      setUser(data)
    } catch (error) {
      console.error(error)
    }
  }

  async function loadOrders() {
    try {
      const data = await orderApi.getMyOrders()
      setOrders(data)
    } catch (error) {
      console.error(error)
    }
  }

  function goToLogin() {
    Taro.navigateTo({ url: '/pages/login/index' })
  }

  function logout() {
    Taro.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          Taro.removeStorageSync('token')
          setUser(null)
          setIsLoggedIn(false)
          setOrders([])
        }
      }
    })
  }

  const pendingOrders = orders.filter((o) => o.status === 'pending').length
  const paidOrders = orders.filter((o) => o.status === 'paid' || o.status === 'shipped').length
  const completedOrders = orders.filter((o) => o.status === 'completed').length

  return (
    <View className='profile-page'>
      <View className='profile-header'>
        {isLoggedIn && user ? (
          <View className='user-info'>
            <AtAvatar
              className='user-avatar'
              circle
              text={user.nickname?.charAt(0) || '用'}
            />
            <View className='user-detail'>
              <Text className='user-name'>{user.nickname}</Text>
              <Text className='user-phone'>{user.phone}</Text>
            </View>
            {user.role === 'admin' && (
              <AtTag size='small' type='primary'>管理员</AtTag>
            )}
          </View>
        ) : (
          <View className='login-info' onClick={goToLogin}>
            <AtAvatar className='user-avatar' circle text='登' />
            <Text className='login-text'>点击登录</Text>
          </View>
        )}
      </View>

      <View className='order-stats card'>
        <Text className='section-title'>我的订单</Text>
        <View className='stats-row'>
          <View className='stat-item'>
            <Text className='stat-num'>{pendingOrders}</Text>
            <Text className='stat-label'>待处理</Text>
          </View>
          <View className='stat-item'>
            <Text className='stat-num'>{paidOrders}</Text>
            <Text className='stat-label'>进行中</Text>
          </View>
          <View className='stat-item'>
            <Text className='stat-num'>{completedOrders}</Text>
            <Text className='stat-label'>已完成</Text>
          </View>
        </View>
      </View>

      <View className='menu-card card'>
        <AtList>
          <AtListItem
            title='我的订单'
            arrow='right'
            onClick={() => Taro.showToast({ title: '功能开发中', icon: 'none' })}
          />
          <AtListItem
            title='设备收藏'
            arrow='right'
            onClick={() => Taro.showToast({ title: '功能开发中', icon: 'none' })}
          />
          <AtListItem
            title='售后服务'
            arrow='right'
            onClick={() => Taro.showToast({ title: '功能开发中', icon: 'none' })}
          />
          <AtListItem
            title='帮助与反馈'
            arrow='right'
            onClick={() => Taro.showToast({ title: '功能开发中', icon: 'none' })}
          />
          <AtListItem
            title='关于我们'
            arrow='right'
            onClick={() => Taro.showToast({ title: '重工机械设备商城 v1.0.0', icon: 'none' })}
          />
        </AtList>
      </View>

      {isLoggedIn && (
        <View className='logout-btn'>
          <AtListItem
            title='退出登录'
            onClick={logout}
          />
        </View>
      )}
    </View>
  )
}
