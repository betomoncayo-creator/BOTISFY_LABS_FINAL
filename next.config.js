/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Esto permite que el build de producción se complete incluso si hay errores de ESLint.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Esto ignora los errores de TypeScript durante el build de Vercel.
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig