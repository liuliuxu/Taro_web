import { useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { View, Text, Input, Textarea, ScrollView, Picker } from '@tarojs/components'
import { machineryApi, rentalApi } from '../../services/api'
import type { Machinery } from '../../types'
import './index.scss'

export default function RentalCreate() {
  const [machines, setMachines] = useState<Machinery[]>([])
  const [machineryIndex, setMachineryIndex] = useState(-1)
  const [machineryId, setMachineryId] = useState<number | undefined>(undefined)
  const [company, setCompany] = useState('')
  const [contact, setContact] = useState('')
  const [phone, setPhone] = useState('')
  const [deposit, setDeposit] = useState('')
  const [dailyRate, setDailyRate] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useDidShow(() => {
    load()
  })

  async function load() {
    try {
      const res = await machineryApi.getList({ page: 1, pageSize: 50, status: 'available' })
      setMachines(res.list)
    } catch (e) {
      Taro.showToast({ title: '设备加载失败', icon: 'none' })
    }
  }

  async function submit() {
    if (!Taro.getStorageSync('token')) {
      Taro.navigateTo({ url: '/pages/login/index' })
      return
    }
    if (!machineryId) {
      Taro.showToast({ title: '请选择租赁设备', icon: 'none' })
      return
    }
    if (!company.trim()) {
      Taro.showToast({ title: '请填写承租单位', icon: 'none' })
      return
    }
    if (!dailyRate || Number(dailyRate) <= 0) {
      Taro.showToast({ title: '请填写日租金', icon: 'none' })
      return
    }
    setSubmitting(true)
    try {
      await rentalApi.create({
        machineryId,
        clientCompany: company.trim(),
        clientContact: contact.trim() || undefined,
        clientPhone: phone.trim() || undefined,
        deposit: deposit ? Number(deposit) : undefined,
        dailyRate: Number(dailyRate),
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        note: note || undefined
      })
      Taro.showToast({ title: '创建成功', icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 800)
    } catch (e: any) {
      Taro.showToast({ title: e?.message || '创建失败', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  function Group(props: { label: string; required?: boolean; children: any }) {
    return (
      <View className='create-group'>
        <Text className='group-label'>{props.label}{props.required && <Text className='required'> *</Text>}</Text>
        {props.children}
      </View>
    )
  }

  return (
    <View className='create-page'>
      <ScrollView scrollY className='create-scroll'>
        <Group label='租赁设备' required>
          <Picker mode='selector' range={machines.map((m) => `${m.name}（${m.model || m.category}）`)} value={machineryIndex} onChange={(e) => {
            const i = Number(e.detail.value)
            setMachineryIndex(i)
            setMachineryId(machines[i]?.id)
          }}>
            <View className={`picker-box ${machineryId ? 'picker-filled' : ''}`}>
              {machineryId ? machines[machineryIndex]?.name || '已选择设备' : '请选择要出租的设备'}
              <Text className='picker-arrow'>›</Text>
            </View>
          </Picker>
        </Group>
        <Group label='承租单位' required>
          <Input className='text-input' placeholder='承租单位名称' value={company} onInput={(e) => setCompany(e.detail.value)} />
        </Group>
        <Group label='承租人'>
          <Input className='text-input' placeholder='联系人姓名' value={contact} onInput={(e) => setContact(e.detail.value)} />
        </Group>
        <Group label='联系电话'>
          <Input className='text-input' type='number' placeholder='联系电话' value={phone} onInput={(e) => setPhone(e.detail.value)} />
        </Group>
        <Group label='押金（元）'>
          <Input className='text-input' type='digit' placeholder='如：200000' value={deposit} onInput={(e) => setDeposit(e.detail.value)} />
        </Group>
        <Group label='日租金（元）' required>
          <Input className='text-input' type='digit' placeholder='如：8000' value={dailyRate} onInput={(e) => setDailyRate(e.detail.value)} />
        </Group>
        <Group label='起租日期'>
          <Picker mode='date' value={startDate} onChange={(e) => setStartDate(e.detail.value)}>
            <View className={`picker-box ${startDate ? 'picker-filled' : ''}`}>
              {startDate || '请选择起租日期'}
              <Text className='picker-arrow'>›</Text>
            </View>
          </Picker>
        </Group>
        <Group label='预计归还日期'>
          <Picker mode='date' value={endDate} onChange={(e) => setEndDate(e.detail.value)}>
            <View className={`picker-box ${endDate ? 'picker-filled' : ''}`}>
              {endDate || '请选择归还日期'}
              <Text className='picker-arrow'>›</Text>
            </View>
          </Picker>
        </Group>
        <Group label='备注'>
          <Textarea className='text-area' placeholder='结算方式、含司机与否、超时费率等' value={note} onInput={(e) => setNote(e.detail.value)} maxlength={300} />
        </Group>
        <View style={{ height: '30px' }} />
      </ScrollView>

      <View className='create-footer'>
        <View className='submit-btn' onClick={submit}>
          {submitting ? '提交中...' : '创建租赁合同'}
        </View>
      </View>
    </View>
  )
}