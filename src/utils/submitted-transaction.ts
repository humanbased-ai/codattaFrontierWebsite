type TransactionHash = `0x${string}`

/** Retains a submitted hash for retries during one mounted registration flow. */
export function createSubmittedTransaction() {
  let hash: TransactionHash | undefined
  let pending: Promise<void> | undefined
  return {
    get hash() {
      return hash
    },
    run(
      send: () => Promise<TransactionHash>,
      confirm: (hash: TransactionHash) => Promise<void>,
      onSubmitted: (hash: TransactionHash) => void
    ): Promise<void> {
      if (pending) return pending
      pending = Promise.resolve()
        .then(async () => {
          if (!hash) {
            hash = await send()
            onSubmitted(hash)
          }
          await confirm(hash)
        })
        .finally(() => {
          pending = undefined
        })
      return pending
    }
  }
}
