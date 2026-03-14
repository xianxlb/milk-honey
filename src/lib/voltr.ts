import { PublicKey } from '@solana/web3.js'
import { getConnection, getWalletKeypair, sendTransaction } from './solana'

const USDC_DECIMALS = 6

function getVaultAddress(): PublicKey {
  const addr = process.env.NEXT_PUBLIC_VOLTR_VAULT_ADDRESS
  if (!addr) throw new Error('NEXT_PUBLIC_VOLTR_VAULT_ADDRESS not configured')
  return new PublicKey(addr)
}

interface VaultInfo {
  apy: number
  totalAssets: number
  vaultAddress: string
}

export async function getVoltrVaultInfo(): Promise<VaultInfo | null> {
  try {
    const vault = getVaultAddress()
    const response = await fetch(
      `https://api.voltr.xyz/vault/${vault.toBase58()}`
    )
    if (!response.ok) return null
    const data = await response.json()
    return {
      apy: data.apy ?? 0,
      totalAssets: data.totalAssets ?? 0,
      vaultAddress: vault.toBase58(),
    }
  } catch (error) {
    console.error('Failed to get Voltr vault info:', error)
    return null
  }
}

export async function depositToVoltr(amountUSDC: number): Promise<string> {
  try {
    const { VaultClient } = await import('@voltr/vault-sdk')
    const connection = getConnection()
    const signer = getWalletKeypair()

    const vaultClient = new VaultClient(connection)
    const tx = await vaultClient.deposit({
      vault: getVaultAddress(),
      amount: Math.floor(amountUSDC * Math.pow(10, USDC_DECIMALS)),
      user: signer.publicKey,
    })

    return sendTransaction(tx, connection, signer)
  } catch (error) {
    console.error('Voltr deposit failed:', error)
    throw error
  }
}

export async function withdrawFromVoltr(amountUSDC: number): Promise<string> {
  try {
    const { VaultClient } = await import('@voltr/vault-sdk')
    const connection = getConnection()
    const signer = getWalletKeypair()

    const vaultClient = new VaultClient(connection)
    const tx = await vaultClient.withdraw({
      vault: getVaultAddress(),
      amount: Math.floor(amountUSDC * Math.pow(10, USDC_DECIMALS)),
      user: signer.publicKey,
    })

    return sendTransaction(tx, connection, signer)
  } catch (error) {
    console.error('Voltr withdraw failed:', error)
    throw error
  }
}
