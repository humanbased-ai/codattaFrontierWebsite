// Run with Node 22.18+ / 24: node --experimental-strip-types --test tests/auth.test.mjs
import assert from 'node:assert/strict'
import test from 'node:test'
import cookies from 'js-cookie'
import { authRedirect, clearAuthentication } from '../src/utils/auth.ts'

test('logout clears storage and visible root/ancestor-domain cookies', () => {
  const values = new Map([
    ['auth', 'stored-token'],
    ['token', 'legacy'],
    ['uid', '1'],
    ['theme', 'dark']
  ])
  const originalRemove = cookies.remove
  const expired = []
  globalThis.localStorage = { removeItem: (key) => values.delete(key) }
  globalThis.window = { location: { href: 'https://app.codatta.io/app/tasks?tab=mine' } }
  cookies.remove = (name, attributes) => expired.push({ name, ...attributes })
  try {
    const redirect = authRedirect()
    assert.equal(redirect, '/account/signin?from=%2Fapp%2Ftasks%3Ftab%3Dmine')
    assert.deepEqual([...values], [['theme', 'dark']])
    assert.ok(expired.some((c) => c.name === 'auth' && c.path === '/' && c.domain === undefined))
    assert.ok(expired.some((c) => c.path === '/' && c.domain === 'codatta.io'))
    assert.ok(expired.some((c) => c.path === '/app/' && c.domain === 'app.codatta.io'))
    assert.ok(expired.every((c) => c.name === 'auth'))
  } finally {
    cookies.remove = originalRemove
  }
})

test('cookie-only authentication is expired, including on localhost', () => {
  const originalRemove = cookies.remove
  let auth = 'expired-test-cookie'
  const attempts = []
  globalThis.localStorage = { removeItem() {} }
  globalThis.window = { location: { href: 'http://localhost:5173/account/signin' } }
  cookies.remove = (name, attributes) => {
    attempts.push(attributes)
    if (name === 'auth' && attributes.path === '/' && !attributes.domain) auth = undefined
  }
  try {
    clearAuthentication()
    clearAuthentication()
    assert.equal(auth, undefined)
    assert.ok(attempts.every((a) => !a.domain || a.domain === 'localhost'))
  } finally {
    cookies.remove = originalRemove
  }
})
