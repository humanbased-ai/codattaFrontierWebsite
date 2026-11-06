import { useCallback, useEffect, useMemo, useState } from 'react'
import { calculateGasFeeFromApi, getChainKeyByChainId } from '@/utils/gas-calculator'
import { createGasQuoteController, type GasQuoteState } from '@/utils/gas-quote'

interface UseGasFeeOptions {
  gasLimit: number
  chainId?: number
  enabled?: boolean
  tokenAddress: string
}

interface UseGasFeeResult extends GasQuoteState {
  refetch: () => Promise<void>
}

/** Quotes belong to one token/chain request; late results are discarded. */
export function useGasFee({ gasLimit, chainId, enabled = true, tokenAddress }: UseGasFeeOptions): UseGasFeeResult {
  const [state, setState] = useState<GasQuoteState>({ gasFee: null, isLoading: false, error: null })
  const controller = useMemo(() => createGasQuoteController(setState), [])

  const fetchGasFee = useCallback(
    () =>
      controller.fetch(
        enabled && chainId && tokenAddress
          ? () => calculateGasFeeFromApi(gasLimit, getChainKeyByChainId(chainId), tokenAddress)
          : undefined
      ),
    [controller, enabled, chainId, gasLimit, tokenAddress]
  )

  useEffect(() => {
    void fetchGasFee()
    return () => controller.cancel()
  }, [controller, fetchGasFee])

  return { ...state, refetch: fetchGasFee }
}
