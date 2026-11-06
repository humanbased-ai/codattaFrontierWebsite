import { useState, useEffect, useCallback } from 'react'
import { Abi, Chain, encodeFunctionData, formatEther, PublicClient, createPublicClient, http } from 'viem'

import { calculateGasEstimation } from '@/utils/gas-estimation'

export { calculateGasEstimation } from '@/utils/gas-estimation'

// Helper to get RPC client
const getRpcClient = (chain: Chain) => {
  const rpcUrl = chain.rpcUrls.default.http[0]
  return createPublicClient({
    chain,
    transport: http(rpcUrl)
  })
}

export function useGasEstimation({
  address,
  rpcClient: providedRpcClient,
  contract,
  functionName,
  contractArgs
}: {
  address: `0x${string}`
  rpcClient?: PublicClient
  contract: { abi: Abi; chain: Chain; address: string }
  functionName: string
  contractArgs: (string | bigint | number)[] | (string | bigint | number)[][]
}) {
  const [loading, setLoading] = useState(true)
  const [balance, setBalance] = useState<string>('0')
  const [estimateGas, setEstimateGas] = useState<string>('')
  const [gasLimit, setGasLimit] = useState<string>('0')
  const [gasWarning, setGasWarning] = useState('')
  const [gasChecked, setGasChecked] = useState(false)

  const checkGas = useCallback(async () => {
    const client = providedRpcClient || getRpcClient(contract.chain)

    const getBalance = async (address: `0x${string}`) => {
      if (!address) return
      const balance = await client.getBalance({
        address
      })
      const balanceStr = formatEther(balance)

      setBalance(balanceStr)
      return balanceStr
    }

    const getEstimateGas = async (address: `0x${string}`) => {
      if (!address || contractArgs?.length === 0) return

      try {
        const data = encodeFunctionData({
          abi: contract.abi,
          functionName,
          args: contractArgs
        }) as `0x${string}`

        const result = await calculateGasEstimation({
          rpcClient: client,
          account: address,
          to: contract.address as `0x${string}`,
          data
        })

        setGasLimit(result.gasLimit.toString())
        setEstimateGas(result.totalCostFormatted)

        return result.totalCostFormatted
      } catch (error) {
        console.error('Gas estimation failed:', error)
        setEstimateGas('')
        setGasLimit('0')
        return ''
      }
    }

    try {
      if (!address) return

      setLoading(true)
      setGasWarning('')
      setGasChecked(false)
      const balance = await getBalance(address)
      let estimatedVal = ''

      if (contractArgs && contractArgs.length > 0) {
        estimatedVal = (await getEstimateGas(address)) || ''
      } else {
        setEstimateGas('')
        setGasLimit('0')
      }

      if (balance && estimatedVal) {
        if (Number(balance) < Number(estimatedVal)) {
          setGasWarning('Balance insufficient to cover gas. Please top up and try again.')
        } else {
          setGasChecked(true)
        }
      }
    } catch (error) {
      console.error(error)
      setGasWarning('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [address, providedRpcClient, contract, functionName, contractArgs])

  useEffect(() => {
    checkGas()
  }, [checkGas])

  return {
    loading,
    balance,
    estimateGas,
    gasLimit,
    gasWarning,
    gasChecked,
    refetch: checkGas
  }
}
