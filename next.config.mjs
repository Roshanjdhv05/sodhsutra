import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  outputFileTracingRoot: __dirname,
  serverExternalPackages: ['pdf-parse'],
  webpack(config, { dev }) {
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
