/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    const backend = process.env.BACKEND_URL ?? 'http://localhost:8080'
    // Chỉ proxy các module backend — KHÔNG proxy /api/auth/* (NextAuth)
    const modules = ['personnel', 'attendance', 'payroll', 'dashboard', 'notifications', 'files', 'recruitment', 'kpi', 'report', 'workflow', 'admin']
    const moduleRewrites = modules.map(mod => ({
      source: `/api/${mod}/:path*`,
      destination: `${backend}/api/${mod}/:path*`,
    }))
    // /api/auth-backend/* → backend /api/auth/* (tránh clash với NextAuth /api/auth/*)
    return [
      ...moduleRewrites,
      { source: '/api/auth-backend/:path*', destination: `${backend}/api/auth/:path*` },
    ]
  },
}

export default nextConfig
