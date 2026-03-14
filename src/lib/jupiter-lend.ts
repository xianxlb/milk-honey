import { PublicKey } from '@solana/web3.js'
import { BN } from 'bn.js'
import { getConnection, getWalletKeypair, getWalletPublicKey, sendTransaction } from './solana'

const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')
const USDC_DECIMALS = 6

interface LendingPosition {
  shares: number
  assets: number
  totalBalance: number
}

export async function getJupiterLendAPY(): Promise<number> {
  try {
    const { getLendingTokenDetails } = await import('@jup-ag/lend')
    const connection = getConnection()
    const details = await getLendingTokenDetails({
      asset: USDC_MINT,
      connection,
      cluster: 'mainnet-beta',
    })
    return (details.apy ?? 0) / 10000
  } catch (error) {
    console.error('Failed to get Jupiter Lend APY:', error)
    return 0
  }
}

export async function getJupiterLendPosition(): Promise<LendingPosition | null> {
  try {
    const { getUserLendingPositionByAsset } = await import('@jup-ag/lend')
    const connection = getConnection()
    const signer = getWalletPublicKey()
    const position = await getUserLendingPositionByAsset({
      asset: USDC_MINT,
      signer,
      connection,
      cluster: 'mainnet-beta',
    })
    return {
      shares: position.shareBalance ?? 0,
      assets: (position.underlyingAssets ?? 0) / Math.pow(10, USDC_DECIMALS),
      totalBalance: (position.totalBalance ?? 0) / Math.pow(10, USDC_DECIMALS),
    }
  } catch (error) {
    console.error('Failed to get Jupiter Lend position:', error)
    return null
  }
}

export async function depositToJupiterLend(amountUSDC: number): Promise<string> {
  const { getDepositIx } = await import('@jup-ag/lend')
  const connection = getConnection()
  const signer = getWalletKeypair()
  const amountBN = new BN(Math.floor(amountUSDC * Math.pow(10, USDC_DECIMALS)))

  const ix = await getDepositIx({
    amount: amountBN,
    asset: USDC_MINT,
    signer: signer.publicKey,
    connection,
    cluster: 'mainnet-beta',
  })

  const { Transaction, TransactionInstruction } = await import('@solana/web3.js')
  const transaction = new Transaction().add(new TransactionInstruction(ix))
  return sendTransaction(transaction, connection, signer)
}

export async function withdrawFromJupiterLend(amountUSDC: number): Promise<string> {
  const { getWithdrawIx } = await import('@jup-ag/lend')
  const connection = getConnection()
  const signer = getWalletKeypair()
  const amountBN = new BN(Math.floor(amountUSDC * Math.pow(10, USDC_DECIMALS)))

  const ix = await getWithdrawIx({
    amount: amountBN,
    asset: USDC_MINT,
    signer: signer.publicKey,
    connection,
    cluster: 'mainnet-beta',
  })

  const { Transaction, TransactionInstruction } = await import('@solana/web3.js')
  const transaction = new Transaction().add(new TransactionInstruction(ix))
  return sendTransaction(transaction, connection, signer)
}
