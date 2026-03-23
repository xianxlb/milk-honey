'use client'

import { PrivyProvider } from '@privy-io/react-auth'
import { PortfolioProvider } from '@/contexts/portfolio-context'
import { createSolanaRpc, createSolanaRpcSubscriptions } from '@solana/kit'

export function Providers({ children }: { children: React.ReactNode }) {
  const rpcUrl = `${window.location.origin}/api/solana/rpc`
  const solanaRpcs = {
    'solana:mainnet': {
      rpc: createSolanaRpc(rpcUrl),
      rpcSubscriptions: createSolanaRpcSubscriptions(process.env.NEXT_PUBLIC_SOLANA_WS_URL!),
    },
  }

  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
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
