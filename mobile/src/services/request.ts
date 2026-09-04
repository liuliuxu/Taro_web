import Taro from '@tarojs/taro'

// H5 端使用相对路径 /api（本地开发由 devServer 代理，生产由 Nginx 反向代理到后端）
// 小程序端使用服务器绝对地址
const SERVER_ORIGIN = 'http://112.124.18.181:8081'
const IS_H5 = process.env.TARO_ENV === 'h5'

const BASE_URL = IS_H5 ? '/api' : `${SERVER_ORIGIN}/api`

interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: object
  showLoading?: boolean
  loadingText?: string
}

export async function request<T>(options: RequestOptions): Promise<T> {
  const { url, method = 'GET', data, showLoading = false, loadingText = '加载中...' } = options

  if (showLoading) {
    Taro.showLoading({ title: loadingText, mask: true })
  }

  try {
    const token = Taro.getStorageSync('token')
    const response = await Taro.request({
      url: BASE_URL + url,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      }
    })

    if (showLoading) {
      Taro.hideLoading()
    }

    const result = response.data as any
    if (result.code === 200) {
      return result.data as T
    }

    if (result.code === 401) {
      Taro.removeStorageSync('token')
      Taro.navigateTo({ url: '/pages/login/index' })
      throw new Error('登录已过期，请重新登录')
    }

    Taro.showToast({ title: result.message || '请求失败', icon: 'none' })
    throw new Error(result.message || '请求失败')
  } catch (error: any) {
    if (showLoading) {
      Taro.hideLoading()
    }
    if (error?.message?.includes('网络')) {
      Taro.showToast({ title: '网络连接失败', icon: 'none' })
    }
    throw error
  }
}

export const api = {
  get<T>(url: string, data?: object, showLoading = false) {
    return request<T>({ url, method: 'GET', data, showLoading })
  },
  post<T>(url: string, data?: object, showLoading = false) {
    return request<T>({ url, method: 'POST', data, showLoading })
  },
  put<T>(url: string, data?: object, showLoading = false) {
    return request<T>({ url, method: 'PUT', data, showLoading })
  },
  delete<T>(url: string, data?: object, showLoading = false) {
    return request<T>({ url, method: 'DELETE', data, showLoading })
  }
}
