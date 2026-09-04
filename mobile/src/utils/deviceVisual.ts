import type { Machinery } from '../types'

// 每个设备分类对应一种视觉渐变主题（用于有质感的占位图）
const CATEGORY_THEME: Record<string, { from: string; to: string; icon: string }> = {
  挖掘机: { from: '#F59E0B', to: '#EA580C', icon: '挖' },
  装载机: { from: '#3B82F6', to: '#1D4ED8', icon: '装' },
  破碎锤: { from: '#6366F1', to: '#4338CA', icon: '锤' },
  自卸车: { from: '#F97316', to: '#C2410C', icon: '运' },
  泵车: { from: '#06B6D4', to: '#0E7490', icon: '泵' },
  塔吊: { from: '#8B5CF6', to: '#6D28D9', icon: '塔' },
  推土机: { from: '#22C55E', to: '#15803D', icon: '推' },
  压路机: { from: '#FACC15', to: '#A16207', icon: '压' },
  钻机: { from: '#14B8A6', to: '#0F766E', icon: '钻' }
}

const DEFAULT_THEME = { from: '#16283B', to: '#33506F', icon: '械' }

export function getCategoryTheme(category: string) {
  return CATEGORY_THEME[category] || DEFAULT_THEME
}

export const statusText: Record<string, string> = {
  available: '可购买',
  rented: '已租赁',
  maintenance: '维护中'
}

export function formatPrice(price: number): string {
  return `${price}万`
}

export const categoryIconMap: Record<string, string> = {
  挖掘机: '⛏',
  装载机: '🚜',
  破碎锤: '⚒',
  自卸车: '🚛',
  泵车: '🚚',
  塔吊: '🏗',
  推土机: '🚧',
  压路机: '🛣',
  钻机: '🛢'
}

export type { Machinery }
