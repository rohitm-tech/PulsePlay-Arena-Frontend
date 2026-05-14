/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  /** Recharts ships modern JS; transpiling avoids occasional webpack/runtime mismatches with Next 14. */
  transpilePackages: ['recharts'],
};

export default nextConfig;
