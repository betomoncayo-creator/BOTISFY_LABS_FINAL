/** @type {import('next').NextConfig} */
const nextConfig = {
    // Deshabilitar Static Site Generation (SSG) para rutas que necesitan autenticación
    // En su lugar usar ISR o On-Demand Revalidation
    experimental: {
      isrMemoryCacheSize: 0,
    },
    // No pregenerar rutas estáticas en build time
    onDemandEntries: {
      maxInactiveAge: 60 * 1000,
      pagesBufferLength: 5,
    },
    // Webpack optimizations
    webpack: (config, { isServer }) => {
      if (!isServer) {
        config.optimization = {
          ...config.optimization,
          runtimeChunk: 'single',
        }
      }
      return config
    },
  }
  
  module.exports = nextConfig