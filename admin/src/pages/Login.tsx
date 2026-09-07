import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { post } from '../api'
import type { User } from '../types'

export default function Login() {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!username || !password) {
      setErr('请输入用户名和密码')
      return
    }
    setLoading(true)
    setErr('')
    try {
      const res = await post<{ token: string; user: User }>('/auth/login', { username, password })
      localStorage.setItem('hm_token', res.token)
      localStorage.setItem('hm_user', JSON.stringify(res.user))
      navigate('/dashboard', { replace: true })
    } catch (error: any) {
      setErr(error?.message || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='login-wrap'>
      <form className='login-card' onSubmit={submit}>
        <div className='login-title'>重工机械数字化平台</div>
        <div className='login-sub'>施工设备管理后台 · 请使用管理员账号登录</div>
        {err && <div className='login-err'>{err}</div>}
        <input className='login-input' placeholder='用户名' value={username} onChange={(e) => setUsername(e.target.value)} />
        <input className='login-input' type='password' placeholder='密码' value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className='login-btn' type='submit' disabled={loading}>{loading ? '登录中...' : '登 录'}</button>
        <div className='login-tip'>测试账号：admin / admin123<br />管理权限：设备、工单、用户、工程、租赁</div>
      </form>
    </div>
  )
}