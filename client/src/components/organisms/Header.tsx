import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '../atoms/Button'
import { cn } from '@/utils/cn'
import { useAuth } from '@/features/auth/hooks/useAuth'

export interface HeaderProps {
  apiStatus?: 'online' | 'offline' | 'checking'
}

export const Header: React.FC<HeaderProps> = ({ apiStatus = 'checking' }) => {
  const location = useLocation()
  const { user, isAuthenticated, logout } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navLinks: { label: string; path: string; badge?: string }[] = [
    { label: 'Home', path: '/' },
    { label: 'Readings', path: '/readings' },
    { label: 'Reports', path: '/reports' },
  ]

  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200">
      {/* Offline Alert - Only displayed if service connection is actually severed */}
      {apiStatus === 'offline' && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-2 text-center text-xs font-medium text-rose-700">
          We are currently unable to reach the Sweety health service. Please check your network connection.
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Desktop Navigation */}
        <div className="flex items-center gap-8">
          <Link to="/" onClick={closeMobileMenu} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold shadow-xs group-hover:bg-teal-700 transition-colors">
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

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main Navigation">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    'px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5',
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

        {/* Right Controls: User Profile / Auth Actions + Mobile Menu Toggle */}
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="hidden sm:flex items-center gap-3 pl-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 font-semibold text-xs flex items-center justify-center ring-2 ring-white">
                  {(user.name || user.email).charAt(0).toUpperCase()}
                </div>
                <div className="text-left text-xs">
                  <div className="font-semibold text-slate-800 max-w-[120px] truncate">
                    {user.name || user.email.split('@')[0]}
                  </div>
                  <div className="text-slate-400 max-w-[120px] truncate">{user.email}</div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-xs text-slate-600 hover:text-slate-900"
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
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

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            aria-label="Toggle Navigation Menu"
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen((open) => !open)}
          >
            {isMobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
          <nav className="flex flex-col space-y-1" aria-label="Mobile Navigation">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={closeMobileMenu}
                  className={cn(
                    'px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between',
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

          {/* Mobile Auth Actions */}
          <div className="pt-3 border-t border-slate-100">
            {isAuthenticated && user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2.5 px-2">
                  <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 font-semibold text-xs flex items-center justify-center">
                    {(user.name || user.email).charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left text-xs">
                    <div className="font-semibold text-slate-800">{user.name || user.email.split('@')[0]}</div>
                    <div className="text-slate-400">{user.email}</div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    closeMobileMenu()
                    logout()
                  }}
                  className="w-full text-xs text-slate-700"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link to="/login" onClick={closeMobileMenu}>
                  <Button variant="outline" size="sm" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register" onClick={closeMobileMenu}>
                  <Button variant="primary" size="sm" className="w-full">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
