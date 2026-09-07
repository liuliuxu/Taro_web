import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ConfigProvider, theme as antdTheme } from 'antd'

export const FONT_OPTIONS = {
  small: 12,
  normal: 14,
  large: 16
} as const

export type FontKey = keyof typeof FONT_OPTIONS

export type MenuStyle = 'fill' | 'bar' | 'rounded'

export interface ThemeSettings {
  mode: 'light' | 'dark'
  color: string
  btnColor?: string
  linkColor?: string
  menuColor?: string
  chartColor?: string
  fontSize: FontKey
  fontSizeCustom?: number
  bgColor: string
  cardColor: string
  siderColor: string
  siderVisible: boolean
  menuStyle: MenuStyle
  multiTab: boolean
}

export const DEFAULT_SETTINGS: ThemeSettings = {
  mode: 'light',
  color: '#FF6B1A',
  fontSize: 'normal',
  bgColor: '#F0F2F5',
  cardColor: '#FFFFFF',
  siderColor: '#16283B',
  siderVisible: true,
  menuStyle: 'fill',
  multiTab: true
}

const STORAGE_KEY = 'hm_settings'
const LEGACY_KEY = 'hm_theme'

function loadSettings(): ThemeSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
    const legacy = localStorage.getItem(LEGACY_KEY)
    if (legacy === 'dark' || legacy === 'light') {
      return { ...DEFAULT_SETTINGS, mode: legacy }
    }
    return DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}

export interface ThemeCtxShape {
  settings: ThemeSettings
  update: (patch: Partial<ThemeSettings>) => void
  reset: () => void
  dark: boolean
  fontPx: number
  btnColor: string
  linkColor: string
  menuColor: string
  chartColor: string
}

export function resolveFontPx(s: ThemeSettings): number {
  if (s.fontSizeCustom && s.fontSizeCustom >= 10 && s.fontSizeCustom <= 24) {
    return s.fontSizeCustom
  }
  return FONT_OPTIONS[s.fontSize]
}

export const ThemeCtx = createContext<ThemeCtxShape>({
  settings: DEFAULT_SETTINGS,
  update: () => {},
  reset: () => {},
  dark: false,
  fontPx: FONT_OPTIONS.normal,
  btnColor: DEFAULT_SETTINGS.color,
  linkColor: DEFAULT_SETTINGS.color,
  menuColor: DEFAULT_SETTINGS.color,
  chartColor: DEFAULT_SETTINGS.color
})
export const useThemeCtx = () => useContext(ThemeCtx)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ThemeSettings>(loadSettings)
  const dark = settings.mode === 'dark'
  const fontPx = resolveFontPx(settings)
  const btnColor = settings.btnColor || settings.color
  const linkColor = settings.linkColor || settings.color
  const menuColor = settings.menuColor || settings.color
  const chartColor = settings.chartColor || settings.color

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.setAttribute('data-theme', settings.mode)
    const root = document.documentElement.style
    root.setProperty('--hm-color', settings.color)
    root.setProperty('--hm-btn', btnColor)
    root.setProperty('--hm-link', linkColor)
    root.setProperty('--hm-menu-color', menuColor)
    root.setProperty('--hm-chart', chartColor)
    root.setProperty('--hm-font', `${fontPx}px`)
    root.setProperty('--hm-bg', dark ? '#0F1419' : settings.bgColor)
    root.setProperty('--hm-card', dark ? '#1F1F1F' : settings.cardColor)
    root.setProperty('--hm-sider', dark ? '#141414' : settings.siderColor)
  }, [settings, fontPx, dark, btnColor, linkColor, menuColor, chartColor])

  function update(patch: Partial<ThemeSettings>) {
    setSettings((s) => ({ ...s, ...patch }))
  }
  function reset() {
    setSettings(DEFAULT_SETTINGS)
  }

  const antdConfig = useMemo(
    () => ({
      algorithm: dark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      token: {
        colorPrimary: btnColor,
        colorLink: linkColor,
        fontSize: fontPx
      }
    }),
    [dark, btnColor, linkColor, fontPx]
  )

  return (
    <ThemeCtx.Provider value={{ settings, update, reset, dark, fontPx, btnColor, linkColor, menuColor, chartColor }}>
      <ConfigProvider theme={antdConfig}>
        {children}
      </ConfigProvider>
    </ThemeCtx.Provider>
  )
}