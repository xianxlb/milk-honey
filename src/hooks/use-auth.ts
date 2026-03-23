'use client'

import { usePrivy } from '@privy-io/react-auth'
import { useWallets } from '@privy-io/react-auth/solana'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function useAuth() {
  const { ready, authenticated, getAccessToken } = usePrivy()
  const { wallets } = useWallets()
  const router = useRouter()

  const walletAddress = wallets[0]?.address

  useEffect(() => {
    if (ready && !authenticated) router.replace('/login')
  }, [ready, authenticated, router])

  return { ready, authenticated, getAccessToken, walletAddress }
}
