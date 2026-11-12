import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/atoms'
import { FormField, StatusPill, Alert } from '@/components/molecules'
import { useHealthCheck } from '@/hooks/useHealthCheck'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { formatDateTime } from '@/utils/date'

export const HomePage: React.FC = () => {
  const { status, lastChecked, recheck } = useHealthCheck()
  const { user, isAuthenticated } = useAuth()
  const [testValue, setTestValue] = useState<string>('95')
  const [isPinging, setIsPinging] = useState(false)
  const [showAlert, setShowAlert] = useState(true)

  const handlePing = async () => {
    setIsPinging(true)
    try {
      await recheck()
    } finally {
      setIsPinging(false)
    }
  }

  const numericValue = parseFloat(testValue) || 95

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <section className="bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-lg relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-200 border border-teal-400/30 text-xs font-medium mb-4">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span>
              {isAuthenticated ? 'Session Active & Isolated' : 'Authentication Module Active'}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            {isAuthenticated && user
              ? `Welcome back, ${user.name || user.email.split('@')[0]}`
              : 'Welcome to Sweety'}
          </h1>
          <p className="text-teal-100/90 text-base sm:text-lg leading-relaxed mb-6">
            {isAuthenticated && user
              ? `You are signed in as ${user.email}. Your blood glucose readings are encrypted and strictly isolated.`
              : 'A clinical-grade, modern blood glucose tracking application built with React, TypeScript, Tailwind CSS, and Atomic Design architecture.'}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {isAuthenticated ? (
              <Link to="/readings">
                <Button
                  variant="secondary"
                  size="md"
                  className="font-semibold bg-white text-teal-900 hover:bg-teal-50"
                >
                  Manage Glucose Readings
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/register">
                  <Button
                    variant="secondary"
                    size="md"
                    className="font-semibold bg-white text-teal-900 hover:bg-teal-50"
                  >
                    Get Started
                  </Button>
                </Link>
                <Link to="/login">
                  <Button
                    variant="outline"
                    size="md"
                    className="border-teal-300/40 text-white hover:bg-teal-700/50"
                  >
                    Sign In
                  </Button>
                </Link>
              </>
            )}
            <Button
              variant="ghost"
              size="md"
              isLoading={isPinging}
              onClick={handlePing}
              className="text-teal-100 hover:bg-teal-700/50"
            >
              Test Backend Connection
            </Button>
          </div>
        </div>

        {/* Decorative background circle */}
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
      </section>

      {/* Alert Component Example */}
      {showAlert && (
        <Alert
          variant={status === 'online' ? 'success' : status === 'offline' ? 'danger' : 'info'}
          title={
            status === 'online'
              ? 'Backend API Connected'
              : status === 'offline'
                ? 'Backend API Offline'
                : 'Verifying API Connectivity'
          }
          onClose={() => setShowAlert(false)}
        >
          {status === 'online'
            ? `Successfully connected to the Sweety Express backend. Last verified: ${lastChecked ? formatDateTime(lastChecked) : 'just now'}.`
            : status === 'offline'
              ? 'Unable to communicate with the Express API service on /api/health. Ensure the backend server is running.'
              : 'Pinging backend health check endpoint...'}
        </Alert>
      )}

      {/* Feature Modules Status */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-600">
                Module 01
              </span>
              <Badge variant="success">Active</Badge>
            </div>
            <CardTitle>Authentication</CardTitle>
            <CardDescription>
              User registration, login, and secure JWT session management.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-xs text-slate-500 space-y-1.5 list-disc list-inside">
              <li>Form validation with standard error schemas</li>
              <li>JWT storage & Bearer token request interceptor</li>
              <li>Dedicated auth service contracts</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-600">
                Module 02
              </span>
              <Badge variant="success">Active</Badge>
            </div>
            <CardTitle>Glucose Readings</CardTitle>
            <CardDescription>
              Full CRUD for tracking blood glucose, meal contexts, and slots.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-xs text-slate-500 space-y-1.5 list-disc list-inside mb-4">
              <li>Clinical status categorization (Low, Normal, Elevated, High)</li>
              <li>Filterable history by calendar date</li>
              <li>Validated entry forms with responsive modals</li>
            </ul>
            <Link to="/readings">
              <Button variant="outline" size="sm" className="w-full text-xs">
                Open Dashboard &rarr;
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-600">
                Module 03
              </span>
              <Badge variant="info">Ready to Build</Badge>
            </div>
            <CardTitle>Reports & Analytics</CardTitle>
            <CardDescription>
              Aggregated daily, month-to-date, and previous-month summaries.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-xs text-slate-500 space-y-1.5 list-disc list-inside">
              <li>Statistical breakdown (Average, Min, Max, Count)</li>
              <li>Time-in-range percentage visualizations</li>
              <li>Comprehensive period comparison</li>
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* Atomic Design Foundation Preview */}
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-slate-900">Atomic UI Foundation</h2>
          <p className="text-sm text-slate-500">
            Interactive preview of established design tokens, buttons, inputs, and clinical glucose
            badges.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Clinical Glucose Categorization Molecule */}
          <Card>
            <CardHeader>
              <CardTitle>Glucose Status Molecule</CardTitle>
              <CardDescription>
                Automatic categorization based on clinical thresholds (&lt;70 Low, 70–99 Normal,
                100–125 Elevated, &ge;126 High).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                label="Sample Glucose Reading (mg/dL)"
                type="number"
                value={testValue}
                onChange={(e) => setTestValue(e.target.value)}
                helperText="Type any blood glucose value to observe live clinical badge changes."
              />
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="text-sm text-slate-600 font-medium">Computed Status:</span>
                <StatusPill value={numericValue} />
              </div>
            </CardContent>
          </Card>

          {/* Button Atoms */}
          <Card>
            <CardHeader>
              <CardTitle>Reusable Button Atoms</CardTitle>
              <CardDescription>
                Consistent design variants supporting accessibility, loading states, and sizing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2.5">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 pt-2">
                <Button variant="primary" size="sm">
                  Small
                </Button>
                <Button variant="primary" size="md">
                  Medium
                </Button>
                <Button variant="primary" size="lg">
                  Large
                </Button>
                <Button variant="primary" isLoading>
                  Loading
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
