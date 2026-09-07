import { useState } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Input, Textarea, ScrollView, Picker } from '@tarojs/components'
import { projectApi } from '../../services/api'
import './index.scss'

export default function ProjectCreate() {
  const [name, setName] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [address, setAddress] = useState('')
  const [plannedStart, setPlannedStart] = useState('')
  const [plannedEnd, setPlannedEnd] = useState('')
  const [budget, setBudget] = useState('')
  const [desc, setDesc] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    if (!Taro.getStorageSync('token')) {
      Taro.navigateTo({ url: '/pages/login/index' })
      return
    }
    if (!name.trim()) {
      Taro.showToast({ title: '请填写项目名称', icon: 'none' })
      return
    }
    setSubmitting(true)
    try {
      await projectApi.create({
        name: name.trim(),
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        address: address.trim() || undefined,
        plannedStart: plannedStart || undefined,
        plannedEnd: plannedEnd || undefined,
        budget: budget ? Number(budget) : undefined,
        description: desc || undefined
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
        <Group label='项目名称' required>
          <Input className='text-input' placeholder='如：滨海新区市政道路改造工程' value={name} onInput={(e) => setName(e.detail.value)} />
        </Group>
        <Group label='客户单位'>
          <Input className='text-input' placeholder='客户单位名称' value={customerName} onInput={(e) => setCustomerName(e.detail.value)} />
        </Group>
        <Group label='联系电话'>
          <Input className='text-input' type='number' placeholder='客户联系电话' value={customerPhone} onInput={(e) => setCustomerPhone(e.detail.value)} />
        </Group>
        <Group label='施工地点'>
          <Input className='text-input' placeholder='项目施工地址' value={address} onInput={(e) => setAddress(e.detail.value)} />
        </Group>
        <Group label='计划开工日期'>
          <Picker mode='date' value={plannedStart} onChange={(e) => setPlannedStart(e.detail.value)}>
            <View className={`picker-box ${plannedStart ? 'picker-filled' : ''}`}>
              {plannedStart || '请选择开工日期'}
              <Text className='picker-arrow'>›</Text>
            </View>
          </Picker>
        </Group>
        <Group label='计划完工日期'>
          <Picker mode='date' value={plannedEnd} onChange={(e) => setPlannedEnd(e.detail.value)}>
            <View className={`picker-box ${plannedEnd ? 'picker-filled' : ''}`}>
              {plannedEnd || '请选择完工日期'}
              <Text className='picker-arrow'>›</Text>
            </View>
          </Picker>
        </Group>
        <Group label='项目预算（元）'>
          <Input className='text-input' type='digit' placeholder='如：6800000' value={budget} onInput={(e) => setBudget(e.detail.value)} />
        </Group>
        <Group label='项目描述'>
          <Textarea className='text-area' placeholder='项目范围、主要工序、投入设备等' value={desc} onInput={(e) => setDesc(e.detail.value)} maxlength={500} />
        </Group>
        <View style={{ height: '30px' }} />
      </ScrollView>

      <View className='create-footer'>
        <View className='submit-btn' onClick={submit}>
          {submitting ? '提交中...' : '创建项目'}
        </View>
      </View>
    </View>
  )
}