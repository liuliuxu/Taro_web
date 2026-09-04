import { useState, useEffect } from 'react'
import Taro, { useLoad, useRouter } from '@tarojs/taro'
import { View, Text, ScrollView } from '@tarojs/components'
import { AtTag, AtButton, AtModal, AtModalHeader, AtModalContent, AtModalAction, AtInput, AtRadio } from 'taro-ui'
import { machineryApi, orderApi } from '../../services/api'
import type { Machinery } from '../../types'
import './index.scss'

export default function DeviceDetail() {
  const router = useRouter()
  const [device, setDevice] = useState<Machinery | null>(null)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [orderType, setOrderType] = useState<'purchase' | 'rental'>('purchase')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useLoad(() => {
    const { id } = router.params
    if (id) {
      fetchDetail(Number(id))
    }
  })

  async function fetchDetail(id: number) {
    try {
      const data = await machineryApi.getDetail(id)
      setDevice(data)
    } catch (error) {
      console.error(error)
    }
  }

  function openOrderModal(type: 'purchase' | 'rental') {
    setOrderType(type)
    setShowOrderModal(true)
  }

  async function submitOrder() {
    if (!device) return
    if (!phone) {
      Taro.showToast({ title: '请输入联系电话', icon: 'none' })
      return
    }
    setSubmitting(true)
    try {
      await orderApi.create({
        machineryId: device.id,
        type: orderType
      })
      Taro.showToast({ title: '下单成功', icon: 'success' })
      setShowOrderModal(false)
      setPhone('')
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/profile/index' })
      }, 1500)
    } catch (error) {
      console.error(error)
    } finally {
      setSubmitting(false)
    }
  }

  if (!device) {
    return <View className='loading'>加载中...</View>
  }

  return (
    <View className='detail-page'>
      <ScrollView scrollY className='detail-scroll'>
        <View className='hero'>
          <View className='hero-placeholder'>
            <Text className='hero-text'>{device.name.charAt(0)}</Text>
          </View>
          <View className='hero-info'>
            <Text className='hero-brand'>{device.brand}</Text>
            <Text className='hero-name'>{device.name}</Text>
            <View className='hero-tags'>
              <AtTag size='small' type='primary'>{device.category}</AtTag>
              <AtTag size='small' type='default'>型号：{device.model}</AtTag>
            </View>
          </View>
        </View>

        <View className='price-card card'>
          <View className='price-row'>
            <Text className='price-label'>参考价格</Text>
            <Text className='price-value'>¥{device.price}万</Text>
          </View>
          <View className='price-row'>
            <Text className='price-label'>库存数量</Text>
            <Text className='price-stock'>{device.stock} 台</Text>
          </View>
          <View className='price-row'>
            <Text className='price-label'>设备状态</Text>
            <Text className={`status-text status-${device.status}`}>
              {device.status === 'available' ? '可购买' : device.status === 'rented' ? '已租赁' : '维护中'}
            </Text>
          </View>
        </View>

        <View className='spec-card card'>
          <Text className='section-title'>技术参数</Text>
          <View className='spec-grid'>
            <View className='spec-item'>
              <Text className='spec-label'>整机重量</Text>
              <Text className='spec-value'>{device.specs.weight}</Text>
            </View>
            <View className='spec-item'>
              <Text className='spec-label'>额定功率</Text>
              <Text className='spec-value'>{device.specs.power}</Text>
            </View>
            <View className='spec-item'>
              <Text className='spec-label'>外形尺寸</Text>
              <Text className='spec-value'>{device.specs.dimensions}</Text>
            </View>
            <View className='spec-item'>
              <Text className='spec-label'>工作容量</Text>
              <Text className='spec-value'>{device.specs.capacity}</Text>
            </View>
          </View>
        </View>

        <View className='desc-card card'>
          <Text className='section-title'>产品介绍</Text>
          <Text className='desc-text'>{device.description}</Text>
        </View>

        <View style={{ height: '140px' }} />
      </ScrollView>

      <View className='bottom-bar'>
        {device.status === 'available' && (
          <>
            <AtButton
              className='buy-btn'
              type='primary'
              onClick={() => openOrderModal('purchase')}
            >
              立即购买
            </AtButton>
            <AtButton
              className='rent-btn'
              type='secondary'
              onClick={() => openOrderModal('rental')}
            >
              申请租赁
            </AtButton>
          </>
        )}
        {device.status !== 'available' && (
          <AtButton
            type='default'
            disabled
          >
            当前不可购买
          </AtButton>
        )}
      </View>

      <AtModal
        isOpened={showOrderModal}
        onClose={() => setShowOrderModal(false)}
      >
        <AtModalHeader>
          {orderType === 'purchase' ? '确认购买' : '确认租赁'}
        </AtModalHeader>
        <AtModalContent>
          <View className='order-info'>
            <Text className='order-device'>{device.name}</Text>
            <Text className='order-price'>参考价格：¥{device.price}万</Text>
            <AtRadio
              className='order-type'
              options={[
                { label: '购买', value: 'purchase' },
                { label: '租赁', value: 'rental' }
              ]}
              value={orderType}
              onClick={(v) => setOrderType(v as 'purchase' | 'rental')}
            />
          </View>
          <AtInput
            name='phone'
            title='联系电话'
            type='phone'
            placeholder='请输入联系电话'
            value={phone}
            onChange={(v) => setPhone(String(v))}
          />
        </AtModalContent>
        <AtModalAction>
          <AtButton onClick={() => setShowOrderModal(false)}>取消</AtButton>
          <AtButton
            type='primary'
            onClick={submitOrder}
            loading={submitting}
          >
            确认提交
          </AtButton>
        </AtModalAction>
      </AtModal>
    </View>
  )
}
