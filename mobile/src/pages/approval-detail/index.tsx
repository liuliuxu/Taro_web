import { useState } from 'react'
import Taro, { useLoad } from '@tarojs/taro'
import { View, Text, ScrollView, Input } from '@tarojs/components'
import { approvalApi, authApi } from '../../services/api'
import type { ApprovalDetail, ApprovalTask } from '../../types'
import './index.scss'

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: '审批中', color: '#F59E0B', bg: '#FEF3E2' },
  approved: { label: '已通过', color: '#0E9F6E', bg: '#E7F8F0' },
  rejected: { label: '已驳回', color: '#EF4444', bg: '#FDECEC' },
  withdrawn: { label: '已撤回', color: '#98A5B3', bg: '#EEF1F4' }
}

interface FieldDef { key: string; label: string; type: string }

export default function ApprovalDetail() {
  const [detail, setDetail] = useState<ApprovalDetail | null>(null)
  const [comment, setComment] = useState('')
  const [id, setId] = useState<number>(0)
  const [meId, setMeId] = useState<number | null>(null)

  useLoad((p) => {
    if (p?.id) {
      setId(Number(p.id))
      load(Number(p.id))
    }
    authApi.getProfile().then((u) => setMeId(u.id)).catch(() => {})
  })

  async function load(i: number) {
    try {
      setDetail(await approvalApi.detail(i))
    } catch (e: any) {
      Taro.showToast({ title: e?.message || '加载失败', icon: 'none' })
    }
  }

  function describe(f: FieldDef, data?: Record<string, any>): string {
    if (!data) return '—'
    const raw = data[f.key]
    if (raw === undefined || raw === null) return '—'
    if (f.type === 'multiple') {
      return (Array.isArray(raw) ? raw : String(raw).split(',')).join('、')
    }
    if (f.type === 'upload' && Array.isArray(raw)) return raw.map((u) => typeof u === 'string' ? u : u.url).join(', ')
    if (typeof raw === 'object') return JSON.stringify(raw)
    return String(raw)
  }

  function parseFields(): FieldDef[] {
    const f = detail?.form?.fieldsJson
    if (!f) return []
    try {
      const v = JSON.parse(f)
      return Array.isArray(v) ? v : []
    } catch {
      return []
    }
  }

  async function action(type: 'approve' | 'reject' | 'withdraw') {
    try {
      if (type === 'approve') await approvalApi.approve(id, comment || undefined)
      else if (type === 'reject') await approvalApi.reject(id, comment || undefined)
      else await approvalApi.withdraw(id)
      Taro.showToast({ title: type === 'approve' ? '已通过' : type === 'reject' ? '已驳回' : '已撤回', icon: 'success' })
      load(id)
    } catch (e: any) {
      Taro.showToast({ title: e?.message || '操作失败', icon: 'none' })
    }
  }

  const fields = parseFields()

  return (
    <View className='ad-page'>
      <ScrollView scrollY className='ad-scroll'>
        {detail && (
          <>
            <View className='ad-card'>
              <View className='ad-top'>
                <Text className='ad-no'>#{detail.instance.approvalNo}</Text>
                <Text className='ad-status' style={{ color: STATUS[detail.instance.status]?.color, background: STATUS[detail.instance.status]?.bg }}>
                  {STATUS[detail.instance.status]?.label || detail.instance.status}
                </Text>
              </View>
              <Text className='ad-title'>{detail.instance.title}</Text>
              <Text className='ad-meta'>申请人：{detail.instance.applicantName}</Text>
              <Text className='ad-meta'>当前节点：{detail.instance.currentNodeName || '—'}</Text>
              {detail.instance.resultNote && <Text className='ad-meta'>审批意见：{detail.instance.resultNote}</Text>}
            </View>

            <View className='ad-card'>
              <Text className='ad-card-title'>表单数据</Text>
              {fields.map((f) => (
                <View key={f.key} className='ad-row'>
                  <Text className='ad-key'>{f.label}</Text>
                  <Text className='ad-val'>{describe(f, detail.formData)}</Text>
                </View>
              ))}
            </View>

            <View className='ad-card'>
              <Text className='ad-card-title'>审批进度</Text>
              {(detail.tasks || []).map((t: ApprovalTask) => (
                <View key={t.id} className={`ad-node ${t.status === 'pending' ? 'ad-node-pending' : t.status === 'approved' ? 'ad-node-ok' : 'ad-node-no'}`}>
                  <View className='ad-node-dot' />
                  <View className='ad-node-body'>
                    <Text className='ad-node-name'>{t.nodeName}</Text>
                    <Text className='ad-node-meta'>
                      {t.handledByName ? `${t.handledByName}${t.handledAt ? ' · ' + (t.handledAt || '').replace('T', ' ').slice(0, 16) : ''}` : '等待审批'}
                      {t.comment ? ` · ${t.comment}` : ''}
                    </Text>
                    <Text className='ad-node-status'>{t.status === 'pending' ? '待处理' : t.status === 'approved' ? '已通过' : '已驳回'}</Text>
                  </View>
                </View>
              ))}
              {!detail.tasks?.length && <Text className='ad-meta'>暂无节点</Text>}
            </View>
          </>
        )}

        {detail?.instance.status === 'pending' && (
          <View className='ad-card'>
            <Text className='ad-card-title'>审批意见</Text>
            <Input className='ad-input' value={comment} placeholder='请输入审批意见（可选）' onInput={(e) => setComment(e.detail.value)} />
            <View className='ad-btns'>
              <View className='ad-btn ad-btn-reject' onClick={() => action('reject')}>驳回</View>
              <View className='ad-btn ad-btn-ok' onClick={() => action('approve')}>通过</View>
            </View>
            {meId === detail.instance.applicantId && (
              <View className='ad-btn ad-btn-warn ad-withdraw' onClick={() => action('withdraw')}>撤回申请</View>
            )}
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}