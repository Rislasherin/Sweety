import React from 'react'
import { AuthTemplate } from '@/components/templates/AuthTemplate'
import { LoginForm } from '../components/LoginForm'

export const LoginPage: React.FC = () => {
  return (
    <AuthTemplate
      title="Welcome back"
      subtitle="Sign in to your Sweety blood glucose tracking account"
    >
      <LoginForm />
    </AuthTemplate>
  )
}
