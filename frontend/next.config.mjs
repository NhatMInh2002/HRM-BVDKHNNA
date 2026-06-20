/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    return {
      beforeFiles: [],
      // afterFiles: Next.js kiểm tra app routes trước.
      // /api/auth/* → NextAuth route.ts xử lý (không bị proxy)
      // /api/payroll/* v.v. → không có app route → proxy về backend
      afterFiles: [
        {
          source: '/api/:path*',
          destination: `${process.env.BACKEND_URL ?? 'http://localhost:8080'}/api/:path*`,
        },
      ],
      fallback: [],
    }
  },
}

export default nextConfig
