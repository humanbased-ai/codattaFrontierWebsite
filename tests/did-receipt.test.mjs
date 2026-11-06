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
const read = (receipt) => registeredDidFromReceipt(receipt, abi, registry)

test('reverted, missing, malformed and unrelated events cannot establish a DID', () => {
  assert.throws(() => read({ status: 'reverted', logs: [log()] }), /reverted/)
  for (const logs of [[], [log(other)], [{ ...log(), data: '0x' }], [log(), log()]]) {
    assert.throws(() => read({ status: 'success', logs }), /unique/)
  }
})

test('one valid registry event returns its bigint without assuming the owner is the sender', () => {
  assert.equal(read({ status: 'success', logs: [{ ...log(), data: '0x' }, log(registry, other)] }), 16n)
})
