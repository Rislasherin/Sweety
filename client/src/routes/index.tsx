import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { MainLayout } from '@/components/templates/MainLayout'
import { HomePage } from '@/features/home/pages/HomePage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { SignupPage } from '@/features/auth/pages/SignupPage'
import { NotFoundPage } from '@/features/common/pages/NotFoundPage'
import { PublicOnlyRoute } from './PublicOnlyRoute'

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
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
