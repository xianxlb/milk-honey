'use client'

import { useCallback } from 'react'
import { useWeb3Auth } from '@/components/web3auth-provider'
import { useWallet } from '@solana/wallet-adapter-react'
import { VersionedTransaction, Connection } from '@solana/web3.js'

export function useTransactionSender() {
  const { solanaWallet } = useWeb3Auth()
  const { sendTransaction, connected: walletConnected } = useWallet()

  const sendTx = useCallback(async (txBase64: string): Promise<string> => {
    const txBytes = Buffer.from(txBase64, 'base64')
    const tx = VersionedTransaction.deserialize(txBytes)

    // Prefer external wallet (Jupiter Mobile via WalletConnect)
    if (walletConnected) {
      const rpcUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/api/rpc`
        : 'https://api.mainnet-beta.solana.com'
      const connection = new Connection(rpcUrl)
      return await sendTransaction(tx, connection, { skipPreflight: false, preflightCommitment: 'confirmed' })
    }

    if (solanaWallet) {
      const result = await (solanaWallet as { signAndSendTransaction: (tx: VersionedTransaction) => Promise<{ signature: string }> }).signAndSendTransaction(tx)
      return result.signature
    }

    throw new Error('No wallet connected')
  }, [solanaWallet, walletConnected, sendTransaction])

  return { sendTx }
}
