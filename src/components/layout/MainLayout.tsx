import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useStore } from '../../store/useStore'

export default function MainLayout() {
  const initialize = useStore((s) => s.initialize)

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#04040A' }}>
      <Sidebar />
      <main
        className="flex-1"
        style={{ marginLeft: '240px', backgroundColor: '#04040A', minHeight: '100vh' }}
      >
        <Outlet />
      </main>
    </div>
  )
}
