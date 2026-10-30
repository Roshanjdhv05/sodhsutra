import { createRequire } from 'module';

const require = createRequire(import.meta.url);
try {
  const webpack = require('next/dist/compiled/webpack/webpack');
  if (typeof webpack.init === 'function') webpack.init();
} catch {
  // ignore
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  webpack(config, { dev }) {
    // Prevent devtool eval-source-map mismatch issues in Next.js 15
    if (dev) {
      config.devtool = 'cheap-module-source-map';
    }
    return config;
  },
  async redirects() {
    return [
      {
        source: '/categories',
        destination: '/published-papers',
        permanent: true,
      },
      {
        source: '/categories/:slug',
        destination: '/published-papers?cat=:slug',
        permanent: true,
      },
    ];
  },
};
export default nextConfig;

