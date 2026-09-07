import React from 'react'
import Taro, { useLaunch } from '@tarojs/taro'
import 'taro-ui/dist/style/index.scss'
import './app.scss'

/** 基于主色生成深/浅变体色（用于 --orange-deep / --orange-soft） */
function mix(hex: string, target: number) {
  const n = hex.replace('#', '')
  const full = n.length === 3 ? n.split('').map((c) => c + c).join('') : n
  const r = parseInt(full.substring(0, 2), 16)
  const g = parseInt(full.substring(2, 4), 16)
  const b = parseInt(full.substring(4, 6), 16)
  const mixVal = (c: number) => Math.round(c + (target - c) * 0.82)
  const toHex = (c: number) => c.toString(16).padStart(2, '0')
  return `#${toHex(mixVal(r))}${toHex(mixVal(g))}${toHex(mixVal(b))}`
}

/** 应用保存的主题（dark + color）到根节点，供全局样式覆盖 */
export function applyTheme() {
  try {
    const theme = Taro.getStorageSync('theme')
    const color = Taro.getStorageSync('themeColor')
    if (typeof document !== 'undefined') {
      const root = document.documentElement
      if (theme === 'dark') root.setAttribute('data-theme', 'dark')
      else root.removeAttribute('data-theme')

      if (typeof color === 'string' && color.startsWith('#')) {
        root.removeAttribute('data-color')
        root.style.setProperty('--orange', color)
        root.style.setProperty('--orange-deep', mix(color, 16))
        root.style.setProperty('--orange-soft', mix(color, 255))
      } else if (color && color !== 'orange') {
        root.setAttribute('data-color', color)
        root.style.removeProperty('--orange')
        root.style.removeProperty('--orange-deep')
        root.style.removeProperty('--orange-soft')
      } else {
        root.removeAttribute('data-color')
        root.style.removeProperty('--orange')
        root.style.removeProperty('--orange-deep')
        root.style.removeProperty('--orange-soft')
      }
    }
  } catch {
    /* ignore */
  }
}

function App({ children }) {
  useLaunch(() => {
    applyTheme()
  })

  return children
}

export default App