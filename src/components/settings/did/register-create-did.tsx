import { Button, message, Spin } from 'antd'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getAddress, PublicClient } from 'viem'
import { ExternalLink } from 'lucide-react'
import { useCodattaConnectContext } from 'codatta-connect'

import CheckboxIcon from '@/assets/common/checkbox-circle-line.svg?react'
import DoubleCheckIcon from '@/assets/userinfo/check-double-fill-icon.svg?react'
import WaitingIcon from '@/assets/userinfo/loader-line-icon-2.svg?react'
import PendingIcon from '@/assets/userinfo/loader-line-icon.svg?react'
import FailIcon from '@/assets/userinfo/close-line-icon.svg?react'

import { shortenAddress } from '@/utils/format'
import contract from '@/contracts/did-base-registrar.abi'
import registryContract from '@/contracts/did-base-registry.abi'
import { registeredDidFromReceipt } from '@/utils/did-receipt'
import { createSubmittedTransaction } from '@/utils/submitted-transaction'
import accountApi from '@/apis/account.api'
import { useUserStore } from '@/stores/user.store'

// ============================================================================
// Types & Enums
// ============================================================================

/** Step status enum for DID creation and binding process */
enum StepStatus {
  IDLE = 'idle', // Not started
  SIGNING = 'signing', // Wallet signing in progress
  SIGN_FAILED = 'sign_failed', // Signature failed
  CONFIRMING = 'confirming', // On-chain confirmation in progress
  CONFIRM_FAILED = 'confirm_failed', // Confirmation failed
  SUCCESS = 'success' // Completed successfully
}

/** Component props for CreateDid */
interface CreateDidProps {
  rpcClient: PublicClient
  contractArgs: string[][]
  estimateGas: string
  did?: string
  onNext: () => void
  onBack: () => void
}

// ============================================================================
// Utility Functions
// ============================================================================

/** Create signature message for DID binding */
const createSignatureMessage = (didIdentifier: string, userId: string | undefined, challenge: string): string => {
  const did = `did:codatta:${didIdentifier}`
  return `Bind DID to Codatta user\nDID: ${did}\nUser ID: ${userId}\nChallenge: ${challenge}`
}

// ============================================================================
// Main Component
// ============================================================================

export default function CreatDid({ rpcClient, contractArgs, estimateGas, did, onNext, onBack }: CreateDidProps) {
  // ============================================================================
  // State Management
  // ============================================================================
  const [loading, setLoading] = useState(false)
  const [didIdentifier, setDidIdentifier] = useState<string>()
  const [txHash, setTxHash] = useState<string>('')
  const transaction = useRef(createSubmittedTransaction())
  const transactionPending = useRef(false)
  const [step1Status, setStep1Status] = useState<StepStatus>(StepStatus.IDLE)
  const [step2Status, setStep2Status] = useState<StepStatus>(StepStatus.IDLE)
  // ============================================================================
  // Computed Values (based on PRD)
  // ============================================================================

  /** Step 1: On-chain transaction status text */
  const step1StatusText = useMemo(() => {
    switch (step1Status) {
      case StepStatus.IDLE:
        return 'Confirm the transaction in your wallet...'
      case StepStatus.SIGNING:
        return 'Confirm the transaction in your wallet...'
      case StepStatus.SIGN_FAILED:
        return 'Signature was canceled or failed. Please try again.'
      case StepStatus.CONFIRMING:
        return 'Transaction submitted. Waiting for on-chain confirmation...'
      case StepStatus.CONFIRM_FAILED:
        return 'Registration could not be confirmed. Retry checks the existing transaction.'
      case StepStatus.SUCCESS:
        return 'DID created successfully'
      default:
        return ''
    }
  }, [step1Status])

  /** Step 2: Account binding status text */
  const step2StatusText = useMemo(() => {
    switch (step2Status) {
      case StepStatus.IDLE:
        return 'Approve the binding authorization in your wallet...'
      case StepStatus.SIGNING:
        return 'Approve the binding authorization in your wallet...'
      case StepStatus.SIGN_FAILED:
        return 'Binding authorization was canceled or failed. Please retry.'
      case StepStatus.CONFIRMING:
        return 'Binding submitted. Waiting for verification...'
      case StepStatus.CONFIRM_FAILED:
        return 'Account binding failed or timed out. Please try again.'
      case StepStatus.SUCCESS:
        return 'Binding completed'
      default:
        return ''
    }
  }, [step2Status])

  const tip = useMemo(() => {
    if (step1Status === StepStatus.SUCCESS) {
      return step2StatusText
    }
    return step1StatusText
  }, [step1StatusText, step2StatusText, step1Status])
  /** Main button text based on current step status */
  const buttonText = useMemo(() => {
    // Step 2 in progress or completed
    if (step1Status === StepStatus.SUCCESS) {
      switch (step2Status) {
        case StepStatus.IDLE:
          return 'Preparing to bind...'
        case StepStatus.SIGNING:
          return 'Authorizing...'
        case StepStatus.SIGN_FAILED:
          return 'Retry Binding'
        case StepStatus.CONFIRMING:
          return 'Verifying...'
        case StepStatus.CONFIRM_FAILED:
          return 'Retry Binding'
        case StepStatus.SUCCESS:
          return 'Done'
        default:
          return 'Preparing to bind...'
      }
    }

    // Step 1 in progress
    switch (step1Status) {
      case StepStatus.IDLE:
        return 'Confirm & Create'
      case StepStatus.SIGNING:
        return 'Signing...'
      case StepStatus.SIGN_FAILED:
        return 'Retry Creation'
      case StepStatus.CONFIRMING:
        return 'Confirming on-chain...'
      case StepStatus.CONFIRM_FAILED:
        return 'Check Transaction'
      default:
        return 'Confirm & Create'
    }
  }, [step1Status, step2Status])

  const { lastUsedWallet } = useCodattaConnectContext()
  const { info } = useUserStore()

  const address = useMemo(() => {
    if (!lastUsedWallet) return ''
    return getAddress(lastUsedWallet.address!)
  }, [lastUsedWallet])

  const didShow = useMemo(() => {
    if (!didIdentifier) return ''
    return `did:codatta:0x${didIdentifier}`
  }, [didIdentifier])

  // ============================================================================
  // Business Logic - Step 1: Create DID On-chain
  // ============================================================================
  const confirmDid = useCallback(
    async (hash: `0x${string}`) => {
      setStep1Status(StepStatus.CONFIRMING)
      try {
        const receipt = await rpcClient.waitForTransactionReceipt({ hash })
        const identifier = registeredDidFromReceipt(
          receipt,
          registryContract.abi,
          registryContract.address as `0x${string}`
        )
        setDidIdentifier(identifier.toString())
        setStep1Status(StepStatus.SUCCESS)
      } catch (error) {
        console.error(error)
        message.error(error.details || error.message)
        setStep1Status(StepStatus.CONFIRM_FAILED)
      }
    },
    [rpcClient]
  )

  const createDid = useCallback(async () => {
    if (transactionPending.current) return
    if (!transaction.current.hash && (!address || !lastUsedWallet?.client)) return
    transactionPending.current = true
    setLoading(true)
    try {
      await transaction.current.run(
        async () => {
          setStep1Status(StepStatus.SIGNING)
          const { request } = await rpcClient.simulateContract({
            account: address as `0x${string}`,
            address: contract.address as `0x${string}`,
            abi: contract.abi,
            functionName: 'registerWithAuthorization',
            args: contractArgs,
            chain: contract.chain
          })
          const hash = await lastUsedWallet?.client?.writeContract(request)
          if (!hash) throw new Error('Transaction failed')
          return hash
        },
        confirmDid,
        setTxHash
      )
    } catch (error) {
      console.error(error)
      message.error(error.details || error.message)
      setStep1Status(transaction.current.hash ? StepStatus.CONFIRM_FAILED : StepStatus.SIGN_FAILED)
    } finally {
      transactionPending.current = false
      setLoading(false)
    }
  }, [address, contractArgs, lastUsedWallet?.client, rpcClient, confirmDid])

  // ============================================================================
  // Business Logic - Step 2: Bind DID to Account
  // ============================================================================
  const bindDid = useCallback(async () => {
    if (!address) return
    if (!didIdentifier) return
    if (!lastUsedWallet?.client) return

    setLoading(true)
    setStep2Status(StepStatus.SIGNING)

    try {
      // Get challenge from backend
      const {
        data: { challenge }
      } = await accountApi.getDidChallenge()

      const signatureMsg = createSignatureMessage(didIdentifier, info?.user_data?.user_id, challenge)
      console.log('signatureMsg', signatureMsg)

      // Request wallet signature
      const signature = await lastUsedWallet?.client.signMessage({
        account: address,
        message: signatureMsg
      })

      // Submit binding to backend
      setStep2Status(StepStatus.CONFIRMING)
      const { data } = await accountApi.bindDidAccount({
        did: didIdentifier!.toString(),
        signature: signature!,
        account: address
      })

      if (data.flag === 1) {
        setStep2Status(StepStatus.SUCCESS)
      } else {
        setStep2Status(StepStatus.CONFIRM_FAILED)
      }
    } catch (error) {
      console.error(error)
      message.error(error.details || error.message)
      setStep2Status(StepStatus.SIGN_FAILED)
    } finally {
      setLoading(false)
    }
  }, [address, didIdentifier, lastUsedWallet, info?.user_data?.user_id])

  // ============================================================================
  // Event Handlers
  // ============================================================================
  const handleRetry = useCallback(() => {
    if (step1Status === StepStatus.SIGN_FAILED || step1Status === StepStatus.CONFIRM_FAILED) {
      createDid()
    } else if (step2Status === StepStatus.SIGN_FAILED || step2Status === StepStatus.CONFIRM_FAILED) {
      bindDid()
    }
  }, [step1Status, step2Status, createDid, bindDid])

  // ============================================================================
  // Effects - Auto-start workflow
  // ============================================================================
  useEffect(() => {
    if (did) {
      // Pre-existing DID, mark both steps as complete
      setStep1Status(StepStatus.SUCCESS)
      setStep2Status(StepStatus.SUCCESS)
      setDidIdentifier(did)
    } else {
      // Start workflow: Step 1 first, then Step 2 after DID is created
      if (!didIdentifier) {
        createDid()
      } else if (step1Status === StepStatus.SUCCESS && step2Status === StepStatus.IDLE) {
        bindDid()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [didIdentifier, did])

  // ============================================================================
  // Render - UI Components
  // ============================================================================
  return (
    <Spin spinning={loading} tip={tip} wrapperClassName="text-white">
      <div className="mt-6 rounded-2xl bg-[#875DFF1A] p-6">
        <p>
          This will send a transaction on <span className="font-bold">{contract.chain.name}</span> and incur gas.
        </p>
        <p className="font-bold">Do you want to continue?</p>
        <div className="mt-6 rounded-2xl bg-[#1C1C26] px-5 py-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#BBBBBE]">Owner Address</span>
            <span>{shortenAddress(address, 8)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#BBBBBE]">Gas Estimation</span>
            <span>
              {estimateGas} {contract?.chain.nativeCurrency.symbol}
            </span>
          </div>
        </div>
        <div className="mt-6 rounded-2xl bg-[#1C1C26] px-5 py-4">
          {/* Step 1: On-chain Transaction */}
          <h4 className="flex items-center gap-2 text-lg font-bold">
            {step1Status === StepStatus.IDLE && <PendingIcon />}
            {step1Status === StepStatus.SIGNING && <WaitingIcon />}
            {step1Status === StepStatus.CONFIRMING && <PendingIcon />}
            {step1Status === StepStatus.SUCCESS && <DoubleCheckIcon />}
            {(step1Status === StepStatus.SIGN_FAILED || step1Status === StepStatus.CONFIRM_FAILED) && <FailIcon />}
            On-chain transaction
          </h4>
          <p className="mt-[6px] flex items-center gap-2 text-sm text-[#77777D]">
            <div className="mx-2 h-[40px] w-px bg-[#FFFFFF1F]" />
            {didShow ? (
              <div className="flex flex-1 items-center justify-between">
                <span>{didShow}</span>
                {txHash && (
                  <a
                    href={`${contract.chain!.blockExplorers!.default.url}tx/${txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-[#875DFF]"
                  >
                    View on <ExternalLink color="#875DFF" size={18} />
                  </a>
                )}
              </div>
            ) : (
              <span>{step1StatusText}</span>
            )}
          </p>
          {/* Step 2: Account Binding */}
          <h4 className="mt-2 flex items-center gap-2 text-lg font-bold">
            {step2Status === StepStatus.IDLE && <PendingIcon />}
            {step2Status === StepStatus.SIGNING && <WaitingIcon />}
            {step2Status === StepStatus.CONFIRMING && <PendingIcon />}
            {step2Status === StepStatus.SUCCESS && <DoubleCheckIcon />}
            {(step2Status === StepStatus.SIGN_FAILED || step2Status === StepStatus.CONFIRM_FAILED) && <FailIcon />}
            Account binding
          </h4>
          <p className="mt-[6px] flex items-center gap-2 text-sm text-[#77777D]">
            <div className="mx-2 h-[40px] w-px" />
            <span>{step2StatusText}</span>
          </p>
        </div>
        {step2Status === StepStatus.SUCCESS && (
          <div className="mt-6 flex items-center gap-3 rounded-xl bg-[#5DDD2214] p-3 text-[#5DDD22]">
            <CheckboxIcon className="size-6" />
            <span>DID registered. Your account is now bound.</span>
          </div>
        )}
      </div>
      <div className="mt-12 flex items-center justify-center gap-4">
        {step2Status !== StepStatus.SUCCESS && (
          <Button
            className="block h-[40px] w-[240px] rounded-full bg-white text-sm font-medium text-black"
            type="default"
            onClick={onBack}
          >
            Back
          </Button>
        )}

        {step1Status === StepStatus.SIGN_FAILED ||
        step1Status === StepStatus.CONFIRM_FAILED ||
        step2Status === StepStatus.SIGN_FAILED ||
        step2Status === StepStatus.CONFIRM_FAILED ? (
          <Button className="w-[240px] rounded-full text-sm" type="primary" onClick={handleRetry}>
            {buttonText}
          </Button>
        ) : step2Status === StepStatus.SUCCESS ? (
          <Button className="w-[240px] rounded-full text-sm" type="primary" onClick={onNext}>
            Done
          </Button>
        ) : (
          <Button className="w-[240px] rounded-full text-sm opacity-30" type="primary">
            {buttonText}
          </Button>
        )}
      </div>
    </Spin>
  )
}
