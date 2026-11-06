import { decodeEventLog, type Abi, type Address, type TransactionReceipt } from 'viem'

/** A successful transaction alone does not establish a unique DID registration. */
export function registeredDidFromReceipt(
  receipt: Pick<TransactionReceipt, 'status' | 'logs'>,
  abi: Abi,
  registryAddress: Address
): bigint {
  if (receipt.status !== 'success') throw new Error('DID registration transaction reverted')
  const identifiers: bigint[] = []
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== registryAddress.toLowerCase()) continue
    try {
      const decoded = decodeEventLog({ abi, data: log.data, topics: log.topics })
      if (decoded.eventName !== 'DIDRegistered') continue
      const args = decoded.args as { identifier?: bigint }
      if (typeof args.identifier === 'bigint') identifiers.push(args.identifier)
    } catch {
      // Other or malformed registry events are not evidence of registration.
    }
  }
  if (identifiers.length !== 1) {
    throw new Error('Could not identify a unique DIDRegistered event; check the existing transaction')
  }
  return identifiers[0]
}
