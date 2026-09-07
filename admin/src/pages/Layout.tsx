import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Layout as AntLayout, Menu, Dropdown, Space, Typography, Breadcrumb } from 'antd'
import {
  LogoutOutlined,
  UserOutlined,
  DashboardOutlined,
  ToolOutlined,
  FileDoneOutlined,
  SafetyCertificateOutlined,
  ProjectOutlined,
  CarryOutOutlined,
  TeamOutlined,
  ShoppingCartOutlined,
  DatabaseOutlined,
  AuditOutlined,
  SettingOutlined,
  NotificationOutlined,
  ApartmentOutlined,
  AppstoreOutlined,
  ShoppingOutlined,
  BarChartOutlined,
  BulbOutlined
} from '@ant-design/icons'
import type { User } from '../types'
import type { ReactNode } from 'react'
import { useThemeCtx } from '../theme'

interface MenuGroup {
  key: string
  label: string
  icon?: ReactNode
  children?: { key: string; label: string }[]
}

const MENU_GROUPS: MenuGroup[] = [
  { key: '/dashboard', label: '数据总览', icon: <DashboardOutlined /> },
  { key: '/charts', label: '数据图表', icon: <BarChartOutlined /> },
  {
    key: 'g-devices', label: '设备运维', icon: <AppstoreOutlined />, children: [
      { key: '/devices', label: '设备管理', icon: <ToolOutlined /> },
      { key: '/workorders', label: '维修工单', icon: <FileDoneOutlined /> },
      { key: '/inspection', label: '巡检保养', icon: <SafetyCertificateOutlined /> }
    ]
  },
  {
    key: 'g-engineering', label: '工程项目', icon: <ProjectOutlined />, children: [
      { key: '/projects', label: '工程管理', icon: <ProjectOutlined /> },
      { key: '/rentals', label: '租赁管理', icon: <CarryOutOutlined /> }
    ]
  },
  {
    key: 'g-supply', label: '供应链中心', icon: <ShoppingOutlined />, children: [
      { key: '/suppliers', label: '供应商管理', icon: <TeamOutlined /> },
      { key: '/purchases', label: '采购管理', icon: <ShoppingCartOutlined /> },
      { key: '/spare-parts', label: '备件库存', icon: <DatabaseOutlined /> },
      { key: '/contracts', label: '客户合同', icon: <FileDoneOutlined /> }
    ]
  },
  {
    key: 'g-approval', label: '审批中心', icon: <AuditOutlined />, children: [
      { key: '/approval/config', label: '审批配置', icon: <SettingOutlined /> },
      { key: '/approval/instances', label: '审批实例', icon: <AuditOutlined /> }
    ]
  },
  {
    key: 'g-system', label: '系统管理', icon: <SettingOutlined />, children: [
      { key: '/announcements', label: '公告通知', icon: <NotificationOutlined /> },
      { key: '/users', label: '用户管理', icon: <UserOutlined /> },
      { key: '/orgs', label: '机构管理', icon: <ApartmentOutlined /> }
    ]
  }
]

const MENU_ITEMS: { key: string; label: string }[] = MENU_GROUPS.flatMap((g) => (g.children ? g.children : [g]))

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, changeTheme } = useThemeCtx()
  const raw = localStorage.getItem('hm_user')
  const user: User | null = raw ? JSON.parse(raw) : null
  const dark = theme === 'dark'

  const selected = MENU_ITEMS.map((m) => m.key).find((k) => location.pathname === k || location.pathname.startsWith(k + '/')) || '/dashboard'
  const group = MENU_GROUPS.find((g) => (g.children || []).some((c) => c.key === selected))
  const label = MENU_ITEMS.find((m) => m.key === selected)?.label || '数据总览'

  function logout() {
    localStorage.removeItem('hm_token')
    localStorage.removeItem('hm_user')
    navigate('/login', { replace: true })
  }

  return (
    <AntLayout style={{ minHeight: '100vh', background: dark ? '#000' : '#F0F2F5' }}>
      <AntLayout.Sider theme={dark ? 'light' : 'dark'} width={220}>
        <div style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#FF8A3D,#F2540E)', fontWeight: 800, fontSize: 16, letterSpacing: 1, color: '#fff' }}>
          机械数字化平台
        </div>
        <Menu
          theme={dark ? 'light' : 'dark'}
          mode='inline'
          selectedKeys={[selected]}
          defaultOpenKeys={group ? [group.key] : []}
          items={MENU_GROUPS.map((g) =>
            g.children
              ? { key: g.key, label: g.label, icon: g.icon, children: g.children.map((c) => ({ key: c.key, label: c.label, icon: c.icon })) }
              : { key: g.key, label: g.label, icon: g.icon }
          )}
          onClick={({ key }) => {
            if (MENU_ITEMS.some((m) => m.key === key)) navigate(key)
          }}
        />
      </AntLayout.Sider>
      <AntLayout>
        <AntLayout.Header
          style={{ background: dark ? '#141414' : '#fff', color: dark ? 'rgba(255,255,255,0.85)' : undefined, padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,21,41,0.08)' }}
        >
          <Breadcrumb style={{ fontSize: 14 }}
            items={[
              ...(group ? [{ title: group.label }] : []),
              { title: <b>{label}</b> }
            ]} />
          <Space>
            <Dropdown
              menu={{
                selectable: true,
                selectedKeys: [theme],
                items: [
                  { key: 'light', icon: <BulbOutlined />, label: '浅色模式' },
                  { key: 'dark', icon: <BulbOutlined />, label: '深色模式' }
                ],
                onClick: ({ key }) => changeTheme(key)
              }}
            >
              <span style={{ cursor: 'pointer' }}><BulbOutlined /> 主题</span>
            </Dropdown>
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
          <div style={{ background: dark ? '#1f1f1f' : '#fff', padding: 24, borderRadius: 8, minHeight: 'calc(100vh - 160px)' }}>
            <Outlet />
          </div>
        </AntLayout.Content>
      </AntLayout>
    </AntLayout>
  )
}