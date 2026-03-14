const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^\/api\/portfolio/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'portfolio-cache',
        expiration: { maxEntries: 1, maxAgeSeconds: 3600 },
      },
    },
  ],
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},
}

module.exports = withPWA(nextConfig)
