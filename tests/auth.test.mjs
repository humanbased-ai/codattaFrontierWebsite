import assert from 'node:assert/strict'
import test from 'node:test'
import { authRedirect, clearClientAuthentication, getAuthToken } from '../src/utils/auth.ts'

function fixture(cookieValue) {
  const originals = new Map(
    ['window', 'document', 'localStorage', 'sessionStorage'].map((key) => [
      key,
      Object.getOwnPropertyDescriptor(globalThis, key)
    ])
  )
  const local = new Map([
    ['auth', 'stored-token'],
    ['token', 'legacy'],
    ['uid', '1'],
    ['theme', 'dark']
  ])
  const session = new Map()
  const writes = []
  let cookie = cookieValue
  const storage = (values) => ({
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key)
  })
  Object.defineProperties(globalThis, {
    window: { configurable: true, value: { location: { href: 'https://app.codatta.io/app/tasks?tab=mine' } } },
    document: {
      configurable: true,
      value: {
        get cookie() {
          return 'auth=' + cookie
        },
        // A host-only expiry cannot delete the existing shared-domain cookie.
        set cookie(value) {
          writes.push(value)
        }
      }
    },
    localStorage: { configurable: true, value: storage(local) },
    sessionStorage: { configurable: true, value: storage(session) }
  })
  return {
    local,
    session,
    writes,
    replaceCookie: (value) => {
      cookie = value
    },
    restore() {
      for (const [key, descriptor] of originals) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor)
        else delete globalThis[key]
      }
    }
  }
}

test('building a sign-in URL has no authentication side effects', () => {
  const f = fixture('redirect-cookie')
  try {
    assert.equal(authRedirect(), '/account/signin?from=%2Fapp%2Ftasks%3Ftab%3Dmine')
    assert.equal(getAuthToken(), 'redirect-cookie')
    assert.equal(f.local.size, 4)
    assert.equal(f.session.size, 0)
    assert.deepEqual(f.writes, [])
  } finally {
    f.restore()
  }
})

test('client cleanup suppresses an undeletable cookie across reload without deleting parent-domain cookies', async () => {
  const f = fixture('rejected-cookie')
  try {
    clearClientAuthentication()
    assert.equal(getAuthToken(), undefined)
    assert.deepEqual([...f.local], [['theme', 'dark']])
    assert.equal(f.writes.length, 1)
    assert.ok(f.writes[0].startsWith('auth=; path=/'))
    assert.match(f.writes[0], /expires=/i)
    assert.doesNotMatch(f.writes[0], /domain=/i)
    assert.equal(f.session.size, 1)
    assert.ok([...f.session.values()].every((value) => value !== 'rejected-cookie' && /^[a-f0-9]{64}$/.test(value)))
    const reloaded = await import('../src/utils/auth.ts?reload-test')
    assert.equal(reloaded.getAuthToken(), undefined)
    f.replaceCookie('new-login-cookie')
    assert.equal(reloaded.getAuthToken(), 'new-login-cookie')
  } finally {
    f.restore()
  }
})
