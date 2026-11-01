/**
 * Authentication utilities
 */
import cookies from 'js-cookie'

/** Expire readable auth cookies at paths and parent domains visible to this page. */
export function clearAuthentication() {
  localStorage.removeItem('token')
  localStorage.removeItem('uid')
  localStorage.removeItem('auth')

  const url = new URL(window.location.href)
  const paths = new Set(['/'])
  let current = ''
  for (const part of url.pathname.split('/').filter(Boolean)) {
    current += `/${part}`
    paths.add(current)
    paths.add(`${current}/`)
  }
  const domains: (string | undefined)[] = [undefined, url.hostname]
  const labels = url.hostname.split('.')
  // A domain cookie may have been set by a parent application domain.
  for (let i = 1; i < labels.length - 1; i++) domains.push(labels.slice(i).join('.'))
  for (const path of paths) {
    for (const domain of domains) {
      cookies.remove('auth', { path, ...(domain ? { domain } : {}) })
    }
  }
}

export function authRedirect() {
  clearAuthentication()
  const url = new URL(window.location.href)
  const from = url.pathname + url.search
  const redirect = `/account/signin?from=${encodeURIComponent(from)}`
  return redirect
}
