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
import Orgs from './pages/Orgs'
import Suppliers from './pages/Suppliers'
import Purchases from './pages/Purchases'
import SpareParts from './pages/SpareParts'
import Inspection from './pages/Inspection'
import Announcements from './pages/Announcements'
import Contracts from './pages/Contracts'
import ApprovalConfig from './pages/ApprovalConfig'
import ApprovalInstances from './pages/ApprovalInstances'

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
          <Route path='orgs' element={<Orgs />} />
          <Route path='suppliers' element={<Suppliers />} />
          <Route path='purchases' element={<Purchases />} />
          <Route path='spare-parts' element={<SpareParts />} />
          <Route path='inspection' element={<Inspection />} />
          <Route path='announcements' element={<Announcements />} />
          <Route path='contracts' element={<Contracts />} />
          <Route path='approval/config' element={<ApprovalConfig />} />
          <Route path='approval/instances' element={<ApprovalInstances />} />
        </Route>
        <Route path='*' element={<Navigate to='/' replace />} />
      </Routes>
    </HashRouter>
  )
}