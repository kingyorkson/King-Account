import { useState, useEffect } from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function DashboardHome() {
  const [user, setUser] = useState(null)
  const [appCount, setAppCount] = useState(0)
  const [storageCount, setStorageCount] = useState(0)
  const [deviceCount, setDeviceCount] = useState(0)
  const [createdAt, setCreatedAt] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUser(data.user)
        setCreatedAt(new Date(data.user.created_at).toLocaleDateString())

        supabase.from('authorizations').select('id', { count: 'exact', head: true }).eq('user_id', data.user.id)
          .then(({ count }) => setAppCount(count || 0))
        supabase.from('app_data').select('id', { count: 'exact', head: true }).eq('user_id', data.user.id)
          .then(({ count }) => setStorageCount(count || 0))
        supabase.from('king_devices').select('id', { count: 'exact', head: true }).eq('user_id', data.user.id)
          .then(({ count }) => setDeviceCount(count || 0))
      }
    })
  }, [])

  return (
    <>
      <h2>Account Dashboard</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Account Status</h3>
          <p style={{ color: 'var(--success)', fontSize: '1rem' }}>Active</p>
        </div>
        <div className="stat-card">
          <h3>Authorized Apps</h3>
          <p>{appCount}</p>
        </div>
        <div className="stat-card">
          <h3>Storage Apps</h3>
          <p>{storageCount}</p>
        </div>
        <div className="stat-card">
          <h3>King Devices</h3>
          <p>{deviceCount}</p>
        </div>
        <div className="stat-card">
          <h3>Created</h3>
          <p style={{ fontSize: '1rem' }}>{createdAt}</p>
        </div>
      </div>
      <div className="card">
        <h3 style={{ marginBottom: '0.75rem' }}>Account Info</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          <strong>Email:</strong> {user?.email}
        </p>
      </div>
    </>
  )
}

function PasswordSettings() {
  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })

    if (updateError) {
      setError(updateError.message)
    } else {
      setMessage('Password updated successfully')
      setNewPassword('')
    }
    setLoading(false)
  }

  return (
    <>
      <h2>Change Password</h2>
      <div className="card">
        <form onSubmit={handleSubmit}>
          {message && <div className="alert alert-success">{message}</div>}
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-group">
            <label>New Password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password (min 6 characters)" required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </>
  )
}

function PrivacySettings() {
  const [user, setUser] = useState(null)
  const [profileVisible, setProfileVisible] = useState(true)
  const [message, setMessage] = useState('')
  const [saved, setSaved] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user ?? null))
  }, [])

  const handleSave = async () => {
    const { error } = await supabase.from('user_settings').upsert(
      { user_id: user.id, profile_visible: profileVisible },
      { onConflict: 'user_id' }
    )
    if (!error) {
      setMessage('Privacy settings saved')
      setSaved(true)
    }
  }

  return (
    <>
      <h2>Privacy Settings</h2>
      <div className="card">
        {message && <div className="alert alert-success">{message}</div>}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={profileVisible} onChange={() => { setProfileVisible(!profileVisible); setSaved(false) }} style={{ width: '18px', height: '18px' }} />
            <div>
              <strong>Profile visible to applications</strong>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Allow authorized applications to see your profile information</p>
            </div>
          </label>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saved}>Save Settings</button>
      </div>
    </>
  )
}

function AuthorizedApps() {
  const [user, setUser] = useState(null)
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchApps = async (userId) => {
    const { data: authData } = await supabase
      .from('authorizations')
      .select('*, apps(*)')
      .eq('user_id', userId)
    setApps(authData || [])
    setLoading(false)
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) { setUser(data.user); fetchApps(data.user.id) }
    })
  }, [])

  const handleRevoke = async (authId) => {
    await supabase.from('authorizations').delete().eq('id', authId)
    if (user) fetchApps(user.id)
  }

  if (loading) return <p className="text-muted">Loading...</p>

  return (
    <>
      <h2>Authorized Apps</h2>
      {apps.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>No authorized apps</p>
            <p>Applications you authorize will appear here.</p>
          </div>
        </div>
      ) : (
        <div className="apps-list">
          {apps.map((auth) => (
            <div key={auth.id} className="app-item">
              <div className="app-item-info">
                <div className="app-item-icon">{auth.apps?.name?.charAt(0) || '?'}</div>
                <div>
                  <strong>{auth.apps?.name || 'Unknown App'}</strong>
                  <p className="text-muted" style={{ fontSize: '0.8125rem' }}>Authorized {new Date(auth.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <button className="btn btn-danger" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8125rem' }} onClick={() => handleRevoke(auth.id)}>Revoke</button>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

function CloudStorage() {
  const [user, setUser] = useState(null)
  const [storageItems, setStorageItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data?.user) {
        setUser(data.user)
        const { data: storageData } = await supabase.from('app_data').select('*, apps(name)').eq('user_id', data.user.id)
        setStorageItems(storageData || [])
        setLoading(false)
      }
    })
  }, [])

  if (loading) return <p className="text-muted">Loading...</p>

  return (
    <>
      <h2>Cloud Storage</h2>
      {storageItems.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>No stored data</p>
            <p>Applications using cloud storage will appear here.</p>
          </div>
        </div>
      ) : (
        <div className="apps-list">
          {storageItems.map((item) => (
            <div key={item.id} className="app-item">
              <div className="app-item-info">
                <div>
                  <strong>{item.apps?.name || 'Unknown App'}</strong>
                  <p className="text-muted" style={{ fontSize: '0.8125rem' }}>Stored since {new Date(item.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <button className="btn btn-danger" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8125rem' }}
                onClick={async () => {
                  await supabase.from('app_data').delete().eq('id', item.id)
                  setStorageItems(storageItems.filter((i) => i.id !== item.id))
                }}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

function KingDevices() {
  const [user, setUser] = useState(null)
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchDevices = async (userId) => {
    const { data } = await supabase.from('king_devices').select('*, apps(name)').eq('user_id', userId).order('created_at', { ascending: false })
    setDevices(data || [])
    setLoading(false)
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) { setUser(data.user); fetchDevices(data.user.id) }
    })
  }, [])

  const handleRemove = async (deviceId) => {
    await supabase.from('king_devices').delete().eq('id', deviceId)
    if (user) fetchDevices(user.id)
  }

  if (loading) return <p className="text-muted">Loading...</p>

  return (
    <>
      <h2>King Devices</h2>
      {devices.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>No authorized devices</p>
            <p>Devices that have been authorized through King Account will appear here.</p>
          </div>
        </div>
      ) : (
        <div className="apps-list">
          {devices.map((device) => (
            <div key={device.id} className="app-item">
              <div className="app-item-info">
                <div className="app-item-icon">{device.device_name.charAt(0)}</div>
                <div>
                  <strong>{device.device_name}</strong>
                  <p className="text-muted" style={{ fontSize: '0.8125rem' }}>
                    {device.apps?.name ? `via ${device.apps.name} - ` : ''}Authorized {new Date(device.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button className="btn btn-danger" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8125rem' }} onClick={() => handleRemove(device.id)}>Remove</button>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

function genUniqueId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 24; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function makeCodeSample(app, customFeatures) {
  const ver = '1.0.0'
  const features = customFeatures && customFeatures.length > 0
    ? customFeatures.map(f => `  ${f}`).join(',\n')
    : `  "remote control",\n  "sleep switching",\n  "custom mode",\n  custom("custom feature description")`
  return `#!/bin/sh
# King Device Configuration
# Version: ${ver}

APP_NAME="${app.name}"
CLIENT_ID="${app.id}"
UNIQUE_ID="${app.unique_id || 'ERROR_NO_UNIQUE_ID'}"
AUTH_URL="https://kingyorkson.github.io/King-Account/#/authorize?client_id=${app.id}"
VERSION="${ver}"

# Supabase registration endpoint
API_URL="https://fqmmzwtlnnsisgdawwho.supabase.co/rest/v1/king_devices"
API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxbW16d3Rsbm5zaXNnZGF3d2hvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzMzI3MTgsImV4cCI6MjA5ODkwODcxOH0.2uJCAKovzpYI2J9SQRiD7hq53-O0KE47gzQgq1tA3-8"

# This configuration is cached locally.
# It will NOT update automatically.
# To update: run the update script or re-download from Developer page.

FEATURES=[
${features}
]

# Device registration
echo "Registering device: $(hostname)"
echo "App: $APP_NAME | Version: $VERSION"
echo "Unique ID: $UNIQUE_ID"

curl -s -X POST "$API_URL" \\
  -H "Content-Type: application/json" \\
  -H "apikey: $API_KEY" \\
  -H "Authorization: Bearer $API_KEY" \\
  -d "{
    \\"device_name\\": \\"$(hostname)\\",
    \\"device_identifier\\": \\"$UNIQUE_ID\\",
    \\"app_id\\": \\"$CLIENT_ID\\"
  }"

echo ""
echo "Device registered. Check King Devices on your dashboard."
`
}

function EditAppForm({ app, onSave, onCancel }) {
  const [name, setName] = useState(app.name)
  const [description, setDescription] = useState(app.description || '')
  const [redirectUri, setRedirectUri] = useState(app.redirect_uri)
  const [allowKingDevice, setAllowKingDevice] = useState(app.allow_king_device || false)
  const [uniqueId, setUniqueId] = useState(app.unique_id || '')
  const [featuresText, setFeaturesText] = useState(app.features || '')
  const [saving, setSaving] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)
  const [uniqueIdCopied, setUniqueIdCopied] = useState(false)

  const customFeatures = featuresText
    ? featuresText.split('\n').map(l => l.trim()).filter(Boolean)
    : []

  const handleSave = async () => {
    setSaving(true)
    const { error } = await supabase.from('apps').update({
      name: name.trim(),
      description: description.trim(),
      redirect_uri: redirectUri.trim(),
      allow_king_device: allowKingDevice,
      unique_id: uniqueId || null,
      features: featuresText || null,
    }).eq('id', app.id)

    if (!error) {
      onSave()
    }
    setSaving(false)
  }

  const handleGetUniqueId = () => {
    setUniqueId(genUniqueId())
  }

  const codeSample = makeCodeSample({ ...app, name, unique_id: uniqueId }, customFeatures)

  const handleDownload = () => {
    const blob = new Blob([codeSample], { type: 'application/x-sh' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `king-device-${name.replace(/\s+/g, '-').toLowerCase()}.sh`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="card" style={{ marginTop: '0.75rem', borderLeft: '3px solid var(--primary)' }}>
      <h3 style={{ marginBottom: '1rem' }}>Edit: {app.name}</h3>

      <div className="form-group">
        <label>App Name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="My King App" required />
      </div>
      <div className="form-group">
        <label>Description</label>
        <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does your app do?" />
      </div>
      <div className="form-group">
        <label>Callback URL</label>
        <input type="url" value={redirectUri} onChange={(e) => setRedirectUri(e.target.value)} placeholder="https://myapp.com/callback" required />
      </div>

      <div className="form-group">
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
          <input type="checkbox" checked={allowKingDevice} onChange={(e) => setAllowKingDevice(e.target.checked)} style={{ width: '18px', height: '18px' }} />
          <div>
            <strong>Allow King Device</strong>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Enable device authentication for this application</p>
          </div>
        </label>
      </div>

      {allowKingDevice && (
        <div style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '1rem' }}>
          <h4 style={{ marginBottom: '0.75rem', fontSize: '0.9375rem' }}>King Device Configuration v1.0.0</h4>

          <div className="form-group">
            <label>Custom Features (one per line)</label>
            <textarea
              value={featuresText}
              onChange={(e) => setFeaturesText(e.target.value)}
              placeholder={'\"remote control\"\n\"sleep switching\"\n\"custom mode\"\ncustom(\"custom feature description\")'}
              style={{
                width: '100%', minHeight: '80px', padding: '0.5rem 0.75rem', background: 'var(--bg)',
                border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text)',
                fontSize: '0.8125rem', fontFamily: 'monospace', resize: 'vertical',
              }}
            />
          </div>

          {!uniqueId ? (
            <div className="alert alert-error">
              Error Code 1: No unique ID detected. Click "Get Unique ID" to generate one.
            </div>
          ) : (
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <button className="btn btn-outline" style={{ fontSize: '0.8125rem', padding: '0.5rem 0.75rem' }} onClick={() => { navigator.clipboard.writeText(codeSample); setCodeCopied(true); setTimeout(() => setCodeCopied(false), 2000) }}>
                  {codeCopied ? 'Copied!' : 'Copy Code'}
                </button>
                <button className="btn btn-primary" style={{ fontSize: '0.8125rem', padding: '0.5rem 0.75rem' }} onClick={handleDownload}>
                  Download .sh
                </button>
              </div>
              <pre style={{
                background: '#0a0a14', color: '#a0a0c0', padding: '0.75rem', borderRadius: 'var(--radius)',
                fontSize: '0.7rem', overflowX: 'auto', maxHeight: '200px', lineHeight: '1.4', fontFamily: 'monospace', whiteSpace: 'pre', wordWrap: 'normal'
              }}>
                {codeSample}
              </pre>
            </div>
          )}

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Unique ID:</span>
              <code style={{ fontSize: '0.75rem', color: 'var(--primary)', wordBreak: 'break-all' }}>
                {uniqueId || <span style={{ color: 'var(--danger)' }}>Not set</span>}
              </code>
              {uniqueId && (
                <button className="btn btn-outline" style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem' }} onClick={() => { navigator.clipboard.writeText(uniqueId); setUniqueIdCopied(true); setTimeout(() => setUniqueIdCopied(false), 2000) }}>
                  {uniqueIdCopied ? 'Copied!' : 'Copy'}
                </button>
              )}
              <button className="btn btn-primary" style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem' }} onClick={handleGetUniqueId}>
                Get Unique ID
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button className="btn btn-outline" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}

function Developer() {
  const [user, setUser] = useState(null)
  const [myApps, setMyApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [redirectUri, setRedirectUri] = useState('')
  const [allowKingDevice, setAllowKingDevice] = useState(false)
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [copiedId, setCopiedId] = useState(null)

  const baseAuthUrl = 'https://kingyorkson.github.io/King-Account/#/authorize'

  const fetchMyApps = async (userId) => {
    const { data } = await supabase.from('apps').select('*').eq('creator_id', userId).order('created_at', { ascending: false })
    setMyApps(data || [])
    setLoading(false)
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) { setUser(data.user); fetchMyApps(data.user.id) }
    })
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setFormError('')
    if (!name.trim() || !redirectUri.trim()) {
      setFormError('Name and Callback URL are required')
      return
    }
    setFormLoading(true)
    const { error } = await supabase.from('apps').insert({
      name: name.trim(), description: description.trim(),
      redirect_uri: redirectUri.trim(), creator_id: user.id, allow_king_device: allowKingDevice,
    })
    if (error) {
      setFormError(error.message)
    } else {
      setName(''); setDescription(''); setRedirectUri(''); setAllowKingDevice(false); setShowForm(false)
      fetchMyApps(user.id)
    }
    setFormLoading(false)
  }

  const handleDelete = async (appId) => {
    await supabase.from('apps').delete().eq('id', appId)
    fetchMyApps(user.id)
  }

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (loading) return <p className="text-muted">Loading...</p>

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>Developer</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Create App'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Register a New Application</h3>
          <form onSubmit={handleCreate}>
            {formError && <div className="alert alert-error">{formError}</div>}
            <div className="form-group">
              <label>App Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="My King App" required />
            </div>
            <div className="form-group">
              <label>Description</label>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does your app do?" />
            </div>
            <div className="form-group">
              <label>Callback URL</label>
              <input type="url" value={redirectUri} onChange={(e) => setRedirectUri(e.target.value)} placeholder="https://myapp.com/callback" required />
            </div>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={allowKingDevice} onChange={(e) => setAllowKingDevice(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                <div>
                  <strong>Allow King Device</strong>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Enable device authentication for this application</p>
                </div>
              </label>
            </div>
            <button type="submit" className="btn btn-primary" disabled={formLoading}>
              {formLoading ? 'Creating...' : 'Create App'}
            </button>
          </form>
        </div>
      )}

      {myApps.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>No apps created yet</p>
            <p>Create an app to get started with King Account authorization.</p>
          </div>
        </div>
      ) : (
        <div className="apps-list">
          {myApps.map((app) => {
            const authUrl = `${baseAuthUrl}?client_id=${app.id}&redirect_uri=${encodeURIComponent(app.redirect_uri)}`
            const isEditing = editingId === app.id
            return (
              <div key={app.id} className="card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <h3 style={{ marginBottom: '0.25rem' }}>{app.name}</h3>
                    <p className="text-muted" style={{ fontSize: '0.8125rem' }}>{app.description || 'No description'}</p>
                    {app.allow_king_device && (
                      <span style={{ display: 'inline-block', marginTop: '0.35rem', padding: '0.2rem 0.5rem', background: 'rgba(108,99,255,0.15)', color: 'var(--primary)', borderRadius: '100px', fontSize: '0.7rem' }}>
                        King Device Enabled
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button className="btn btn-outline" style={{ padding: '0.35rem 0.65rem', fontSize: '0.8125rem' }} onClick={() => setEditingId(isEditing ? null : app.id)}>
                      {isEditing ? 'Close' : 'Edit'}
                    </button>
                    <button className="btn btn-danger" style={{ padding: '0.35rem 0.65rem', fontSize: '0.8125rem' }} onClick={() => handleDelete(app.id)}>Delete</button>
                  </div>
                </div>

                <div style={{ fontSize: '0.8125rem', marginBottom: '0.75rem' }}>
                  <div style={{ marginBottom: '0.25rem' }}>
                    <span className="text-muted">Client ID:</span>{' '}
                    <code style={{ color: 'var(--primary)', fontSize: '0.75rem' }}>{app.id}</code>
                  </div>
                  <div style={{ marginBottom: '0.25rem' }}>
                    <span className="text-muted">Callback URL:</span>{' '}
                    <code style={{ fontSize: '0.75rem' }}>{app.redirect_uri}</code>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Authorization URL</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input type="text" value={authUrl} readOnly style={{
                      flex: 1, padding: '0.5rem 0.75rem', background: 'var(--bg-input)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: '0.75rem', fontFamily: 'monospace',
                    }} />
                    <button className="btn btn-primary" style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                      onClick={() => copyToClipboard(authUrl, app.id)}>
                      {copiedId === app.id ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                {isEditing && (
                  <EditAppForm
                    app={app}
                    onSave={() => { setEditingId(null); fetchMyApps(user.id) }}
                    onCancel={() => setEditingId(null)}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

export default function Dashboard() {
  return (
    <div className="dashboard-layout">
      <div className="dashboard-sidebar">
        <NavLink to="/dashboard" end>Overview</NavLink>
        <NavLink to="/dashboard/password">Change Password</NavLink>
        <NavLink to="/dashboard/privacy">Privacy</NavLink>
        <NavLink to="/dashboard/apps">Authorized Apps</NavLink>
        <NavLink to="/dashboard/storage">Cloud Storage</NavLink>
        <NavLink to="/dashboard/devices">King Devices</NavLink>
        <NavLink to="/dashboard/developer">Developer</NavLink>
      </div>

      <div className="dashboard-content">
        <Routes>
          <Route index element={<DashboardHome />} />
          <Route path="password" element={<PasswordSettings />} />
          <Route path="privacy" element={<PrivacySettings />} />
          <Route path="apps" element={<AuthorizedApps />} />
          <Route path="storage" element={<CloudStorage />} />
          <Route path="devices" element={<KingDevices />} />
          <Route path="developer" element={<Developer />} />
        </Routes>
      </div>
    </div>
  )
}
