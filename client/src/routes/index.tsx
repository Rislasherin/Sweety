import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { MainLayout } from '@/components/templates/MainLayout'
import { HomePage } from '@/features/home/pages/HomePage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { SignupPage } from '@/features/auth/pages/SignupPage'
import { ReadingsPage } from '@/features/readings/pages/ReadingsPage'
import { ReportsPage } from '@/features/reports/pages/ReportsPage'
import { NotFoundPage } from '@/features/common/pages/NotFoundPage'
import { PublicOnlyRoute } from './PublicOnlyRoute'
import { ProtectedRoute } from './ProtectedRoute'

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Guest-only routes: redirect authenticated users to home */}
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<SignupPage />} />
      </Route>

      {/* Main application routes */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />

        {/* Protected feature routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/readings" element={<ReadingsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
