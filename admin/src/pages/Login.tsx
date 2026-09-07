import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Form, Input, Button, Typography, message } from 'antd'
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
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1f3b73 0%, #2f5aa8 100%)'
      }}
    >
      <Card style={{ width: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <Typography.Title level={3} style={{ marginBottom: 4 }}>
            机械数字化平台
          </Typography.Title>
          <Typography.Text type='secondary'>施工设备管理系统后台</Typography.Text>
        </div>
        <Form<{ username: string; password: string }>
          onFinish={submit}
          initialValues={{ username: 'admin' }}
          disabled={loading}
        >
          <Form.Item name='username' rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder='用户名' />
          </Form.Item>
          <Form.Item name='password' rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder='密码' />
          </Form.Item>
          <Button type='primary' htmlType='submit' block loading={loading}>
            登 录
          </Button>
        </Form>
        <Typography.Paragraph type='secondary' style={{ textAlign: 'center', marginTop: 12, fontSize: 12 }}>
          测试账号：admin / admin123
        </Typography.Paragraph>
      </Card>
    </div>
  )
}