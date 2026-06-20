/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    const backend = process.env.BACKEND_URL ?? 'http://localhost:8080'
    // Chỉ proxy các module backend — KHÔNG proxy /api/auth/* (NextAuth)
    const modules = ['personnel', 'attendance', 'payroll', 'dashboard', 'recruitment', 'kpi', 'report', 'workflow']
    return modules.map(mod => ({
      source: `/api/${mod}/:path*`,
      destination: `${backend}/api/${mod}/:path*`,
    }))
  },
}

export default nextConfig
