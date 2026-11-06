import assert from 'node:assert/strict'
import test from 'node:test'
import { createGasQuoteController } from '../src/utils/gas-quote.ts'
const deferred = () => {
  let resolve, reject
  const promise = new Promise((ok, fail) => {
    resolve = ok
    reject = fail
  })
  return { promise, resolve, reject }
}

test('a previous token quote cannot replace the current token result', async () => {
  let state
  const controller = createGasQuoteController((value) => {
    state = value
  })
  const old = deferred(),
    current = deferred()
  const first = controller.fetch(() => old.promise),
    second = controller.fetch(() => current.promise)
  current.resolve(2)
  await second
  assert.equal(state.gasFee, '2.0000')
  old.resolve(9)
  await first
  assert.equal(state.gasFee, '2.0000')
  assert.equal(state.isLoading, false)
})

test('stale failures cannot stop the current loading state or report an old error', async () => {
  let state
  const controller = createGasQuoteController((value) => {
    state = value
  })
  const old = deferred(),
    current = deferred()
  const first = controller.fetch(() => old.promise),
    second = controller.fetch(() => current.promise)
  old.reject(new Error('old chain failed'))
  await first
  assert.equal(state.isLoading, true)
  assert.equal(state.error, null)
  current.resolve(3)
  await second
  assert.equal(state.gasFee, '3.0000')
})

test('disabled requests clear prior values and invalidate pending completions', async () => {
  let state
  const controller = createGasQuoteController((value) => {
    state = value
  })
  await controller.fetch(async () => 1)
  const pending = deferred(),
    request = controller.fetch(() => pending.promise)
  await controller.fetch()
  assert.deepEqual(state, { gasFee: null, isLoading: false, error: null })
  pending.resolve(4)
  await request
  assert.equal(state.gasFee, null)
})

test('cancelled effects ignore results and current failures clear old quotes', async () => {
  const updates = []
  const controller = createGasQuoteController((value) => updates.push(value))
  const pending = deferred(),
    request = controller.fetch(() => pending.promise)
  controller.cancel()
  const count = updates.length
  pending.resolve(4)
  await request
  assert.equal(updates.length, count)
  await controller.fetch(async () => {
    throw new Error('RPC unavailable')
  })
  assert.equal(updates.at(-1).gasFee, null)
  assert.match(updates.at(-1).error.message, /RPC/)
  await controller.fetch(async () => 0)
  assert.equal(updates.at(-1).gasFee, '0.0000')
})
