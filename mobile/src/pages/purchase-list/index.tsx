import { useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { View, Text, ScrollView } from '@tarojs/components'
import { purchaseApi } from '../../services/api'
import type { PurchaseOrder } from '../../types'
import { fmtMoney } from '../../utils/bizMeta'
import './index.scss'

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: '待审批', color: '#F59E0B', bg: '#FEF3E2' },
  approved: { label: '已审批', color: '#3B82F6', bg: '#EAF2FE' },
  rejected: { label: '已驳回', color: '#EF4444', bg: '#FDECEC' },
  paid: { label: '已付款', color: '#8B5CF6', bg: '#F1EBFE' },
  received: { label: '已入库', color: '#0E9F6E', bg: '#E7F8F0' },
  cancelled: { label: '已取消', color: '#98A5B3', bg: '#EEF1F4' }
}

export default function PurchaseList() {
  const [list, setList] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(false)

  useDidShow(() => load())

  async function load() {
    setLoading(true)
    try {
      setList(await purchaseApi.list())
    } catch (e: any) {
      Taro.showToast({ title: e?.message || '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className='pu-page'>
      <ScrollView scrollY className='pu-scroll'>
        {list.length === 0 && !loading && <View className='pu-empty'>还没有采购申请</View>}
        {list.map((p) => {
          const st = STATUS[p.status || 'pending'] || { label: p.status, color: '#98A5B3', bg: '#EEF1F4' }
          return (
            <View key={p.id} className='pu-card'>
              <View className='pu-top'>
                <Text className='pu-no'>{p.orderNo}</Text>
                <Text className='pu-status' style={{ color: st.color, background: st.bg }}>{st.label}</Text>
              </View>
              <Text className='pu-name'>{p.itemName} <Text className='pu-qty'>× {p.quantity ?? 0} {p.unit || ''}</Text></Text>
              <Text className='pu-meta'>供应商：{p.supplierName || '—'}</Text>
              <View className='pu-info'>
                <Text className='pu-meta'>单价：{fmtMoney(p.unitPrice)} 元</Text>
                <Text className='pu-meta'>合计：{fmtMoney(p.totalAmount)} 元</Text>
                <Text className='pu-meta'>申请时间：{(p.createdAt || '').replace('T', ' ').slice(0, 16)}</Text>
              </View>
            </View>
          )
        })}
        {loading && <View className='pu-empty'>加载中...</View>}
      </ScrollView>
      <View className='wo-fab' onClick={() => Taro.navigateTo({ url: '/pages/purchase-create/index' })}>+ 采购申请</View>
    </View>
  )
}