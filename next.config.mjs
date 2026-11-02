import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
  eslint: { ignoreDuringBuilds: true },
  serverExternalPackages: ['pdf-parse'],
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
