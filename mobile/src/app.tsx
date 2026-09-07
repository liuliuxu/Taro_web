import React from 'react'
import Taro, { useLaunch } from '@tarojs/taro'
import 'taro-ui/dist/style/index.scss'
import './app.scss'

/** 应用保存的主题（dark + color）到根节点，供全局样式覆盖 */
export function applyTheme() {
  try {
    const theme = Taro.getStorageSync('theme')
    const color = Taro.getStorageSync('themeColor')
    if (typeof document !== 'undefined') {
      if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark')
      else document.documentElement.removeAttribute('data-theme')
      if (color && color !== 'orange') document.documentElement.setAttribute('data-color', color)
      else document.documentElement.removeAttribute('data-color')
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
