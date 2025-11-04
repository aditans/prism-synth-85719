/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // This allows us to use WebSockets in the client
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        dns: false,
        fs: false,
        http2: false,
        child_process: false,
      };
    }
    return config;
  },
  // Enable WebSocket support
  // This is needed for WebSocket connections to work in development
  // with Next.js 12+
  experimental: {
    serverComponentsExternalPackages: ['ws'],
  },
  // Set up WebSocket proxy in development
  async rewrites() {
    return [
      {
        source: '/api/wireshark/ws',
        destination: 'http://localhost:3000/api/wireshark/ws',
      },
    ];
  },
};

module.exports = nextConfig;
