// Run with Node 22.18+ / 24: node --experimental-strip-types --test tests/gas-estimation.test.mjs
import assert from 'node:assert/strict'
import test from 'node:test'
import { calculateGasEstimation } from '../src/utils/gas-estimation.ts'

const estimate = (rpcClient) => calculateGasEstimation({ rpcClient, account: '0x1', to: '0x2', data: '0x' })

test('a zero priority fee retains the EIP-1559 maximum fee budget', async () => {
  const result = await estimate({
    estimateGas: async () => 21000n,
    estimateFeesPerGas: async () => ({ maxFeePerGas: 100n, maxPriorityFeePerGas: 0n }),
    getGasPrice: async () => {
      throw new Error('legacy pricing should not be requested')
    }
  })
  assert.equal(result.totalCost, 2100000n)
})

test('legacy zero gas price is retained without an extra RPC call', async () => {
  const result = await estimate({
    estimateGas: async () => 21000n,
    estimateFeesPerGas: async () => ({ gasPrice: 0n }),
    getGasPrice: async () => {
      throw new Error('cached zero price was discarded')
    }
  })
  assert.equal(result.totalCost, 0n)
})

test('fee discovery failure falls back to legacy pricing and RPC errors propagate', async () => {
  const rpc = {
    estimateGas: async () => 21000n,
    estimateFeesPerGas: async () => {
      throw new Error('unsupported')
    },
    getGasPrice: async () => 7n
  }
  assert.equal((await estimate(rpc)).totalCost, 147000n)
  await assert.rejects(
    estimate({
      ...rpc,
      getGasPrice: async () => {
        throw new Error('offline')
      }
    }),
    /offline/
  )
})
