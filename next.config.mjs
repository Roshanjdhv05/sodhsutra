/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
