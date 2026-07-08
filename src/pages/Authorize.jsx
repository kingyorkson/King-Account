import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Authorize() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [app, setApp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [authorizing, setAuthorizing] = useState(false)

  const clientId = searchParams.get('client_id')
  const redirectUri = searchParams.get('redirect_uri')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data?.user ?? null)

      if (!clientId || !redirectUri) {
        setError('Missing required parameters: client_id and redirect_uri')
        setLoading(false)
        return
      }

      const { data: appData } = await supabase
        .from('apps')
        .select('*')
        .eq('id', clientId)
        .single()

      if (!appData) {
        setError('Application not found. Invalid client_id.')
        setLoading(false)
        return
      }

      setApp(appData)
      setLoading(false)
    })
  }, [clientId, redirectUri])

  const handleAuthorize = async () => {
    setAuthorizing(true)
    setError('')

    const { error: authError } = await supabase.from('authorizations').upsert({
      user_id: user.id,
      app_id: clientId,
      scopes: ['identity'],
      updated_at: new Date().toISOString(),
    })

    if (authError) {
      setError('Failed to authorize. Please try again.')
      setAuthorizing(false)
      return
    }

    const code = crypto.randomUUID()
    const redirectUrl = new URL(redirectUri)
    redirectUrl.searchParams.set('code', code)

    window.location.href = redirectUrl.toString()
  }

  const handleDeny = () => {
    const redirectUrl = new URL(redirectUri)
    redirectUrl.searchParams.set('error', 'access_denied')
    window.location.href = redirectUrl.toString()
  }

  if (loading) {
    return <div className="text-center mt-2 text-muted">Loading...</div>
  }

  if (error && !app) {
    return (
      <div className="authorize-page">
        <div className="alert alert-error">{error}</div>
      </div>
    )
  }

  const goToSignIn = () => {
    sessionStorage.setItem('redirectAfterAuth', window.location.hash.replace('#', ''))
    navigate('/signin')
  }

  if (!user) {
    return (
      <div className="authorize-page">
        <h2>Sign in required</h2>
        <p className="text-muted mb-1">You need to sign in to authorize this application.</p>
        <button className="btn btn-primary" onClick={goToSignIn}>
          Sign In
        </button>
      </div>
    )
  }

  const handleSwitchAccount = async () => {
    await supabase.auth.signOut()
    sessionStorage.setItem('redirectAfterAuth', window.location.hash.replace('#', ''))
    navigate('/signin')
  }

  return (
    <div className="authorize-page">
      <div className="card">
        <div className="app-icon">{app.name.charAt(0)}</div>

        <h2>{app.name}</h2>
        <p className="text-muted" style={{ fontSize: '0.875rem' }}>
          {app.description || 'No description provided'}
        </p>

        <div className="authorize-scopes">
          <h3>This application will be able to:</h3>
          <div className="scope-item">
            <div className="scope-icon">👤</div>
            <div>
              <strong>View your identity</strong>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                See your email and account information
              </p>
            </div>
          </div>
          <div className="scope-item">
            <div className="scope-icon">☁️</div>
            <div>
              <strong>Cloud storage</strong>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Store and retrieve data on your behalf
              </p>
            </div>
          </div>
        </div>

        <p className="text-muted" style={{ fontSize: '0.8125rem', marginBottom: '1rem' }}>
          Signed in as <strong>{user.email}</strong>
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="authorize-actions">
          <button className="btn btn-outline" onClick={handleDeny} disabled={authorizing}>
            Deny
          </button>
          <button className="btn btn-primary" onClick={handleAuthorize} disabled={authorizing}>
            {authorizing ? 'Authorizing...' : 'Authorize'}
          </button>
        </div>

        <div style={{ marginTop: '1rem' }}>
          <button
            className="btn btn-outline"
            style={{ width: '100%', fontSize: '0.8125rem' }}
            onClick={handleSwitchAccount}
          >
            Switch account
          </button>
        </div>
      </div>
    </div>
  )
}
