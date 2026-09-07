import { useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { View, Text, ScrollView } from '@tarojs/components'
import { rentalApi } from '../../services/api'
import type { RentalContract } from '../../types'
import { rentalStatusLabel, rentalStatusColor, rentalStatusBg, fmtDate, fmtMoney } from '../../utils/bizMeta'
import './index.scss'

const TABS = [
  { key: 'all', label: '全部' },
  { key: 'active', label: '出租中' },
  { key: 'returned', label: '已归还' }
]

export default function RentalList() {
  const [tab, setTab] = useState('active')
  const [list, setList] = useState<RentalContract[]>([])
  const [loading, setLoading] = useState(false)

  useDidShow(() => {
    load(tab)
  })

  async function load(t: string) {
    setLoading(true)
    try {
      let res: RentalContract[]
      if (t === 'active') {
        res = await rentalApi.getActive()
      } else {
        res = await rentalApi.getList({ status: t === 'all' ? undefined : t })
      }
      setList(res)
    } catch (e) {
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  function onTab(t: string) {
    setTab(t)
    load(t)
  }

  async function handle(id: number, status: string, label: string) {
    try {
      await rentalApi.handle(id, { status })
      Taro.showToast({ title: label, icon: 'success' })
      load(tab)
    } catch (e: any) {
      Taro.showToast({ title: e?.message || '操作失败', icon: 'none' })
    }
  }

  function confirmHandle(r: RentalContract, status: string, label: string) {
    Taro.showModal({
      title: '确认操作',
      content: status === 'returned' ? `确认设备「${r.machineryName}」已归还？系统将计算实际费用。` : `确认取消合同「${r.contractNo}」？`,
      confirmText: '确认',
      confirmColor: '#FF6B1A',
      success: (res) => {
        if (res.confirm) handle(r.id, status, label)
      }
    })
  }

  return (
    <View className='rl-page'>
      <ScrollView scrollX className='wo-tab-scroll' showScrollbar={false}>
        <View className='wo-tab-row'>
          {TABS.map((t) => (
            <View key={t.key} className={`wo-tab-chip ${tab === t.key ? 'wo-tab-on' : ''}`} onClick={() => onTab(t.key)}>
              {t.label}
            </View>
          ))}
        </View>
      </ScrollView>

      <ScrollView scrollY className='rl-scroll'>
        {list.length === 0 && !loading ? (
          <View className='rl-empty'>暂无租赁合同</View>
        ) : (
          list.map((r) => (
            <View key={r.id} className='rl-card'>
              <View className='rl-top'>
                <Text className='rl-no'>{r.contractNo}</Text>
                <Text className='rl-status' style={{ color: rentalStatusColor(r.status), background: rentalStatusBg(r.status) }}>{rentalStatusLabel(r.status)}</Text>
              </View>
              <Text className='rl-mach'>{r.machineryName} {r.machineryModel || ''}</Text>
              <Text className='rl-client'>{r.clientCompany} · {r.clientContact} {r.clientPhone}</Text>
              <View className='rl-info'>
                <Text className='rl-meta'>租期：{fmtDate(r.startDate)} ~ {fmtDate(r.endDate)}</Text>
                <Text className='rl-meta'>租金：{r.dailyRate ? `${fmtMoney(r.dailyRate)} 元/天` : '—'} × {r.rentDays ?? 0} 天</Text>
                <Text className='rl-meta'>押金：{r.deposit ? `${fmtMoney(r.deposit)} 元` : '—'} · 合计：{r.totalAmount ? `${fmtMoney(r.totalAmount)} 元` : '—'}</Text>
              </View>
              {r.status === 'active' && (
                <View className='rl-btns'>
                  <View className='rl-btn rl-btn-warn' onClick={() => confirmHandle(r, 'cancelled', '已取消')}>取消</View>
                  <View className='rl-btn rl-btn-primary' onClick={() => confirmHandle(r, 'returned', '已归还')}>登记归还</View>
                </View>
              )}
            </View>
          ))
        )}
        {loading && <View className='rl-empty'>加载中...</View>}
      </ScrollView>

      <View className='wo-fab' onClick={() => Taro.navigateTo({ url: '/pages/rental-create/index' })}>+ 新建租赁</View>
    </View>
  )
}