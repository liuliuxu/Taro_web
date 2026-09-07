import { useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { View, Text, ScrollView } from '@tarojs/components'
import { announceApi } from '../../services/api'
import type { Announcement } from '../../types'
import './index.scss'

export default function AnnouncementList() {
  const [list, setList] = useState<Announcement[]>([])
  const [openId, setOpenId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  useDidShow(() => load())

  async function load() {
    setLoading(true)
    try {
      setList(await announceApi.list())
    } catch (e: any) {
      Taro.showToast({ title: e?.message || '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className='an-page'>
      <ScrollView scrollY className='an-scroll'>
        {list.length === 0 && !loading && <View className='an-empty'>暂无公告</View>}
        {list.map((a) => (
          <View key={a.id} className='an-card' onClick={() => setOpenId(openId === a.id ? null : a.id)}>
            <View className='an-top'>
              <Text className='an-type'>{a.type === 'notice' ? '公告' : '通知'}</Text>
              <Text className='an-title'>{a.title}</Text>
            </View>
            <View className='an-meta'>
              <Text>{a.publisherName || '系统'} · {(a.createdAt || '').replace('T', ' ').slice(0, 16)}</Text>
            </View>
            {openId === a.id && (
              <View className='an-content'>
                <Text>{a.content || ''}</Text>
              </View>
            )}
          </View>
        ))}
        {loading && <View className='an-empty'>加载中...</View>}
      </ScrollView>
    </View>
  )
}