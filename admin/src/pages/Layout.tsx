import { useEffect, useMemo, useRef, useState } from 'react'
import { Outlet, useLocation, useNavigate, useOutlet } from 'react-router-dom'
import { Layout as AntLayout, Menu, Dropdown, Space, Breadcrumb, Tabs, Button, Tooltip } from 'antd'
import {
  LogoutOutlined, UserOutlined, DashboardOutlined, ToolOutlined, FileDoneOutlined, SafetyCertificateOutlined,
  ProjectOutlined, CarryOutOutlined, TeamOutlined, ShoppingCartOutlined, DatabaseOutlined, AuditOutlined,
  SettingOutlined, NotificationOutlined, ApartmentOutlined, AppstoreOutlined, ShoppingOutlined, BarChartOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons'
import type { User, SysMenu } from '../types'
import type { ReactNode } from 'react'
import { useThemeCtx } from '../theme'
import ThemeSettings from '../ThemeSettings'
import { get } from '../api'

interface MenuLeaf { key: string; label: string; icon?: ReactNode }

interface MenuGroup {
  key: string
  label: string
  icon?: ReactNode
  children?: MenuLeaf[]
}

const STATIC_GROUPS: MenuGroup[] = [
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
      { key: '/menus', label: '菜单管理', icon: <AppstoreOutlined /> },
      { key: '/users', label: '用户管理', icon: <UserOutlined /> },
      { key: '/orgs', label: '机构管理', icon: <ApartmentOutlined /> }
    ]
  }
]

const ICON_MAP: Record<string, ReactNode> = {
  dashboard: <DashboardOutlined />,
  bar: <BarChartOutlined />,
  appstore: <AppstoreOutlined />,
  tool: <ToolOutlined />,
  file: <FileDoneOutlined />,
  safety: <SafetyCertificateOutlined />,
  project: <ProjectOutlined />,
  carry: <CarryOutOutlined />,
  shopping: <ShoppingOutlined />,
  team: <TeamOutlined />,
  cart: <ShoppingCartOutlined />,
  database: <DatabaseOutlined />,
  audit: <AuditOutlined />,
  setting: <SettingOutlined />,
  notice: <NotificationOutlined />,
  user: <UserOutlined />,
  apartment: <ApartmentOutlined />,
  menu: <AppstoreOutlined />,
  box: <DatabaseOutlined />
}

interface TabItem { path: string; label: string }

function luminance(hex: string) {
  const c = hex.replace('#', '')
  const r = parseInt(c.substr(0, 2), 16) / 255
  const g = parseInt(c.substr(2, 2), 16) / 255
  const b = parseInt(c.substr(4, 2), 16) / 255
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function buildMenus(db: SysMenu[] | null): MenuGroup[] {
  if (!db || db.length === 0) return STATIC_GROUPS
  const byId = new Map(db.map((m) => [m.id, m]))
  const groups: MenuGroup[] = []
  const enabled = db.filter((m) => m.enabled !== false)
  const parents = enabled.filter((m) => m.type === 'parent').sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
  for (const p of parents) {
    const children = enabled
      .filter((m) => m.type === 'item' && m.parentId === p.id)
      .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
    if (children.length > 0) {
      groups.push({
        key: 'db-' + p.id,
        label: p.name,
        icon: p.icon ? ICON_MAP[p.icon] : undefined,
        children: children.map((c) => ({ key: c.path || '', label: c.name, icon: c.icon ? ICON_MAP[c.icon] : undefined }))
      })
    }
  }
  const topItems = enabled
    .filter((m) => m.type === 'item' && (m.parentId == null || !byId.has(m.parentId)))
    .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
  for (const m of topItems) {
    groups.push({ key: m.path || 'db-item-' + m.id, label: m.name, icon: m.icon ? ICON_MAP[m.icon] : undefined })
  }
  return groups
}

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const outlet = useOutlet()
  const { settings, update, dark } = useThemeCtx()
  const raw = localStorage.getItem('hm_user')
  const user: User | null = raw ? JSON.parse(raw) : null

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [tabs, setTabs] = useState<TabItem[]>([])
  const [dbMenus, setDbMenus] = useState<SysMenu[] | null>(null)
  const cacheRef = useRef(new Map<string, ReactNode>())

  useEffect(() => {
    const load = () => get<SysMenu[]>('/admin/menus/list').then(setDbMenus).catch(() => {})
    load()
    window.addEventListener('hm-menus-refresh', load)
    return () => window.removeEventListener('hm-menus-refresh', load)
  }, [])

  const MENU_GROUPS = useMemo(() => buildMenus(dbMenus), [dbMenus])
  const MENU_ITEMS: MenuLeaf[] = MENU_GROUPS.flatMap((g) => (g.children ? g.children : [g]))
  const PAGE_PATHS = MENU_ITEMS.map((m) => m.key)

  const selected = useMemo(
    () => PAGE_PATHS.find((k) => location.pathname === k || location.pathname.startsWith(k + '/')) || '/dashboard',
    [location.pathname, PAGE_PATHS]
  )
  const group = useMemo(() => MENU_GROUPS.find((g) => (g.children || []).some((c) => c.key === selected)), [selected, MENU_GROUPS])
  const label = useMemo(() => MENU_ITEMS.find((m) => m.key === selected)?.label || '数据总览', [selected, MENU_ITEMS])

  const siderDark = !settings.siderVisible ? false : luminance(settings.siderColor) < 0.5

  useEffect(() => {
    if (!PAGE_PATHS.includes(location.pathname) && location.pathname !== '/') {
      navigate('/dashboard', { replace: true })
      return
    }
    const path = PAGE_PATHS.includes(location.pathname) ? location.pathname : '/dashboard'
    setTabs((prev) => prev.some((t) => t.path === path)
      ? prev
      : [...prev, { path, label: MENU_ITEMS.find((m) => m.key === path)?.label || path }])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, navigate])

  // 渲染期写入页面缓存，保证 keep-alive 元素先于渲染存在
  if (location.pathname && PAGE_PATHS.includes(location.pathname) && !cacheRef.current.has(location.pathname)) {
    cacheRef.current.set(location.pathname, outlet)
  }

  function closeTab(path: string) {
    const idx = tabs.findIndex((t) => t.path === path)
    if (idx < 0) return
    cacheRef.current.delete(path)
    const next = tabs.filter((t) => t.path !== path)
    setTabs(next)
    if (selected === path) {
      const target = next[Math.min(idx, next.length - 1)]
      navigate(target ? target.path : '/dashboard')
    }
  }

  const siderBg = settings.siderColor
  const menuTheme = siderDark ? 'dark' : 'light'

  return (
    <AntLayout style={{ minHeight: '100vh', background: 'var(--hm-bg)' }}>
      {settings.siderVisible && (
        <AntLayout.Sider theme={menuTheme} width={220} style={{ background: siderBg }}>
          <div style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,' + settings.color + ', #F2540E)', fontWeight: 800, fontSize: 16, letterSpacing: 1, color: '#fff' }}>
            机械数字化平台
          </div>
          <Menu
            key={group && group.children ? group.key : selected}
            theme={menuTheme}
            mode='inline'
            selectedKeys={[selected]}
            defaultOpenKeys={group && group.children ? [group.key] : []}
            className={`hm-menu hm-menu-${settings.menuStyle}`}
            style={{ background: 'transparent', color: siderDark ? 'rgba(255,255,255,0.75)' : undefined }}
            items={MENU_GROUPS.map((g) =>
              g.children
                ? { key: g.key, label: g.label, icon: g.icon, children: g.children.map((c) => ({ key: c.key, label: c.label, icon: c.icon })) }
                : { key: g.key, label: g.label, icon: g.icon }
            )}
            onClick={({ key }) => {
              if (PAGE_PATHS.includes(key)) navigate(key)
            }}
          />
        </AntLayout.Sider>
      )}
      <AntLayout>
        <AntLayout.Header
          style={{
            background: 'var(--hm-card)', color: dark ? 'rgba(255,255,255,0.85)' : undefined,
            padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            boxShadow: '0 1px 4px rgba(0,21,41,0.08)'
          }}
        >
          <Space>
            {!settings.siderVisible && (
              <Tooltip title='显示侧边栏'>
                <Button type='text' icon={<MenuUnfoldOutlined />} onClick={() => update({ siderVisible: true })} />
              </Tooltip>
            )}
            <Breadcrumb style={{ fontSize: 14 }}
              items={[
                ...(group ? [{ title: group.label }] : []),
                { title: <b>{label}</b> }
              ]} />
          </Space>
          <Space>
            <Tooltip title='主题与布局设置'>
              <Button type='text' icon={<SettingOutlined />} onClick={() => setSettingsOpen(true)} />
            </Tooltip>
            <UserOutlined />
            <span style={{ color: dark ? 'rgba(255,255,255,0.85)' : undefined }}>{user?.nickname || user?.username || '管理员'}</span>
            <Dropdown
              menu={{ items: [{ key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: () => { localStorage.removeItem('hm_token'); localStorage.removeItem('hm_user'); navigate('/login', { replace: true }) } }] }}
            >
              <span style={{ cursor: 'pointer' }}>···</span>
            </Dropdown>
          </Space>
        </AntLayout.Header>

        {settings.multiTab && tabs.length > 0 && (
          <div style={{ background: 'var(--hm-card)', padding: '4px 16px 0', boxShadow: '0 1px 3px rgba(0,21,41,0.05)' }}>
            <Tabs
              type='editable-card'
              hideAdd
              size='small'
              activeKey={selected}
              items={tabs.map((t) => ({
                key: t.path,
                label: t.label,
                closable: t.path !== '/dashboard'
              }))}
              onChange={(key) => navigate(key)}
              onEdit={(targetKey, action) => { if (action === 'remove') closeTab(targetKey as string) }}
            />
          </div>
        )}

        <AntLayout.Content style={{ margin: 16 }}>
          <div
            style={{
              background: 'var(--hm-card)', padding: 24, borderRadius: 8,
              minHeight: settings.multiTab ? 'calc(100vh - 210px)' : 'calc(100vh - 160px)'
            }}
          >
            {tabs.map((t) => (
              <div key={t.path} style={{ display: selected === t.path ? 'block' : 'none' }}>
                {cacheRef.current.get(t.path)}
              </div>
            ))}
          </div>
        </AntLayout.Content>
      </AntLayout>
      <ThemeSettings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </AntLayout>
  )
}