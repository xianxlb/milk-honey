'use client'

import { PrivyProvider } from '@privy-io/react-auth'
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana'

const solanaConnectors = toSolanaWalletConnectors()

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'PRIVY_APP_ID_NOT_SET'}
      config={{
        appearance: {
          theme: 'light',
          accentColor: '#5B9BD5',
          logo: '/buildings/bakery.png',
          walletChainType: 'solana-only',
        },
        loginMethods: ['email', 'google', 'apple'],
        embeddedWallets: {
          solana: {
            createOnLogin: 'all-users',
          },
          showWalletUIs: false,
        },
        externalWallets: {
          solana: { connectors: solanaConnectors },
        },
      }}
    >
      {children}
    </PrivyProvider>
  )
}
