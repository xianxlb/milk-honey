'use client'

import { PrivyProvider } from '@privy-io/react-auth'
import { PortfolioProvider } from '@/contexts/portfolio-context'
import { createSolanaRpc, createSolanaRpcSubscriptions } from '@solana/kit'

export function Providers({ children }: { children: React.ReactNode }) {
  const rpcUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/solana/rpc`
    : 'https://localhost/api/solana/rpc'
  const wsUrl = process.env.NEXT_PUBLIC_SOLANA_WS_URL || 'wss://api.mainnet-beta.solana.com'
  const solanaRpcs = {
    'solana:mainnet': {
      rpc: createSolanaRpc(rpcUrl),
      rpcSubscriptions: createSolanaRpcSubscriptions(wsUrl),
    },
  }

  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID
  if (!appId) {
    // Render children without auth provider in dev when env is missing
    return <>{children}</>
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ['google', 'email'],
        embeddedWallets: {
          solana: { createOnLogin: 'users-without-wallets' },
          showWalletUIs: false,
        },
        appearance: {
          theme: 'light',
          accentColor: '#F0C430',
        },
        solana: { rpcs: solanaRpcs },
      }}
    >
      <PortfolioProvider>{children}</PortfolioProvider>
    </PrivyProvider>
  )
}
