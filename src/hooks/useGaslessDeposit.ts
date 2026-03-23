'use client'

import { useCallback, useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useWallets, useSignTransaction } from '@privy-io/react-auth/solana'
import { Transaction, PublicKey } from '@solana/web3.js'
import { createAssociatedTokenAccountInstruction, createTransferInstruction, getAssociatedTokenAddress } from '@solana/spl-token'

const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')
const USDC_DECIMALS = 6

// The server wallet that pays gas — set via env
const FEE_PAYER = new PublicKey(process.env.NEXT_PUBLIC_WALLET_ADDRESS || '11111111111111111111111111111111')

interface DepositResult {
  signature: string
  cityId: string
  deposit: { id: string; amount: number; createdAt: number } | null
  packs: { id: string; cardId: string | null; createdAt: number }[]
}

export function useGaslessDeposit() {
  const { getAccessToken } = usePrivy()
  const { wallets } = useWallets()
  const { signTransaction } = useSignTransaction()
  const [isDepositing, setIsDepositing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deposit = useCallback(async (amountUSDC: number, destinationVault: string): Promise<DepositResult> => {
    setIsDepositing(true)
    setError(null)

    try {
      // 1. Get the embedded wallet (Privy embedded wallet is named 'Privy')
      const embeddedWallet = wallets.find(w => w.standardWallet.name === 'Privy') ?? wallets[0]
      if (!embeddedWallet) {
        throw new Error('No embedded wallet found. Please log in first.')
      }

      const userPubkey = new PublicKey(embeddedWallet.address)
      const vaultPubkey = new PublicKey(destinationVault)

      // 2. Build the USDC transfer transaction
      const userUsdcAta = await getAssociatedTokenAddress(USDC_MINT, userPubkey)
      const vaultUsdcAta = await getAssociatedTokenAddress(USDC_MINT, vaultPubkey)
      const amountLamports = Math.floor(amountUSDC * Math.pow(10, USDC_DECIMALS))

      const tx = new Transaction()
      tx.feePayer = FEE_PAYER // Server pays gas

      // Create destination ATA if needed (idempotent)
      tx.add(
        createAssociatedTokenAccountInstruction(
          FEE_PAYER,    // payer for ATA creation
          vaultUsdcAta, // ATA address
          vaultPubkey,  // owner
          USDC_MINT     // mint
        )
      )

      // Transfer USDC from user to vault
      tx.add(
        createTransferInstruction(
          userUsdcAta,   // source
          vaultUsdcAta,  // destination
          userPubkey,    // authority (user signs this)
          amountLamports
        )
      )

      // 3. Serialize and sign with Privy embedded wallet
      const serializedTx = tx.serialize({ requireAllSignatures: false, verifySignatures: false })
      const { signedTransaction } = await signTransaction({
        transaction: serializedTx,
        wallet: embeddedWallet,
      })

      // 4. Send to relay for fee payer co-signing and submission
      const accessToken = await getAccessToken()
      const response = await fetch('/api/relay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          transaction: Buffer.from(signedTransaction).toString('base64'),
          walletAddress: embeddedWallet.address,
          amountDollars: amountUSDC,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Relay failed')
      }

      return data as DepositResult
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Deposit failed'
      setError(message)
      throw err
    } finally {
      setIsDepositing(false)
    }
  }, [wallets, signTransaction, getAccessToken])

  return { deposit, isDepositing, error }
}
