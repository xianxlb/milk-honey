'use client'

import { useCallback } from 'react'
import { useWeb3Auth } from '@/components/web3auth-provider'
import { VersionedTransaction } from '@solana/web3.js'

export function useTransactionSender() {
  const { solanaWallet } = useWeb3Auth()

  const sendTx = useCallback(async (txBase64: string): Promise<string> => {
    if (!solanaWallet) throw new Error('No wallet connected')

    const txBytes = Buffer.from(txBase64, 'base64')
    const tx = VersionedTransaction.deserialize(txBytes)
    const result = await (solanaWallet as { signAndSendTransaction: (tx: VersionedTransaction) => Promise<{ signature: string }> }).signAndSendTransaction(tx)
    return result.signature
  }, [solanaWallet])

  return { sendTx }
}
