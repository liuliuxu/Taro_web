import { useState, createContext, useContext } from 'react'
import { ConfigProvider, theme as antdTheme } from 'antd'

interface ThemeCtxShape {
  theme: string
  changeTheme: (t: string) => void
}

export const ThemeCtx = createContext<ThemeCtxShape>({ theme: 'light', changeTheme: () => {} })
export const useThemeCtx = () => useContext(ThemeCtx)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('hm_theme') || 'light')

  function changeTheme(t: string) {
    setTheme(t)
    localStorage.setItem('hm_theme', t)
    document.documentElement.setAttribute('data-theme', t)
  }

  return (
    <ThemeCtx.Provider value={{ theme, changeTheme }}>
      <ConfigProvider
        theme={{
          algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
          token: { colorPrimary: '#FF6B1A' }
        }}
      >
        {children}
      </ConfigProvider>
    </ThemeCtx.Provider>
  )
}