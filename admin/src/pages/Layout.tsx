import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import type { User } from '../types'

const NAVS = [
  { to: '/dashboard', label: '数据仪表盘' },
  { to: '/devices', label: '设备管理' },
  { to: '/workorders', label: '维修工单' },
  { to: '/projects', label: '工程管理' },
  { to: '/rentals', label: '租赁管理' },
  { to: '/users', label: '用户管理' }
]

export default function Layout() {
  const navigate = useNavigate()
  const raw = localStorage.getItem('hm_user')
  const user: User | null = raw ? JSON.parse(raw) : null

  const titleMap: Record<string, string> = {
    dashboard: '数据仪表盘',
    devices: '设备管理',
    workorders: '维修工单管理',
    projects: '工程管理',
    rentals: '租赁管理',
    users: '用户管理'
  }
  const hash = window.location.hash.replace('#/', '').split('?')[0] || 'dashboard'
  const title = titleMap[hash] || '数据仪表盘'

  function logout() {
    localStorage.removeItem('hm_token')
    localStorage.removeItem('hm_user')
    navigate('/login', { replace: true })
  }

  return (
    <div className='layout'>
      <aside className='sidebar'>
        <div className='sidebar-logo'>
          <div className='sb-title'>重工机械数字化平台</div>
          <div className='sb-sub'>Administration Console</div>
        </div>
        <nav className='sidebar-nav'>
          {NAVS.map((n) => (
            <NavLink key={n.to} to={n.to} className={({ isActive }) => `sb-item ${isActive ? 'active' : ''}`}>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className='sidebar-footer'>v2.0 企业内部版</div>
      </aside>
      <div className='main'>
        <header className='topbar'>
          <div className='topbar-title'>{title}</div>
          <div className='topbar-user'>
            <div className='topbar-avatar'>{user?.nickname?.charAt(0) || user?.username?.charAt(0) || 'A'}</div>
            <span className='topbar-name'>{user?.nickname || user?.username || '管理员'}</span>
            <button className='topbar-logout' onClick={logout}>退出登录</button>
          </div>
        </header>
        <main className='content'>
          <Outlet />
        </main>
      </div>
    </div>
  )
}