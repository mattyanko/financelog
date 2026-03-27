import { useState, useEffect } from 'react'
import { initTokenClient, requestSignIn, signOut, getAccessToken } from './utils/googleAuth'
import { initializeSheet } from './utils/googleSheets'
import Auth from './components/Auth'
import AddExpense from './components/AddExpense'
import ExpenseTable from './components/ExpenseTable'
import Summary from './components/Summary'

const TABS = [
  {
    id: 'add',
    label: 'Add',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
      </svg>
    ),
  },
  {
    id: 'expenses',
    label: 'Expenses',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <rect x="3" y="4" width="18" height="16" rx="2"/><line x1="7" y1="9" x2="17" y2="9"/><line x1="7" y1="13" x2="13" y2="13"/>
      </svg>
    ),
  },
  {
    id: 'summary',
    label: 'Summary',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
  },
]

export default function App() {
  const [authed, setAuthed]         = useState(false)
  const [userEmail, setUserEmail]   = useState('')
  const [activeTab, setActiveTab]   = useState('add')
  const [refreshKey, setRefreshKey] = useState(0)
  const [authError, setAuthError]   = useState(null)

  const handleSignedIn = async (email) => {
    setUserEmail(email)
    setAuthed(true)
    setAuthError(null)
    try { await initializeSheet() } catch { /* sheet may already have headers */ }
  }

  useEffect(() => {
    // Initialize token client
    initTokenClient(handleSignedIn, (err) => setAuthError(err), () => requestSignIn(''))

    // Try silent re-auth once client is ready — no popup if Google session is active

    // Listen for token expiry mid-session
    const onExpired = () => { setAuthed(false); setUserEmail('') }
    window.addEventListener('auth:expired', onExpired)
    return () => window.removeEventListener('auth:expired', onExpired)
  }, [])

  const handleSignOut = () => {
    signOut()
    setAuthed(false)
    setUserEmail('')
  }

  if (!authed) return <Auth onSignIn={handleSignedIn} authError={authError} />

  return (
    <div className="app">
      <header className="header">
        <h1>Finance Log</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="header-user">{userEmail}</span>
          <button className="sign-out-btn" onClick={handleSignOut}>Sign out</button>
        </div>
      </header>

      <main className="content">
        {activeTab === 'add' && (
          <AddExpense onExpenseAdded={() => setRefreshKey(k => k + 1)} />
        )}
        {activeTab === 'expenses' && (
          <ExpenseTable refreshKey={refreshKey} />
        )}
        {activeTab === 'summary' && (
          <Summary refreshKey={refreshKey} />
        )}
      </main>

      <nav className="tab-bar">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
