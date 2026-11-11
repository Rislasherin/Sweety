import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Badge } from '../atoms/Badge'
import { Button } from '../atoms/Button'
import { cn } from '@/utils/cn'
import { useAuth } from '@/features/auth/hooks/useAuth'

export interface HeaderProps {
  apiStatus?: 'online' | 'offline' | 'checking'
}

export const Header: React.FC<HeaderProps> = ({ apiStatus = 'checking' }) => {
  const location = useLocation()
  const { user, isAuthenticated, logout } = useAuth()

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Readings', path: '/readings' },
    { label: 'Reports', path: '/reports', badge: 'Soon' },
  ]

  const statusVariant =
    apiStatus === 'online' ? 'success' : apiStatus === 'offline' ? 'danger' : 'neutral'
  const statusLabel =
    apiStatus === 'online' ? 'API Online' : apiStatus === 'offline' ? 'API Offline' : 'Connecting'

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold shadow-sm group-hover:bg-teal-700 transition-colors">
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m9-9H3" />
              </svg>
            </div>
            <div>
              <span className="text-lg font-bold text-slate-900 tracking-tight">Sweety</span>
              <span className="text-xs text-teal-600 font-medium block -mt-1">Glucose Tracker</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1" aria-label="Main Navigation">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5',
                    isActive
                      ? 'bg-teal-50 text-teal-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  )}
                >
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-normal">
                      {link.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Badge variant={statusVariant} dot size="sm">
            {statusLabel}
          </Badge>

          {isAuthenticated && user ? (
            <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 font-semibold text-xs flex items-center justify-center">
                  {(user.name || user.email).charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left text-xs">
                  <div className="font-semibold text-slate-800 max-w-[120px] truncate">
                    {user.name || user.email.split('@')[0]}
                  </div>
                  <div className="text-slate-400 max-w-[120px] truncate">{user.email}</div>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={logout} className="text-xs">
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
