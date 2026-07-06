import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ProtectedRoute({ children }) {
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setStatus(data?.user ? 'authenticated' : 'unauthenticated')
    })
  }, [])

  if (status === 'loading') {
    return <div className="text-center mt-2 text-muted">Loading...</div>
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/signin" replace />
  }

  return children
}
