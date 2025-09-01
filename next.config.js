/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure dynamic routes and optimizations
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js', '@tanstack/react-query'],
  },
  
  // Configure build ID
  async generateBuildId() {
    return 'build-' + Date.now()
  },
  
  // Compression
  compress: true,
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
  
  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
  
  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
            supabase: {
              test: /[\\/]node_modules[\\/]@supabase[\\/]/,
              name: 'supabase',
              chunks: 'all',
            },
            tanstack: {
              test: /[\\/]node_modules[\\/]@tanstack[\\/]/,
              name: 'tanstack',
              chunks: 'all',
            },
          },
        },
      }
    }
    
    return config
  },
  
  // Environment-specific configurations
  env: {
    CUSTOM_KEY: process.env.NODE_ENV,
  },

  // Webpack configuration for better path resolution
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
    }
    return config
  },
  
  // PWA configuration (if needed in the future)
  // pwa: {
  //   dest: 'public',
  //   register: true,
  //   skipWaiting: true,
  // },
}

module.exports = nextConfig