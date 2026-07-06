import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Navbar() {
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user ?? null))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => listener?.subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">King Account</Link>
      <div className="navbar-links">
        {user ? (
          <>
            <span className="text-muted" style={{ fontSize: '0.8125rem' }}>
              {user.email}
            </span>
            <Link to="/dashboard">Dashboard</Link>
            <button onClick={handleSignOut}>Sign Out</button>
          </>
        ) : (
          <>
            <Link to="/signin">Sign In</Link>
            <Link to="/signup">Create Account</Link>
          </>
        )}
      </div>
    </nav>
  )
}
