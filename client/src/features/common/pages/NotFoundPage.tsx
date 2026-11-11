import React from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/molecules/EmptyState'

export const NotFoundPage: React.FC = () => {
  return (
    <div className="py-16">
      <EmptyState
        title="Page Not Found"
        description="The page you are looking for does not exist or may have been moved."
        actionLabel="Back to Home"
        onAction={() => {
          window.location.href = '/'
        }}
        icon={
          <svg
            className="w-6 h-6 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        }
      />
      <div className="text-center mt-4">
        <Link to="/" className="text-sm text-teal-600 hover:text-teal-700 font-medium underline">
          Return to Dashboard
        </Link>
      </div>
    </div>
  )
}
