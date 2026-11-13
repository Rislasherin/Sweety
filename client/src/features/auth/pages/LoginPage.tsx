import React, { useEffect } from 'react'
import { AuthTemplate } from '@/components/templates/AuthTemplate'
import { LoginForm } from '../components/LoginForm'

export const LoginPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Sweety — Sign In'
  }, [])

  return (
    <AuthTemplate
      title="Welcome back"
      subtitle="Sign in to your Sweety blood glucose tracking account"
    >
      <LoginForm />
    </AuthTemplate>
  )
}
