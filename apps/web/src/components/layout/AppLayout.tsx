import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { useState, useEffect } from 'react'

export function AppLayout() {
  // Listen for sidebar collapse to shift main content
  const [sidebarWidth, setSidebarWidth] = useState(220)

  useEffect(() => {
    // Observe sidebar width changes via ResizeObserver
    const sidebar = document.querySelector('aside')
    if (!sidebar) return
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setSidebarWidth(entry.contentRect.width + 1)
    })
    observer.observe(sidebar)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <main
        className="flex flex-col min-h-screen flex-1 transition-all duration-300"
        style={{ marginLeft: sidebarWidth }}
      >
        <Outlet />
      </main>
    </div>
  )
}
