import { useState } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, ScrollView, Input, Textarea } from '@tarojs/components'
import { purchaseApi, sparePartApi } from '../../services/api'
import type { SparePart } from '../../types'
import './index.scss'

export default function PurchaseCreate() {
  const [itemName, setItemName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('')
  const [price, setPrice] = useState('')
  const [supplierName, setSupplierName] = useState('')
  const [remark, setRemark] = useState('')
  const [submitLoading, setSubmitLoading] = useState(false)
  const [parts, setParts] = useState<SparePart[]>([])
  const [showParts, setShowParts] = useState(false)

  function loadParts() {
    setShowParts(true)
    sparePartApi.list({ keyword: itemName }).then(setParts).catch(() => {})
  }

  function pick(p: SparePart) {
    setItemName(p.name)
    setUnit(p.unit || '')
    setShowParts(false)
  }

  async function submit() {
    if (!itemName.trim()) {
      Taro.showToast({ title: '请填写物料名称', icon: 'none' })
      return
    }
    setSubmitLoading(true)
    try {
      await purchaseApi.apply({
        itemName: itemName.trim(),
        quantity: quantity ? Number(quantity) : undefined,
        unit: unit || undefined,
        supplierName: supplierName || undefined,
        remark: remark || undefined,
        unitPrice: price ? Number(price) : undefined
      })
      Taro.showToast({ title: '已提交审批', icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 600)
    } catch (e: any) {
      Taro.showToast({ title: e?.message || '提交失败', icon: 'none' })
    } finally {
      setSubmitLoading(false)
    }
  }

  return (
    <View className='pc-page'>
      <ScrollView scrollY className='pc-scroll'>
        <View className='pc-field'>
          <Text className='pc-label'>物料名称 <Text className='req'>*</Text></Text>
          <Input className='pc-input' value={itemName} placeholder='可直接从备件库选择' onInput={(e) => setItemName(e.detail.value)} onFocus={loadParts} />
          {showParts && parts.length > 0 && (
            <View className='pc-parts'>
              {parts.map((p) => (
                <View key={p.id} className='pc-part' onClick={() => pick(p)}>
                  <Text className='pc-part-name'>{p.name}</Text>
                  <Text className='pc-part-meta'>库存{p.stockQty ?? 0} {p.unit || ''}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
        <View className='pc-field-row'>
          <View className='pc-field'>
            <Text className='pc-label'>数量</Text>
            <Input type='number' className='pc-input' value={quantity} placeholder='0' onInput={(e) => setQuantity(e.detail.value)} />
          </View>
          <View className='pc-field'>
            <Text className='pc-label'>单位</Text>
            <Input className='pc-input' value={unit} placeholder='件/台' onInput={(e) => setUnit(e.detail.value)} />
          </View>
        </View>
        <View className='pc-field'>
          <Text className='pc-label'>参考单价（元）</Text>
          <Input type='number' className='pc-input' value={price} placeholder='0' onInput={(e) => setPrice(e.detail.value)} />
        </View>
        <View className='pc-field'>
          <Text className='pc-label'>供应商</Text>
          <Input className='pc-input' value={supplierName} placeholder='选填' onInput={(e) => setSupplierName(e.detail.value)} />
        </View>
        <View className='pc-field'>
          <Text className='pc-label'>采购说明</Text>
          <Textarea className='pc-textarea' value={remark} placeholder='选填' onInput={(e) => setRemark(e.detail.value)} />
        </View>

        <View className={`pc-submit ${submitLoading ? 'pc-disabled' : ''}`} onClick={submit}>
          {submitLoading ? '提交中...' : '提交采购申请'}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}