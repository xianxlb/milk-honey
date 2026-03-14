'use client'

import { PrivyProvider } from '@privy-io/react-auth'

export function AppPrivyProvider({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        loginMethods: ['apple', 'google', 'wallet'],
        appearance: { theme: 'light', accentColor: '#6CB4E8' },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
          requireUserPasswordOnCreate: false,
        },
        solanaClusters: [{
          name: 'mainnet-beta',
          rpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
        }],
      }}
    >
      {children}
    </PrivyProvider>
  )
}
