import { useState } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Layout from './pages/Layout'
import Dashboard from './pages/Dashboard'
import Devices from './pages/Devices'
import WorkOrders from './pages/WorkOrders'
import Users from './pages/Users'
import Projects from './pages/Projects'
import Rentals from './pages/Rentals'

function RequireAuth({ children }: { children: React.ReactElement }) {
  const [token] = useState(() => localStorage.getItem('hm_token'))
  if (!token) return <Navigate to='/login' replace />
  return children
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path='/login' element={<Login />} />
        <Route
          path='/'
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to='/dashboard' replace />} />
          <Route path='dashboard' element={<Dashboard />} />
          <Route path='devices' element={<Devices />} />
          <Route path='workorders' element={<WorkOrders />} />
          <Route path='users' element={<Users />} />
          <Route path='projects' element={<Projects />} />
          <Route path='rentals' element={<Rentals />} />
        </Route>
        <Route path='*' element={<Navigate to='/' replace />} />
      </Routes>
    </HashRouter>
  )
}