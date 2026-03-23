import { NextRequest, NextResponse } from 'next/server'
import { Transaction, PublicKey } from '@solana/web3.js'
import { getConnection, getWalletKeypair } from '@/lib/solana'
import { verifyPrivyToken } from '@/lib/privy'
import { getDb, getCityByPrivyUserId, createCity, linkCityToPrivyUser, createDeposit, createPack } from '@/lib/db'

// Programs and accounts that are allowed in relayed transactions
const ALLOWED_PROGRAMS = new Set([
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',  // SPL Token Program
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL', // Associated Token Program
  '11111111111111111111111111111111',                // System Program
  'ComputeBudget111111111111111111111111111111',     // Compute Budget
])

// USDC mint on mainnet
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'

// Whitelisted vault/protocol destination accounts can be configured here
function getAllowedDestinations(): Set<string> {
  const destinations = new Set<string>()
  // Add Jupiter Lend and Voltr vault addresses when known
  const voltrVault = process.env.NEXT_PUBLIC_VOLTR_VAULT_ADDRESS
  if (voltrVault) destinations.add(voltrVault)
  // Add any additional whitelisted addresses here
  return destinations
}

function validateTransaction(tx: Transaction, userWallet: string, feePayerPubkey: PublicKey): string | null {
  // Fee payer must be our server wallet
  if (!tx.feePayer?.equals(feePayerPubkey)) {
    return 'Transaction fee payer must be the relay wallet'
  }

  // Check all instructions use allowed programs
  for (const ix of tx.instructions) {
    const programId = ix.programId.toBase58()
    if (!ALLOWED_PROGRAMS.has(programId)) {
      return `Disallowed program: ${programId}`
    }
  }

  // Ensure the transaction doesn't grant authority over the fee payer's funds
  // by checking no instruction references the fee payer as a writable signer
  // (the fee payer only pays fees, never moves its own tokens)
  for (const ix of tx.instructions) {
    for (const key of ix.keys) {
      if (key.pubkey.equals(feePayerPubkey) && key.isWritable && key.isSigner) {
        // Only allow if it's a simple SOL fee deduction (System Program)
        if (ix.programId.toBase58() !== '11111111111111111111111111111111') {
          return 'Transaction attempts to use relay wallet as writable signer in non-system program'
        }
      }
    }
  }

  return null
}

export async function POST(req: NextRequest) {
  try {
    // 1. Verify Privy auth token
    const authHeader = req.headers.get('authorization')
    const { userId: privyUserId } = await verifyPrivyToken(authHeader)

    // 2. Parse request
    const body = await req.json()
    const { transaction: txBase64, walletAddress, amountDollars } = body

    if (!txBase64 || !walletAddress) {
      return NextResponse.json({ error: 'transaction and walletAddress required' }, { status: 400 })
    }

    // 3. Deserialize the partially-signed transaction
    const txBuffer = Buffer.from(txBase64, 'base64')
    const tx = Transaction.from(txBuffer)

    // 4. Validate the transaction
    const feePayer = getWalletKeypair()
    const validationError = validateTransaction(tx, walletAddress, feePayer.publicKey)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    // 5. Co-sign as fee payer and submit
    const connection = getConnection()
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
    tx.recentBlockhash = blockhash
    tx.partialSign(feePayer)

    const signature = await connection.sendRawTransaction(tx.serialize())
    await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed')

    // 6. Record deposit in DB and link user to city
    const db = getDb()
    let city = getCityByPrivyUserId(db, privyUserId)
    if (!city) {
      city = createCity(db, 'My City')
      linkCityToPrivyUser(db, city.id, privyUserId, walletAddress)
    }

    const amountCents = Math.round((amountDollars || 0) * 100)
    let depositRecord = null
    const packs: { id: string; cardId: string | null; createdAt: number }[] = []

    if (amountCents > 0) {
      depositRecord = createDeposit(db, city.id, amountCents)
      const numPacks = Math.floor(amountCents / 10000) // 1 pack per $100
      for (let i = 0; i < numPacks; i++) {
        const pack = createPack(db, city.id)
        packs.push({ id: pack.id, cardId: pack.cardId, createdAt: pack.createdAt })
      }
    }

    return NextResponse.json({
      signature,
      cityId: city.id,
      deposit: depositRecord ? { id: depositRecord.id, amount: depositRecord.amount, createdAt: depositRecord.createdAt } : null,
      packs,
    })
  } catch (error) {
    console.error('Relay error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    const status = message.includes('Missing') || message.includes('invalid') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
