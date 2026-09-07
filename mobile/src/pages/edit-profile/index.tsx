import { useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { View, Text, ScrollView, Input, Picker } from '@tarojs/components'
import { authApi } from '../../services/api'
import type { User } from '../../types'
import './index.scss'

export default function EditProfile() {
  const [nickname, setNickname] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [hireDate, setHireDate] = useState('')
  const [workYears, setWorkYears] = useState('')
  const [saving, setSaving] = useState(false)

  useDidShow(() => {
    load()
  })

  async function load() {
    try {
      const u: User = await authApi.getProfile()
      setNickname(u.nickname || '')
      setPhone(u.phone || '')
      setEmail(u.email || '')
      setHireDate(u.hireDate || '')
      setWorkYears(u.workYears != null ? String(u.workYears) : '')
    } catch (e: any) {
      Taro.showToast({ title: e?.message || '加载失败', icon: 'none' })
    }
  }

  const today = new Date()
  const maxDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  async function save() {
    setSaving(true)
    try {
      await authApi.updateProfile({
        nickname: nickname || undefined,
        phone: phone || undefined,
        email: email || undefined,
        hireDate: hireDate || undefined,
        workYears: workYears ? Number(workYears) : undefined
      })
      Taro.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 500)
    } catch (e: any) {
      Taro.showToast({ title: e?.message || '保存失败', icon: 'none' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <View className='ep-page'>
      <ScrollView scrollY className='ep-scroll'>
        <View className='ep-card'>
          <View className='ep-field'>
            <Text className='ep-label'>姓名</Text>
            <Input className='ep-input' value={nickname} placeholder='请输入姓名' onInput={(e) => setNickname(e.detail.value)} />
          </View>
          <View className='ep-field'>
            <Text className='ep-label'>手机号</Text>
            <Input className='ep-input' value={phone} type='number' maxlength={11} placeholder='请输入手机号' onInput={(e) => setPhone(e.detail.value)} />
          </View>
          <View className='ep-field'>
            <Text className='ep-label'>邮箱</Text>
            <Input className='ep-input' value={email} placeholder='请输入邮箱' onInput={(e) => setEmail(e.detail.value)} />
          </View>
          <View className='ep-field'>
            <Text className='ep-label'>入职日期</Text>
            <Picker mode='date' end={maxDate} value={hireDate} onChange={(e) => setHireDate(e.detail.value)}>
              <View className={`ep-input ep-picker ${hireDate ? '' : 'ep-placeholder'}`}>{hireDate || '请选择入职日期'}</View>
            </Picker>
          </View>
          <View className='ep-field'>
            <Text className='ep-label'>工作年限(年)</Text>
            <Input className='ep-input' value={workYears} type='number' placeholder='请输入工作年限' onInput={(e) => setWorkYears(e.detail.value)} />
          </View>
        </View>
        <Text className='ep-tip'>年假、调休、加班由管理员在后台维护，如需调整请联系统管理员。</Text>

        <View className={`ep-submit ${saving ? 'ep-submit-disabled' : ''}`} onClick={save}>
          {saving ? '保存中...' : '保存'}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}
