'use client'

import { useCallback } from 'react'
import { useWallets, useSignAndSendTransaction } from '@privy-io/react-auth/solana'

export function useTransactionSender() {
  const { wallets } = useWallets()
  const { signAndSendTransaction } = useSignAndSendTransaction()

  const sendTx = useCallback(async (txBase64: string): Promise<string> => {
    const wallet = wallets[0]
    if (!wallet) throw new Error('No wallet connected')

    const txBytes = Buffer.from(txBase64, 'base64')
    const result = await signAndSendTransaction({
      transaction: txBytes,
      wallet,
      options: { sponsor: true },
    })

    // result.signature is Uint8Array — encode to base58 string
    const bs58 = await import('bs58')
    return bs58.default.encode(result.signature)
  }, [wallets, signAndSendTransaction])

  return { sendTx }
}
