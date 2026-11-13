import React from 'react'

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 bg-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div>
          <span className="font-semibold text-slate-700">Sweety</span> Blood Glucose Tracker &copy;{' '}
          {new Date().getFullYear()}. All rights reserved.
        </div>
        <div className="text-center sm:text-right max-w-md text-slate-400">
          Disclaimer: Sweety is intended for personal health tracking and informational purposes
          only. It is not a substitute for professional medical advice.
        </div>
      </div>
    </footer>
  )
}
