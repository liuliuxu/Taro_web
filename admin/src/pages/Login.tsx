import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, Typography, message } from 'antd'
import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { post } from '../api'
import type { User } from '../types'

export default function Login() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function submit(values: { username: string; password: string }) {
    setLoading(true)
    try {
      const res = await post<{ token: string; user: User }>('/auth/login', values)
      localStorage.setItem('hm_token', res.token)
      localStorage.setItem('hm_user', JSON.stringify(res.user))
      message.success('登录成功')
      navigate('/dashboard', { replace: true })
    } catch (error: any) {
      message.error(error?.message || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='login-wrap'>
      {/* 左侧品牌区 */}
      <div style={{
        flex: '0 0 480px',
        background: 'linear-gradient(160deg, #16283B 0%, #1E3A55 55%, #2C5A7F 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 48px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* 装饰圆 */}
        <div style={{
          position: 'absolute', left: -100, top: -100,
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,107,26,0.18) 0%, transparent 70%)'
        }} />
        <div style={{
          position: 'absolute', right: -60, bottom: -60,
          width: 280, height: 280, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)'
        }} />

        <div style={{
          width: 100, height: 100, borderRadius: 24,
          background: 'linear-gradient(135deg, #FF8A3D, #F2540E)',
          color: '#fff', fontSize: 44, fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 12px 32px rgba(255,107,26,0.4)',
          zIndex: 1, letterSpacing: 0
        }}>重</div>

        <div style={{
          color: '#fff', fontSize: 28, fontWeight: 800,
          marginTop: 28, zIndex: 1, letterSpacing: 2
        }}>重工设备管理平台</div>

        <div style={{
          color: 'rgba(255,255,255,0.5)', fontSize: 14,
          marginTop: 10, zIndex: 1, letterSpacing: 3
        }}>企业内部 · 设备台账 · 维修闭环</div>

        <div style={{
          marginTop: 48, zIndex: 1,
          display: 'flex', gap: 24, color: 'rgba(255,255,255,0.35)', fontSize: 12
        }}>
          <span>设备管理</span>
          <span>·</span>
          <span>审批流程</span>
          <span>·</span>
          <span>采购库存</span>
        </div>
      </div>

      {/* 右侧登录区 */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--hm-bg, #F0F2F5)'
      }}>
        <div style={{ width: 380 }}>
          <div style={{ marginBottom: 36 }}>
            <Typography.Title level={3} style={{ marginBottom: 6, fontWeight: 800 }}>
              欢迎登录
            </Typography.Title>
            <Typography.Text type='secondary' style={{ fontSize: 14 }}>
              请使用管理员账号登录后台
            </Typography.Text>
          </div>

          <Form<{ username: string; password: string }>
            onFinish={submit}
            initialValues={{ username: 'admin' }}
            disabled={loading}
            size='large'
          >
            <Form.Item name='username' rules={[{ required: true, message: '请输入用户名' }]}>
              <Input prefix={<UserOutlined style={{ color: '#FF6B1A' }} />} placeholder='用户名' />
            </Form.Item>
            <Form.Item name='password' rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password prefix={<LockOutlined style={{ color: '#FF6B1A' }} />} placeholder='密码' />
            </Form.Item>
            <Form.Item style={{ marginBottom: 12 }}>
              <Button
                type='primary'
                htmlType='submit'
                block
                loading={loading}
                style={{
                  height: 44,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #FF8A3D, #F2540E)',
                  fontWeight: 600,
                  fontSize: 15,
                  border: 'none'
                }}
              >
                登 录
              </Button>
            </Form.Item>
          </Form>

          <div style={{
            textAlign: 'center',
            marginTop: 24,
            paddingTop: 16,
            borderTop: '1px solid var(--border, #E5E7EB)',
            color: 'var(--text-3, #9CA3AF)',
            fontSize: 12,
            lineHeight: 2
          }}>
            测试账号：admin / admin123 · manager / manager123
          </div>

          <div style={{
            textAlign: 'center',
            marginTop: 16,
            color: 'var(--text-3, #9CA3AF)',
            fontSize: 11
          }}>
            重工机械一体化管理平台 v1.0
          </div>
        </div>
      </div>
    </div>
  )
}
