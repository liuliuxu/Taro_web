import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Layout as AntLayout, Menu, Dropdown, Space, Typography } from 'antd'
import { LogoutOutlined, UserOutlined } from '@ant-design/icons'
import type { User } from '../types'

const MENU_ITEMS = [
  { key: '/dashboard', label: '数据仪表盘' },
  { key: '/devices', label: '设备管理' },
  { key: '/workorders', label: '维修工单' },
  { key: '/projects', label: '工程管理' },
  { key: '/rentals', label: '租赁管理' },
  { key: '/suppliers', label: '供应商管理' },
  { key: '/purchases', label: '采购管理' },
  { key: '/spare-parts', label: '备件库存' },
  { key: '/inspection', label: '巡检保养' },
  { key: '/contracts', label: '客户合同' },
  { key: '/approval/config', label: '审批配置' },
  { key: '/approval/instances', label: '审批中心' },
  { key: '/announcements', label: '公告通知' },
  { key: '/users', label: '用户管理' },
  { key: '/orgs', label: '机构管理' }
]

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const raw = localStorage.getItem('hm_user')
  const user: User | null = raw ? JSON.parse(raw) : null

  const selected = MENU_ITEMS.map((m) => m.key).find((k) => location.pathname.startsWith(k)) || '/dashboard'

  function logout() {
    localStorage.removeItem('hm_token')
    localStorage.removeItem('hm_user')
    navigate('/login', { replace: true })
  }

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <AntLayout.Sider theme='dark' width={200}>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: 16, padding: 16, letterSpacing: 1 }}>
          重工机械数字化平台
        </div>
        <Menu
          theme='dark'
          mode='inline'
          selectedKeys={[selected]}
          items={MENU_ITEMS}
          onClick={({ key }) => navigate(key)}
        />
      </AntLayout.Sider>
      <AntLayout>
        <AntLayout.Header
          style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Typography.Title level={4} style={{ margin: 0 }}>
            {MENU_ITEMS.find((m) => m.key === selected)?.label || '数据仪表盘'}
          </Typography.Title>
          <Space>
            <UserOutlined />
            <span>{user?.nickname || user?.username || '管理员'}</span>
            <Dropdown
              menu={{ items: [{ key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: logout }] }}
            >
              <span style={{ cursor: 'pointer' }}>···</span>
            </Dropdown>
          </Space>
        </AntLayout.Header>
        <AntLayout.Content style={{ margin: 16 }}>
          <Outlet />
        </AntLayout.Content>
      </AntLayout>
    </AntLayout>
  )
}