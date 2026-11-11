import React from 'react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../atoms/Card'

export interface AuthTemplateProps {
  title: string
  subtitle: string
  children: React.ReactNode
}

export const AuthTemplate: React.FC<AuthTemplateProps> = ({ title, subtitle, children }) => {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 group mb-6">
          <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold shadow-md group-hover:bg-teal-700 transition-colors">
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m9-9H3" />
            </svg>
          </div>
          <div className="text-left">
            <span className="text-xl font-bold text-slate-900 tracking-tight block">Sweety</span>
            <span className="text-xs text-teal-600 font-semibold block -mt-1">Glucose Tracker</span>
          </div>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="shadow-md border-slate-200">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-slate-900">{title}</CardTitle>
            <CardDescription className="text-slate-500 mt-1">{subtitle}</CardDescription>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-slate-400">
          Protected with end-to-end user isolation and encrypted credentials.
        </p>
      </div>
    </div>
  )
}
