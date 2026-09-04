import { useState, useEffect } from 'react'
import Taro, { useLoad } from '@tarojs/taro'
import { View, Text, Image, ScrollView, Swiper, SwiperItem } from '@tarojs/components'
import { AtSearchBar, AtTag, AtButton } from 'taro-ui'
import { machineryApi } from '../../services/api'
import type { Machinery } from '../../types'
import './index.scss'

export default function Index() {
  const [keyword, setKeyword] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [activeCategory, setActiveCategory] = useState('全部')
  const [recommendations, setRecommendations] = useState<Machinery[]>([])

  useLoad(() => {
    initData()
  })

  async function initData() {
    try {
      const cats = await machineryApi.getCategories()
      setCategories(['全部', ...cats])
      const recs = await machineryApi.getRecommendations()
      setRecommendations(recs)
    } catch (error) {
      console.error(error)
    }
  }

  function onSearch() {
    Taro.navigateTo({
      url: `/pages/device-list/index?keyword=${encodeURIComponent(keyword)}`
    })
  }

  function onChangeCategory(cat: string) {
    setActiveCategory(cat)
    Taro.navigateTo({
      url: `/pages/device-list/index${cat !== '全部' ? `?category=${encodeURIComponent(cat)}` : ''}`
    })
  }

  function goToDetail(id: number) {
    Taro.navigateTo({ url: `/pages/device-detail/index?id=${id}` })
  }

  return (
    <View className='index-page'>
      <View className='header'>
        <AtSearchBar
          value={keyword}
          onChange={(v) => setKeyword(String(v))}
          onActionClick={onSearch}
          onConfirm={onSearch}
          placeholder='搜索挖掘机、装载机等设备'
          showActionButton
        />
      </View>

      <Swiper
        className='banner'
        indicatorColor='#999'
        indicatorActiveColor='#4A90D9'
        circular
        autoplay
      >
        <SwiperItem>
          <View className='banner-item banner-1'>
            <Text className='banner-title'>重工机械设备</Text>
            <Text className='banner-subtitle'>品质保障 · 专业服务</Text>
          </View>
        </SwiperItem>
        <SwiperItem>
          <View className='banner-item banner-2'>
            <Text className='banner-title'>支持租赁与购买</Text>
            <Text className='banner-subtitle'>灵活选择 快捷交付</Text>
          </View>
        </SwiperItem>
        <SwiperItem>
          <View className='banner-item banner-3'>
            <Text className='banner-title'>全国配送</Text>
            <Text className='banner-subtitle'>专业物流 安全到达</Text>
          </View>
        </SwiperItem>
      </Swiper>

      <View className='category-section card'>
        <View className='section-header'>
          <Text className='section-title'>设备分类</Text>
        </View>
        <ScrollView scrollX className='category-scroll' showScrollbar={false}>
          <View className='category-list'>
            {categories.map((cat) => (
              <View
                key={cat}
                className={`category-item ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => onChangeCategory(cat)}
              >
                <Text>{cat}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      <View className='recommend-section'>
        <View className='section-header'>
          <Text className='section-title'>热门设备</Text>
          <Text
            className='section-more'
            onClick={() => Taro.navigateTo({ url: '/pages/device-list/index' })}
          >
            查看全部 &gt;
          </Text>
        </View>
        {recommendations.map((item) => (
          <View
            key={item.id}
            className='device-card card'
            onClick={() => goToDetail(item.id)}
          >
            <View className='device-image-placeholder'>
              <Text className='device-image-text'>{item.name.charAt(0)}</Text>
            </View>
            <View className='device-info'>
              <Text className='device-name'>{item.name}</Text>
              <View className='device-tags'>
                <AtTag size='small' type='primary'>型号：{item.model}</AtTag>
                <AtTag size='small' type='default'>{item.category}</AtTag>
              </View>
              <View className='device-footer'>
                <Text className='device-price'>¥{item.price}万</Text>
                <Text className='device-stock'>库存 {item.stock} 台</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}
