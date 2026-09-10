import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, Typography, message, Card } from 'antd'
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
      {/* 背景装饰层 */}
      <div className='login-bg'>
        <div className='login-orb login-orb-1' />
        <div className='login-orb login-orb-2' />
        <div className='login-grid' />
      </div>

      <div className='login-container'>
        {/* 左侧品牌展示区 */}
        <div className='login-brand'>
          <div className='login-orb login-orb-brand' />
          
          <div className='login-logo'>
            <span className='login-logo-char'>机</span>
          </div>
          
          <h1 className='login-brand-title'>机械管理平台</h1>
          <p className='login-brand-slogan'>企业内部 · 设备台账 · 维修闭环</p>
          
          <ul className='login-features'>
            <li>设备台账全生命周期</li>
            <li>工单闭环·调度可视化</li>
            <li>审批流程自定义配置</li>
            <li>采购库存·租赁合同</li>
          </ul>
          
          <p className='login-version'>v1.1 企业内部版</p>
        </div>

        {/* 右侧登录表单区 */}
        <div className='login-form-wrap'>
          <div className='login-card'>
            <div className='login-header'>
              <Typography.Title level={3} className='login-title'>
                欢迎登录
              </Typography.Title>
              <Typography.Text type='secondary' className='login-subtitle'>
                使用企业账号登录管理后台
              </Typography.Text>
            </div>

            <Form<{ username: string; password: string }>
              onFinish={submit}
              initialValues={{ username: 'admin' }}
              disabled={loading}
              size='large'
              layout='vertical'
            >
              <Form.Item
                name='username'
                rules={[{ required: true, message: '请输入用户名' }]}
                className='login-form-item'
              >
                <Input
                  prefix={<UserOutlined className='login-input-icon' />}
                  placeholder='用户名/工号'
                  autoComplete='username'
                />
              </Form.Item>
              <Form.Item
                name='password'
                rules={[{ required: true, message: '请输入密码' }]}
                className='login-form-item'
              >
                <Input.Password
                  prefix={<LockOutlined className='login-input-icon' />}
                  placeholder='登录密码'
                  autoComplete='current-password'
                />
              </Form.Item>
              
              <Form.Item className='login-form-item login-form-item-btn' style={{ marginBottom: 0 }}>
                <Button
                  type='primary'
                  htmlType='submit'
                  block
                  loading={loading}
                  className='login-btn'
                >
                  登 录
                </Button>
              </Form.Item>
            </Form>

            <div className='login-footer'>
              <div className='login-test-accounts'>
                <Typography.Text type='secondary' style={{ fontSize: 12 }}>
                  测试账号：
                </Typography.Text>
                <div className='login-account-list'>
                  <span className='login-account'>admin / admin123</span>
                  <span className='login-account-divider'>·</span>
                  <span className='login-account'>manager / manager123</span>
                  <span className='login-account-divider'>·</span>
                  <span className='login-account'>operator / operator123</span>
                </div>
              </div>
              <Typography.Text type='secondary' className='login-copyright'>
                机械一体化管理平台 v1.1
              </Typography.Text>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}