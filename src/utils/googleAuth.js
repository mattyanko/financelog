import { CONFIG } from '../config'

let tokenClient = null
let accessToken = null
let tokenExpiry = null

function loadFromStorage() {
  const stored = localStorage.getItem('fl_token')
  const expiry = parseInt(localStorage.getItem('fl_expiry') || '0')
  if (stored && Date.now() < expiry) {
    accessToken = stored
    tokenExpiry = expiry
  }
}

export function getAccessToken() {
  if (!accessToken || Date.now() >= tokenExpiry) {
    loadFromStorage()
  }
  return accessToken && Date.now() < tokenExpiry ? accessToken : null
}

export function initTokenClient(onSuccess, onError, onReady) {
  // Wait for GIS script to be ready
  const tryInit = () => {
    if (!window.google?.accounts?.oauth2) {
      setTimeout(tryInit, 100)
      return
    }
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CONFIG.CLIENT_ID,
      scope: CONFIG.SCOPES,
      callback: async (response) => {
        if (response.error) {
          onError?.(response.error)
          return
        }
        accessToken = response.access_token
        tokenExpiry = Date.now() + response.expires_in * 1000
        localStorage.setItem('fl_token', accessToken)
        localStorage.setItem('fl_expiry', tokenExpiry)

        // Verify the email is allowed
        try {
          const info = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` },
          }).then(r => r.json())

          if (!CONFIG.ALLOWED_EMAILS.includes(info.email)) {
            signOut()
            onError?.('This Google account is not authorized to use this app.')
            return
          }
          onSuccess?.(info.email)
        } catch {
          onError?.('Failed to verify account.')
        }
      },
    })
    onReady?.()
  }
  tryInit()
}

export function requestSignIn(prompt = '') {
  if (!tokenClient) return
  tokenClient.requestAccessToken({ prompt })
}

export function signOut() {
  if (accessToken) {
    window.google?.accounts?.oauth2?.revoke(accessToken)
  }
  accessToken = null
  tokenExpiry = null
  localStorage.removeItem('fl_token')
  localStorage.removeItem('fl_expiry')
}

// Wraps fetch calls — dispatches 'auth:expired' on 401
export async function apiFetch(url, options = {}) {
  const token = getAccessToken()
  if (!token) {
    window.dispatchEvent(new CustomEvent('auth:expired'))
    throw new Error('Not authenticated')
  }
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })
  if (res.status === 401) {
    window.dispatchEvent(new CustomEvent('auth:expired'))
    throw new Error('Session expired. Please sign in again.')
  }
  return res
}
