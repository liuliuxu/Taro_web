import { useState } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, ScrollView, Input, Textarea, Picker } from '@tarojs/components'
import { approvalApi } from '../../services/api'
import type { FormDefinition, OptionSet, ProcessDefinition } from '../../types'
import './index.scss'

interface FormField {
  key: string
  label: string
  type: 'input' | 'textarea' | 'number' | 'date' | 'select' | 'multiple' | 'upload' | 'tree'
  required?: boolean
  placeholder?: string
  options?: { label: string; value: string }[]
  optionSetCode?: string
  treeData?: { title: string; value: string; children?: { title: string; value: string }[] }[]
}

export default function ApprovalCreate() {
  const [processes, setProcesses] = useState<ProcessDefinition[]>([])
  const [loading, setLoading] = useState(false)
  const [cur, setCur] = useState<ProcessDefinition | null>(null)
  const [form, setForm] = useState<FormDefinition | null>(null)
  const [fields, setFields] = useState<FormField[]>([])
  const [values, setValues] = useState<Record<string, any>>({})
  const [title, setTitle] = useState('')
  const [submitLoading, setSubmitLoading] = useState(false)
  const [optionSets, setOptionSets] = useState<OptionSet[]>([])

  async function loadProcesses() {
    if (processes.length) return
    setLoading(true)
    try {
      const list = await approvalApi.startable()
      setProcesses(list)
      approvalApi.optionSets().then(setOptionSets).catch(() => {})
    } catch (e: any) {
      Taro.showToast({ title: e?.message || '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  async function selectProcess(p: ProcessDefinition) {
    setCur(p)
    try {
      const f = await approvalApi.form(p.formId!)
      setForm(f)
      const fs = parseFields(f.fieldsJson)
      setFields(fs)
      const init: Record<string, any> = {}
      fs.forEach((x) => { init[x.key] = x.type === 'multiple' ? [] : '' })
      setValues(init)
      setTitle('')
    } catch (e: any) {
      Taro.showToast({ title: e?.message || '表单加载失败', icon: 'none' })
    }
  }

  function setVal(key: string, v: any) {
    setValues((prev) => ({ ...prev, [key]: v }))
  }

  async function doUpload(key: string) {
    try {
      const res = await Taro.chooseImage({ count: 1, sizeType: ['compressed'] })
      const path = res.tempFilePaths[0]
      const token = Taro.getStorageSync('token')
      const up = await Taro.uploadFile({
        url: `${process.env.TARO_APP_API_BASE || '/api'}/upload`,
        filePath: path,
        name: 'file',
        header: token ? { Authorization: `Bearer ${token}` } : {}
      })
      const json = JSON.parse(up.data)
      if (json.code !== 200) throw new Error(json.message || '上传失败')
      const prev = (values[key] || []) as string[]
      setVal(key, [...prev, json.data.url])
    } catch (e: any) {
      Taro.showToast({ title: e?.message || '上传失败', icon: 'none' })
    }
  }

  async function submit() {
    for (const f of fields) {
      if (f.required) {
        const v = values[f.key]
        const empty = v === '' || v === undefined || v === null || (Array.isArray(v) && v.length === 0)
        if (empty) {
          Taro.showToast({ title: `请填写「${f.label}」`, icon: 'none' })
          return
        }
      }
    }
    const process = cur!
    const bizType = form?.bizType || undefined
    setSubmitLoading(true)
    try {
      await approvalApi.submit({
        processId: process.id,
        title: title || undefined,
        bizType,
        formData: values
      })
      Taro.showToast({ title: '发起成功', icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 600)
    } catch (e: any) {
      Taro.showToast({ title: e?.message || '发起失败', icon: 'none' })
    } finally {
      setSubmitLoading(false)
    }
  }

  function renderField(f: FormField) {
    const v = values[f.key]
    switch (f.type) {
      case 'textarea':
        return (
          <View key={f.key} className='ac-field'>
            <Text className='ac-label'>{f.label}{f.required ? <Text className='req'>*</Text> : null}</Text>
            <Textarea className='ac-textarea' value={String(v || '')} placeholder={f.placeholder} onInput={(e) => setVal(f.key, e.detail.value)} />
          </View>
        )
      case 'number':
        return (
          <View key={f.key} className='ac-field'>
            <Text className='ac-label'>{f.label}{f.required ? <Text className='req'>*</Text> : null}</Text>
            <Input type='number' className='ac-input' value={v === 0 ? '0' : String(v ?? '')} placeholder={f.placeholder || '请输入数字'}
              onInput={(e) => setVal(f.key, e.detail.value)} />
          </View>
        )
      case 'date':
        return (
          <View key={f.key} className='ac-field'>
            <Text className='ac-label'>{f.label}{f.required ? <Text className='req'>*</Text> : null}</Text>
            <Picker mode='date' value={String(v || '')} onChange={(e) => setVal(f.key, e.detail.value)}>
              <View className='ac-input ac-picker'>{String(v || '') || '请选择日期'}</View>
            </Picker>
          </View>
        )
      case 'select': {
        const opts = resolveOptions(f, optionSets)
        const idx = opts.findIndex((o) => o.value === v)
        return (
          <View key={f.key} className='ac-field'>
            <Text className='ac-label'>{f.label}{f.required ? <Text className='req'>*</Text> : null}</Text>
            <Picker mode='selector' range={opts.map((o) => o.label)} value={idx >= 0 ? idx : 0}
              onChange={(e) => setVal(f.key, opts[Number(e.detail.value)]?.value)}>
              <View className='ac-input ac-picker'>{idx >= 0 ? opts[idx].label : '请选择'}</View>
            </Picker>
          </View>
        )
      }
      case 'multiple': {
        const opts = resolveOptions(f, optionSets)
        const sel = Array.isArray(v) ? v : []
        return (
          <View key={f.key} className='ac-field'>
            <Text className='ac-label'>{f.label}{f.required ? <Text className='req'>*</Text> : null}</Text>
            <View className='ac-tags'>
              {opts.map((o) => {
                const on = sel.includes(o.value)
                return (
                  <View key={o.value} className={`ac-tag ${on ? 'ac-tag-on' : ''}`}
                    onClick={() => setVal(f.key, on ? sel.filter((x) => x !== o.value) : [...sel, o.value])}>
                    {o.label}
                  </View>
                )
              })}
            </View>
          </View>
        )
      }
      case 'upload':
        return (
          <View key={f.key} className='ac-field'>
            <Text className='ac-label'>{f.label}{f.required ? <Text className='req'>*</Text> : null}</Text>
            <View className='ac-tags'>
              {(Array.isArray(v) ? v : []).map((u: string, i: number) => (
                <View key={i} className='ac-file'>{u.split('/').pop()} <Text onClick={() => setVal(f.key, (v as string[]).filter((_, j) => j !== i))}>✕</Text></View>
              ))}
            </View>
            <View className='ac-upload-btn' onClick={() => doUpload(f.key)}>+ 上传附件</View>
          </View>
        )
      case 'tree': {
        const trees = (f.treeData || []).flatMap((t) => [
          { label: t.title, value: t.value },
          ...(t.children || []).map((c) => ({ label: `${t.title} / ${c.title}`, value: c.value }))
        ])
        const idx = trees.findIndex((o) => o.value === v)
        return (
          <View key={f.key} className='ac-field'>
            <Text className='ac-label'>{f.label}{f.required ? <Text className='req'>*</Text> : null}</Text>
            <Picker mode='selector' range={trees.map((o) => o.label)} value={idx >= 0 ? idx : 0}
              onChange={(e) => setVal(f.key, trees[Number(e.detail.value)]?.value)}>
              <View className='ac-input ac-picker'>{idx >= 0 ? trees[idx].label : '请选择'}</View>
            </Picker>
          </View>
        )
      }
      default:
        return (
          <View key={f.key} className='ac-field'>
            <Text className='ac-label'>{f.label}{f.required ? <Text className='req'>*</Text> : null}</Text>
            <Input className='ac-input' value={v === 0 ? '0' : String(v ?? '')} placeholder={f.placeholder || `请输入${f.label}`}
              onInput={(e) => setVal(f.key, e.detail.value)} />
          </View>
        )
    }
  }

  return (
    <View className='ac-page'>
      <ScrollView scrollY className='ac-scroll'>
        {!cur && (
          <>
            <View className='ac-section-title'>选择审批流程</View>
            {processes.length === 0 && <View className='ac-empty' onClick={loadProcesses}>{loading ? '加载中...' : '点击加载可用流程'}</View>}
            {processes.map((p) => (
              <View key={p.id} className='ac-proc' onClick={() => selectProcess(p)}>
                <Text className='ac-proc-name'>{p.name}</Text>
                <Text className='ac-proc-arrow'>›</Text>
              </View>
            ))}
          </>
        )}

        {cur && (
          <>
            <View className='ac-form-head'>
              <Text className='ac-form-title'>{cur.name}</Text>
              <Text className='ac-form-back' onClick={() => setCur(null)}>‹ 换个流程</Text>
            </View>
            <View className='ac-field'>
              <Text className='ac-label'>申请标题</Text>
              <Input className='ac-input' value={title} placeholder='不填则使用「流程名+申请」' onInput={(e) => setTitle(e.detail.value)} />
            </View>
            {fields.map(renderField)}

            <View className='ac-submit' onClick={submit}>
              {submitLoading ? '提交中...' : '提交审批'}
            </View>
            <View style={{ height: 40 }} />
          </>
        )}
      </ScrollView>
    </View>
  )
}

function parseFields(json?: string): FormField[] {
  if (!json) return []
  try {
    const v = JSON.parse(json)
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

function resolveOptions(f: FormField, sets: OptionSet[]): { label: string; value: string }[] {
  if (f.options?.length) return f.options
  if (f.optionSetCode) {
    const set = sets.find((s) => s.code === f.optionSetCode)
    if (set?.optionsJson) {
      try {
        const v = JSON.parse(set.optionsJson)
        if (Array.isArray(v)) return v
      } catch { /* ignore */ }
    }
  }
  return []
}