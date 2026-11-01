import { decodeEventLog, type Abi, type Address, type TransactionReceipt } from 'viem'

/** A successful transaction alone does not establish a DID registration. */
export function registeredDidFromReceipt(
  receipt: Pick<TransactionReceipt, 'status' | 'logs'>,
  abi: Abi,
  registryAddress: Address,
  owner: Address
): bigint {
  if (receipt.status !== 'success') throw new Error('DID registration transaction reverted')
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== registryAddress.toLowerCase()) continue
    try {
      const decoded = decodeEventLog({ abi, data: log.data, topics: log.topics })
      if (decoded.eventName !== 'DIDRegistered') continue
      const args = decoded.args as { identifier?: bigint; owner?: string }
      if (typeof args.identifier === 'bigint' && args.owner?.toLowerCase() === owner.toLowerCase()) {
        return args.identifier
      }
    } catch {
      // Other registry events are not evidence of registration.
    }
  }
  throw new Error('DIDRegistered event for this owner was not found in the transaction receipt')
}
