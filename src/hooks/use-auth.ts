'use client'

import { useWeb3Auth } from '@/components/web3auth-provider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function useAuth() {
  const { ready, authenticated, getAccessToken, walletAddress } = useWeb3Auth()
  const router = useRouter()

  useEffect(() => {
    if (ready && !authenticated) router.replace('/login')
  }, [ready, authenticated, router])

  return { ready, authenticated, getAccessToken, walletAddress }
}
