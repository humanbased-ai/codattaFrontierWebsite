import { formatEther, type PublicClient } from 'viem'

/**
 * Calculate gas estimation with proper fee data handling
 * Supports both EIP-1559 and legacy transactions
 */
export async function calculateGasEstimation({
  rpcClient,
  account,
  to,
  data,
  value
}: {
  rpcClient: PublicClient
  account: `0x${string}`
  to: `0x${string}`
  data: `0x${string}`
  value?: bigint
}): Promise<{ gasLimit: bigint; totalCost: bigint; totalCostFormatted: string }> {
  // Estimate gas limit
  const estimatedGasLimit = await rpcClient.estimateGas({
    account,
    to,
    data,
    value
  })

  // Get fee data for EIP-1559 support detection
  let totalGasCost: bigint
  try {
    const feeData = await rpcClient.estimateFeesPerGas()

    // Calculate total gas cost based on EIP-1559 support
    if (feeData.maxFeePerGas != null && feeData.maxPriorityFeePerGas != null) {
      // EIP-1559 transaction (e.g., Base mainnet)
      totalGasCost = estimatedGasLimit * feeData.maxFeePerGas
      console.log('Using EIP-1559 pricing', { maxFeePerGas: feeData.maxFeePerGas })
    } else {
      const gasPrice = feeData.gasPrice ?? (await rpcClient.getGasPrice())
      // Legacy transaction (e.g., Kite testnet, BSC)
      totalGasCost = estimatedGasLimit * gasPrice
      console.log('Using legacy pricing', { gasPrice })
    }
  } catch (feeError) {
    console.warn('Failed to get fee data, using fallback', feeError)
    // Fallback: try to get gas price directly for networks like Kite
    const gasPrice = await rpcClient.getGasPrice()
    totalGasCost = estimatedGasLimit * gasPrice
    console.log('Using fallback gas price', { gasPrice })
  }

  const totalCostFormatted = formatEther(totalGasCost)

  return {
    gasLimit: estimatedGasLimit,
    totalCost: totalGasCost,
    totalCostFormatted
  }
}
