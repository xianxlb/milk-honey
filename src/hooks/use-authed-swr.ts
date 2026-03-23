import useSWR from 'swr'
import { useAuth } from '@/hooks/use-auth'

// SWR fetcher that injects the Web3Auth token
export function useAuthedSWR<T>(path: string | null) {
  const { authenticated, getAccessToken } = useAuth()

  return useSWR<T>(
    authenticated && path ? path : null,
    async () => {
      const token = await getAccessToken()
      if (!token) throw new Error('Not authenticated')
      const res = await fetch(path!, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `API ${res.status}`)
      }
      return res.json()
    },
    { revalidateOnFocus: false },
  )
}
