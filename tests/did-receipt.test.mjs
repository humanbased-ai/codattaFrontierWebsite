// Run with Node 22.18+ / 24: node --experimental-strip-types --test tests/did-receipt.test.mjs
import assert from 'node:assert/strict'
import test from 'node:test'
import { encodeAbiParameters, keccak256, stringToHex, parseAbi } from 'viem'
import { registeredDidFromReceipt } from '../src/utils/did-receipt.ts'

const abi = parseAbi(['event DIDRegistered(uint128 identifier, address owner)'])
const registry = '0x1111111111111111111111111111111111111111'
const owner = '0x2222222222222222222222222222222222222222'
const other = '0x3333333333333333333333333333333333333333'
const log = (address = registry, account = owner) => ({
  address,
  data: encodeAbiParameters([{ type: 'uint128' }, { type: 'address' }], [16n, account]),
  topics: [keccak256(stringToHex('DIDRegistered(uint128,address)'))]
})
const read = (receipt) => registeredDidFromReceipt(receipt, abi, registry, owner)

test('reverted, missing and unrelated events cannot keep confirmation pending or establish a DID', () => {
  assert.throws(() => read({ status: 'reverted', logs: [log()] }), /reverted/)
  assert.throws(() => read({ status: 'success', logs: [] }), /not found/)
  assert.throws(() => read({ status: 'success', logs: [log(other)] }), /not found/)
  assert.throws(() => read({ status: 'success', logs: [log(registry, other)] }), /not found/)
})

test('a matching registry and owner returns the original bigint identifier', () => {
  assert.equal(read({ status: 'success', logs: [{ ...log(), data: '0x' }, log()] }), 16n)
})
