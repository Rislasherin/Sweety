import React from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from '../organisms/Header'
import { Footer } from '../organisms/Footer'
import { ErrorBoundary } from '../organisms/ErrorBoundary'
import { useHealthCheck } from '@/hooks/useHealthCheck'

export interface MainLayoutProps {
  children?: React.ReactNode
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { status } = useHealthCheck()

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header apiStatus={status} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ErrorBoundary>{children || <Outlet />}</ErrorBoundary>
      </main>
      <Footer />
    </div>
  )
}
