/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,
  typescript: {
    // !! WARN !!
    // For production, you should run type checking as part of your CI/CD process
    ignoreBuildErrors: true,
  },
  eslint: {
    // For production, you should run linting as part of your CI/CD process
    ignoreDuringBuilds: true,
  },
  distDir: '.next',
  webpack: (config, { dev, isServer }) => {
    // Reduce parallelism in production builds
    if (!dev && !isServer) {
      config.parallelism = 1;
      config.cache = false;
    }
    return config;
  },
}

module.exports = nextConfig
