/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        // Chỉ proxy các route KHÔNG phải NextAuth (/api/auth/*)
        source: '/api/((?!auth/).*)',
        destination: `${process.env.BACKEND_URL ?? 'http://localhost:8080'}/api/$1`,
      },
    ]
  },
}

export default nextConfig
