import cookies from 'js-cookie'
import CryptoJS from 'crypto-js'

const rejectedCookieKey = 'codatta:rejected-auth-cookie'
let rejectedCookieFingerprint: string | null = null

function fingerprint(token: string) {
  return CryptoJS.SHA256(token).toString()
}

/** Resolve credentials without reusing a cookie rejected by this app/tab. */
export function getAuthToken() {
  const cookie = cookies.get('auth')
  if (cookie) {
    let rejected = rejectedCookieFingerprint
    try {
      rejected = sessionStorage.getItem(rejectedCookieKey) ?? rejected
    } catch {
      /* Storage may be unavailable. */
    }
    if (fingerprint(cookie) !== rejected) return cookie
  }
  return localStorage.getItem('auth') || undefined
}

/** Clear this app's client credentials; this does not revoke a server session. */
export function clearClientAuthentication() {
  const cookie = cookies.get('auth')
  if (cookie) {
    rejectedCookieFingerprint = fingerprint(cookie)
    try {
      sessionStorage.setItem(rejectedCookieKey, rejectedCookieFingerprint)
    } catch {
      /* Keep the in-memory rejection. */
    }
  }
  localStorage.removeItem('token')
  localStorage.removeItem('uid')
  localStorage.removeItem('auth')
  // Only delete the host-scoped root cookie. Shared-domain cookies are left
  // intact and suppressed locally instead of logging other applications out.
  cookies.remove('auth', { path: '/' })
}

/** Build a return URL without changing authentication during React rendering. */
export function authRedirect() {
  const url = new URL(window.location.href)
  const from = url.pathname + url.search
  return `/account/signin?from=${encodeURIComponent(from)}`
}
