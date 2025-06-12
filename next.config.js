const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true"
})

const withPWA = require("next-pwa")({
  dest: "public"
})

// Extend webpack to ignore cloudflare:sockets in client builds
const webpack = require('webpack')
module.exports = withBundleAnalyzer(
  withPWA({
    reactStrictMode: true,
    images: {
      remotePatterns: [
        {
          protocol: "http",
          hostname: "localhost"
        },
        {
          protocol: "http",
          hostname: "127.0.0.1"
        },
        {
          protocol: "https",
          hostname: "**"
        }
      ]
    },
    experimental: {
      serverComponentsExternalPackages: ["sharp", "onnxruntime-node"]
    },
    webpack: (config, { isServer }) => {
      // Alias cloudflare:sockets to a client-side stub
      const path = require('path')
      config.resolve.alias = {
        ...config.resolve.alias,
        'cloudflare:sockets': path.resolve(__dirname, 'components/cf-sockets-shim.js')
      }
      if (!isServer) {
        config.resolve.fallback = {
          ...config.resolve.fallback,
          fs: false,
          net: false,
          tls: false,
          dns: false
        }
        // Replace any import from '@/db/...' with a shim module in client bundles
        config.plugins.push(
          // Replace any import from '@/db/...' with a client-side shim
          new webpack.NormalModuleReplacementPlugin(
            /^@\/db\//,
            require.resolve('./components/db-shim.js')
          ),
          // Stub out PG modules too
          new webpack.IgnorePlugin({ resourceRegExp: /^pg$/ }),
          new webpack.IgnorePlugin({ resourceRegExp: /^pg-cloudflare$/ })
        )
      }
      return config
    }
  })
)
