import { useState } from 'react'
import Taro, { useDidShow, useRouter } from '@tarojs/taro'
import { View, Text, Input, ScrollView } from '@tarojs/components'
import { machineryApi } from '../../services/api'
import type { Machinery } from '../../types'
import { getCategoryTheme } from '../../utils/deviceVisual'
import './index.scss'

const CATEGORIES = ['全部', '挖掘机', '装载机', '破碎锤', '自卸车', '泵车', '塔吊', '推土机', '压路机', '钻机']

export default function DeviceList() {
  const router = useRouter()
  const [list, setList] = useState<Machinery[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState((router.params.category as string) || '全部')
  const [loading, setLoading] = useState(false)
  const [pageSize] = useState(10)

  useDidShow(() => {
    load(1)
  })

  async function load(p: number, kw?: string, cat?: string) {
    setLoading(true)
    try {
      const params: any = { page: p, pageSize }
      const k = kw !== undefined ? kw : keyword
      const c = cat !== undefined ? cat : category
      if (k) params.keyword = k
      if (c && c !== '全部') params.category = c
      const res = await machineryApi.getList(params)
      setPage(p)
      setTotal(res.total)
      setList(p === 1 ? res.list : [...list, ...res.list])
    } catch (e) {
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  function onSearch(v: string) {
    setKeyword(v)
    load(1, v)
  }

  function onCategory(c: string) {
    setCategory(c)
    load(1, undefined, c)
  }

  function goDetail(id: number) {
    Taro.navigateTo({ url: `/pages/device-detail/index?id=${id}` })
  }

  function onReachBottom() {
    if (loading || list.length >= total) return
    load(page + 1)
  }

  const statusMap: Record<string, string> = {
    available: '在册',
    rented: '外派中',
    maintenance: '维修中'
  }

  return (
    <View className='device-list'>
      <View className='search-bar'>
        <Input
          className='search-input'
          placeholder='搜索设备名称 / 型号 / 品牌'
          value={keyword}
          onInput={(e) => onSearch(e.detail.value)}
          confirmType='search'
        />
      </View>

      <ScrollView scrollX className='cat-scroll' showScrollbar={false}>
        <View className='cat-row'>
          {CATEGORIES.map((c) => (
            <View
              key={c}
              className={`cat-chip ${category === c ? 'cat-chip-on' : ''}`}
              onClick={() => onCategory(c)}
            >
              {c}
            </View>
          ))}
        </View>
      </ScrollView>

      <ScrollView scrollY className='device-scroll' onScrollToLower={onReachBottom}>
        <View className='count-line'>共 {total} 台设备</View>
        {list.map((m) => {
          const theme = getCategoryTheme(m.category)
          return (
            <View key={m.id} className='device-card' hoverClass='device-hover' onClick={() => goDetail(m.id)}>
              <View className='device-thumb' style={{ background: `linear-gradient(135deg, ${theme.from}, ${theme.to})` }}>
                <Text className='device-thumb-icon'>{theme.icon}</Text>
              </View>
              <View className='device-info'>
                <View className='device-info-top'>
                  <Text className='device-name'>{m.name}</Text>
                  <Text className='device-status'>{statusMap[m.status] || m.status}</Text>
                </View>
                <Text className='device-model'>{m.brand} · {m.model} · {m.category}</Text>
                <View className='device-specs'>
                  <Text className='spec'>自重 {m.specs?.weight || '-'}t</Text>
                  <Text className='spec'>功率 {m.specs?.power || '-'}kW</Text>
                  <Text className='spec'>容量 {m.specs?.capacity || '-'}</Text>
                </View>
              </View>
            </View>
          )
        })}
        {loading && <View className='load-tip'>加载中...</View>}
        {!loading && list.length > 0 && list.length >= total && (
          <View className='load-tip'>— 已全部加载 —</View>
        )}
        {!loading && list.length === 0 && <View className='load-tip'>暂无设备</View>}
      </ScrollView>
    </View>
  )
}
