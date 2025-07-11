/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
    serverActions: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Enable standalone output for Railway deployment
  output: 'standalone',
  // Disable static optimization for server-side audio processing
  experimental: {
    outputFileTracingIncludes: {
      '/api/**/*': ['./node_modules/**/*.wasm', './node_modules/**/*.node'],
    },
  },
  webpack: (config, { isServer }) => {
    // Ensure ffmpeg and other binaries are properly handled
    if (isServer) {
      config.externals.push('fsevents');
    }
    return config;
  },
}

module.exports = nextConfig 