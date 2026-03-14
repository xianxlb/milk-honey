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
          solana: { createOnLogin: 'users-without-wallets' },
        },
      }}
    >
      {children}
    </PrivyProvider>
  )
}
