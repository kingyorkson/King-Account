import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user ?? null))
  }, [])

  if (user) {
    return (
      <div className="home-page">
        <div className="home-badge">Signed In</div>
        <h1>Welcome back, {user.email}</h1>
        <p>Manage your account, view authorized apps, and configure your settings.</p>
        <Link to="/dashboard" className="btn btn-primary">Go to Dashboard</Link>
      </div>
    )
  }

  return (
    <div className="home-page">
      <div className="home-badge">King Account</div>
      <h1>Your Central Identity</h1>
      <p>Sign in once to access all your King applications securely.</p>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <Link to="/signin" className="btn btn-primary">Sign In</Link>
        <Link to="/signup" className="btn btn-outline">Create Account</Link>
      </div>
    </div>
  )
}
