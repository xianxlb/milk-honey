'use client'

import { useCallback } from 'react'
import { useWeb3Auth } from '@/components/web3auth-provider'
import { VersionedTransaction } from '@solana/web3.js'

export function useTransactionSender() {
  const { solanaWallet, getConnectedWcAdapter } = useWeb3Auth()

  const sendTx = useCallback(async (txBase64: string): Promise<string> => {
    const txBytes = Buffer.from(txBase64, 'base64')
    const tx = VersionedTransaction.deserialize(txBytes)

    if (solanaWallet) {
      const result = await solanaWallet.signAndSendTransaction(tx)
      return result.signature
    }

    const wcAdapter = getConnectedWcAdapter()
    if (wcAdapter) {
      return await wcAdapter.signAndSendTransaction(tx)
    }

    throw new Error('No wallet connected')
  }, [solanaWallet, getConnectedWcAdapter])

  return { sendTx }
}
