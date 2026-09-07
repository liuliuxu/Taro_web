const BASE = '/api'

export interface ApiWrap<T> {
  code: number
  message: string
  data: T
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('hm_token')
  const res = await fetch(BASE + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  })
  let json: ApiWrap<T>
  try {
    json = await res.json()
  } catch {
    throw new Error(`请求失败（${res.status}）`)
  }
  if (res.status === 401) {
    localStorage.removeItem('hm_token')
    localStorage.removeItem('hm_user')
    window.location.hash = '#/login'
    throw new Error('登录已过期，请重新登录')
  }
  if (!json || json.code !== 200) {
    throw new Error(json?.message || '请求失败')
  }
  return json.data
}

export const get = <T>(path: string) => request<T>(path)
export const del = <T>(path: string) => request<T>(path, { method: 'DELETE' })
export const post = <T>(path: string, data?: unknown) =>
  request<T>(path, { method: 'POST', body: data === undefined ? undefined : JSON.stringify(data) })
export const put = <T>(path: string, data?: unknown) =>
  request<T>(path, { method: 'PUT', body: data === undefined ? undefined : JSON.stringify(data) })

export async function upload(file: File): Promise<{ url: string; name: string }> {
  const token = localStorage.getItem('hm_token')
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch(`${BASE}/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd
  })
  const json = await res.json()
  if (json.code !== 200) throw new Error(json.message || '上传失败')
  return json.data
}

export const qs = (params: Record<string, unknown>): string => {
  const clean = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  if (clean.length === 0) return ''
  return '?' + clean.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&')
}