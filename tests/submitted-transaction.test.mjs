import assert from 'node:assert/strict'
import test from 'node:test'
import { createSubmittedTransaction } from '../src/utils/submitted-transaction.ts'
const hash = '0x1234'

test('confirmation failures retry the existing hash without another wallet submission', async () => {
  const transaction = createSubmittedTransaction()
  let sends = 0,
    confirmations = 0,
    submitted = []
  const send = async () => {
    sends++
    return hash
  }
  const confirm = async (value) => {
    assert.equal(value, hash)
    confirmations++
    if (confirmations === 1) throw new Error('receipt timeout')
  }
  await assert.rejects(
    transaction.run(send, confirm, (value) => submitted.push(value)),
    /timeout/
  )
  assert.equal(transaction.hash, hash)
  await transaction.run(send, confirm, (value) => submitted.push(value))
  assert.equal(sends, 1)
  assert.equal(confirmations, 2)
  assert.deepEqual(submitted, [hash])
})

test('overlapping attempts share one pending submission and confirmation', async () => {
  const transaction = createSubmittedTransaction()
  let finish,
    sends = 0,
    confirmations = 0
  const wait = new Promise((resolve) => {
    finish = resolve
  })
  const send = async () => {
    sends++
    await wait
    return hash
  }
  const confirm = async () => {
    confirmations++
  }
  const one = transaction.run(send, confirm, () => {})
  const two = transaction.run(send, confirm, () => {})
  assert.equal(one, two)
  finish()
  await Promise.all([one, two])
  assert.equal(sends, 1)
  assert.equal(confirmations, 1)
})

test('a rejected wallet request without a hash may be retried', async () => {
  const transaction = createSubmittedTransaction()
  await assert.rejects(
    transaction.run(
      async () => {
        throw new Error('rejected')
      },
      async () => {},
      () => {}
    )
  )
  assert.equal(transaction.hash, undefined)
  await transaction.run(
    async () => hash,
    async () => {},
    () => {}
  )
  assert.equal(transaction.hash, hash)
})
