export interface GasQuoteState {
  gasFee: string | null
  isLoading: boolean
  error: Error | null
}

/** Owns a request generation so an older token/chain quote cannot update the current state. */
export function createGasQuoteController(update: (state: GasQuoteState) => void) {
  let generation = 0
  return {
    async fetch(load?: () => Promise<number>): Promise<void> {
      const request = ++generation
      update({ gasFee: null, isLoading: !!load, error: null })
      if (!load) return
      try {
        const fee = await load()
        if (!Number.isFinite(fee) || fee < 0) throw new Error('Invalid gas fee quote')
        if (request === generation) update({ gasFee: fee.toFixed(4), isLoading: false, error: null })
      } catch (cause) {
        if (request === generation) {
          const error = cause instanceof Error ? cause : new Error(String(cause))
          update({ gasFee: null, isLoading: false, error })
        }
      }
    },
    cancel() {
      generation++
    }
  }
}
