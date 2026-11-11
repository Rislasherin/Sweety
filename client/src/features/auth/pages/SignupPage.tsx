import React from 'react'
import { AuthTemplate } from '@/components/templates/AuthTemplate'
import { SignupForm } from '../components/SignupForm'

export const SignupPage: React.FC = () => {
  return (
    <AuthTemplate
      title="Create your account"
      subtitle="Track your blood glucose with precision and peace of mind"
    >
      <SignupForm />
    </AuthTemplate>
  )
}
