'use client'

import { usePrivy } from '@privy-io/react-auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function useAuth() {
  const { ready, authenticated, getAccessToken, user } = usePrivy()
  const router = useRouter()

  useEffect(() => {
    if (ready && !authenticated) router.replace('/login')
  }, [ready, authenticated, router])

  const walletAddress = (user?.linkedAccounts ?? []).find(
    (a) => a.type === 'wallet' && (a as { chainType?: string }).chainType === 'solana'
  )?.address as string | undefined

  return { ready, authenticated, getAccessToken, walletAddress }
}
