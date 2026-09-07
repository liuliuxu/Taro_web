import { useState } from 'react'

/**
 * 缓存组件：将列表页的筛选/分页/tab 状态持久化到 sessionStorage，
 * 页面刷新或切换后自动恢复上次浏览状态。
 */
export function useCachedState<T>(key: string, initial: T): [T, (v: T | ((p: T) => T)) => void] {
  const [val, setVal] = useState<T>(() => {
    try {
      const raw = sessionStorage.getItem(key)
      if (raw !== null) return JSON.parse(raw) as T
    } catch {
      /* ignore */
    }
    return initial
  })

  function set(next: T | ((p: T) => T)) {
    setVal((prev) => {
      const v = typeof next === 'function' ? (next as (p: T) => T)(prev) : next
      try {
        sessionStorage.setItem(key, JSON.stringify(v))
      } catch {
        /* ignore */
      }
      return v
    })
  }

  return [val, set]
}