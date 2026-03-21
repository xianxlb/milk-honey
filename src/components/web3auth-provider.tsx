'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { Web3AuthNoModal } from '@web3auth/no-modal'
import { AuthAdapter, UX_MODE, LOGIN_PROVIDER } from '@web3auth/auth-adapter'
import { WALLET_ADAPTERS, CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from '@web3auth/base'
import { SolanaPrivateKeyProvider, SolanaWallet } from '@web3auth/solana-provider'
import { WalletConnectWalletAdapter } from '@walletconnect/solana-adapter'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { setApiWalletAddress } from '@/lib/client-api'

const CHAIN_CONFIG = {
  chainNamespace: CHAIN_NAMESPACES.SOLANA,
  chainId: '0x1',
  rpcTarget: 'https://api.mainnet-beta.solana.com',
  displayName: 'Solana Mainnet',
  blockExplorer: 'https://explorer.solana.com',
  ticker: 'SOL',
  tickerName: 'Solana',
}

interface Web3AuthContextValue {
  ready: boolean
  authenticated: boolean
  loginWithGoogle: () => Promise<void>
  loginWithEmail: (email: string) => Promise<void>
  setWalletSession: (sessionToken: string, walletAddr: string) => void
  logout: () => Promise<void>
  getAccessToken: () => Promise<string | null>
  walletAddress: string | undefined
  solanaWallet: SolanaWallet | null
  getWcAdapter: () => WalletConnectWalletAdapter
}

const Web3AuthContext = createContext<Web3AuthContextValue | null>(null)

export function useWeb3Auth() {
  const ctx = useContext(Web3AuthContext)
  if (!ctx) throw new Error('useWeb3Auth must be used within AppWeb3AuthProvider')
  return ctx
}

let _w3a: Web3AuthNoModal | null = null
let _initPromise: Promise<void> | null = null

async function getWeb3Auth(): Promise<Web3AuthNoModal> {
  if (_w3a && _initPromise) {
    await _initPromise
    return _w3a
  }
  const rpcUrl = `${window.location.origin}/api/rpc`
  const solanaProvider = new SolanaPrivateKeyProvider({
    config: { chainConfig: { ...CHAIN_CONFIG, rpcTarget: rpcUrl } },
  })
  _w3a = new Web3AuthNoModal({
    clientId: process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID!,
    web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_MAINNET,
    privateKeyProvider: solanaProvider,
  })
  const authAdapter = new AuthAdapter({
    adapterSettings: {
      uxMode: UX_MODE.REDIRECT,
      redirectUrl: `${window.location.origin}/login`,
    },
  })
  _w3a.configureAdapter(authAdapter)
  _initPromise = _w3a.init()
  await _initPromise
  return _w3a
}

export function AppWeb3AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | undefined>()
  const [solanaWallet, setSolanaWallet] = useState<SolanaWallet | null>(null)
  const [sessionToken, setSessionToken] = useState<string | null>(null)

  // Lazy-init the adapter on first use to avoid ESM/CJS prototype issues at
  // module init time. The adapter is created only when connect() is actually called.
  const wcAdapterRef = useRef<WalletConnectWalletAdapter | null>(null)

  const getWcAdapter = useCallback((): WalletConnectWalletAdapter => {
    if (!wcAdapterRef.current) {
      wcAdapterRef.current = new WalletConnectWalletAdapter({
        network: WalletAdapterNetwork.Mainnet,
        options: { projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID! },
      })
    }
    return wcAdapterRef.current
  }, [])

  useEffect(() => {
    getWeb3Auth()
      .then(async w3a => {
        if (w3a.connected && w3a.provider) {
          const sw = new SolanaWallet(w3a.provider)
          const accounts = await sw.requestAccounts()
          const addr = accounts[0]
          setWalletAddress(addr)
          setSolanaWallet(sw)
          setAuthenticated(true)
          setApiWalletAddress(addr)
        }
        setReady(true)
      })
      .catch(err => {
        console.error('Web3Auth init failed:', err)
        setReady(true)
      })
  }, [])

  const connectW3A = useCallback(async (provider: Awaited<ReturnType<typeof getWeb3Auth>>['provider']) => {
    if (!provider) return
    const sw = new SolanaWallet(provider)
    const accounts = await sw.requestAccounts()
    const addr = accounts[0]
    setWalletAddress(addr)
    setSolanaWallet(sw)
    setAuthenticated(true)
    setApiWalletAddress(addr)
  }, [])

  const loginWithGoogle = useCallback(async () => {
    const w3a = await getWeb3Auth()
    const p = await w3a.connectTo(WALLET_ADAPTERS.AUTH, { loginProvider: LOGIN_PROVIDER.GOOGLE })
    await connectW3A(p)
  }, [connectW3A])

  const loginWithEmail = useCallback(async (email: string) => {
    const w3a = await getWeb3Auth()
    const p = await w3a.connectTo(WALLET_ADAPTERS.AUTH, {
      loginProvider: LOGIN_PROVIDER.EMAIL_PASSWORDLESS,
      extraLoginOptions: { login_hint: email },
    })
    await connectW3A(p)
  }, [connectW3A])

  const setWalletSession = useCallback((token: string, walletAddr: string) => {
    setSessionToken(token)
    setWalletAddress(walletAddr)
    setAuthenticated(true)
    setApiWalletAddress(walletAddr)
  }, [])

  const logout = useCallback(async () => {
    if (_w3a?.connected) await _w3a.logout()
    if (wcAdapterRef.current?.connected) await wcAdapterRef.current.disconnect()
    setAuthenticated(false)
    setWalletAddress(undefined)
    setSolanaWallet(null)
    setSessionToken(null)
    setApiWalletAddress(undefined)
  }, [])

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (sessionToken) return sessionToken
    if (!_w3a?.connected) return null
    try {
      const { idToken } = await _w3a.authenticateUser()
      return idToken
    } catch {
      return null
    }
  }, [sessionToken])

  return (
    <Web3AuthContext.Provider
      value={{
        ready,
        authenticated,
        loginWithGoogle,
        loginWithEmail,
        setWalletSession,
        logout,
        getAccessToken,
        walletAddress,
        solanaWallet,
        getWcAdapter,
      }}
    >
      {children}
    </Web3AuthContext.Provider>
  )
}
