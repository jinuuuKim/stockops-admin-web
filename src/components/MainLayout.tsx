/**
 * Main layout component with sidebar navigation.
 * Enhanced with dark sidebar, warehouse selector, and notification bell.
 *
 * @author StockOps Team
 * @since 1.0
 */

import { useState } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { 
  LayoutDashboard, Package, ArrowDownToLine, ArrowUpFromLine, 
  MapPin, LogOut, Clock, Menu, X, Bell
} from 'lucide-react'

/**
 * Navigation item configuration.
 */
interface NavItem {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

/**
 * Navigation menu items.
 */
const navItems: NavItem[] = [
  { to: '/dashboard', label: '대시보드', icon: LayoutDashboard },
  { to: '/inventory', label: '재고 관리', icon: Package },
  { to: '/inbound', label: '입고 관리', icon: ArrowDownToLine },
  { to: '/outbound', label: '출고 관리', icon: ArrowUpFromLine },
  { to: '/locations', label: '위치 관리', icon: MapPin },
  { to: '/expiry', label: '유통기한', icon: Clock },
]

/**
 * Main layout with sidebar navigation and content area.
 * Uses React Router Outlet for nested routes.
 *
 * @returns Layout JSX element with sidebar and content area
 */
export function MainLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getPageTitle = () => {
    const item = navItems.find(item => item.to === location.pathname)
    return item?.label || 'StockOps'
  }

  return (
    <div className="min-h-screen flex bg-bg-secondary">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-bg-dark text-white flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">📦 StockOps</h1>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 hover:bg-white/10 rounded"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Warehouse Selector */}
          <div className="mt-4">
            <select className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm">
              <option value="main">🏪 본점</option>
              <option value="gangnam">🏪 강남점</option>
              <option value="hongdae">🏪 홍대점</option>
            </select>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 p-3 rounded-lg mb-1 transition-colors ${
                  isActive 
                    ? 'bg-primary-600 text-white' 
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center justify-between text-sm text-white/70 mb-3">
            <span>{user?.email || 'admin@stockops.com'}</span>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 p-2 rounded hover:bg-white/10 w-full text-white/70"
          >
            <LogOut className="w-4 h-4" />
            로그아웃
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-neutral-100 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-semibold text-text-primary">
              {getPageTitle()}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-neutral-100 rounded-lg relative">
              <Bell className="w-5 h-5 text-text-secondary" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button 
              onClick={handleLogout}
              className="hidden lg:flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:bg-neutral-100 rounded-lg"
            >
              <LogOut className="w-4 h-4" />
              로그아웃
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
