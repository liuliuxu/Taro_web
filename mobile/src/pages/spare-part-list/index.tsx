import { useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { View, Text, ScrollView, Input } from '@tarojs/components'
import { sparePartApi } from '../../services/api'
import type { SparePart } from '../../types'
import { fmtMoney } from '../../utils/bizMeta'
import './index.scss'

export default function SparePartList() {
  const [list, setList] = useState<SparePart[]>([])
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)

  useDidShow(() => load())

  function load() {
    setLoading(true)
    sparePartApi.list({ keyword })
      .then(setList)
      .catch((e) => Taro.showToast({ title: e?.message || '加载失败', icon: 'none' }))
      .finally(() => setLoading(false))
  }

  return (
    <View className='sp-page'>
      <View className='sp-search'>
        <Input className='sp-input' placeholder='搜索备件名称/编号' value={keyword}
          onInput={(e) => setKeyword(e.detail.value)} onConfirm={() => load()} confirmType='search' />
        <View className='sp-search-btn' onClick={() => load()}>查询</View>
      </View>
      <ScrollView scrollY className='sp-scroll'>
        {list.length === 0 && !loading && <View className='sp-empty'>暂无备件</View>}
        {list.map((p) => {
          const low = p.minStock != null && p.stockQty != null && p.stockQty < p.minStock
          return (
            <View key={p.id} className='sp-card'>
              <View className='sp-top'>
                <Text className='sp-name'>{p.name} <Text className='sp-no'>#{p.partNo}</Text></Text>
                <Text className={`sp-stock ${low ? 'sp-low' : ''}`}>{p.stockQty ?? 0} {p.unit || ''}{low ? '' : ''}</Text>
              </View>
              <Text className='sp-meta'>{p.category || '—'} · {p.spec || '无规格'}</Text>
              <View className='sp-info'>
                <Text className='sp-meta'>库房：{p.warehouse || '—'}</Text>
                <Text className='sp-meta'>单价：{fmtMoney(p.price)} 元</Text>
                <Text className='sp-meta'>{low ? `⚠ 库存低于安全线（${p.minStock}）` : `安全库存：${p.minStock ?? 0}`}</Text>
              </View>
            </View>
          )
        })}
        {loading && <View className='sp-empty'>加载中...</View>}
      </ScrollView>
    </View>
  )
}