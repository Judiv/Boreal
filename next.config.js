/** @type {import('next').NextConfig} */

const nextConfig = {
  async headers() {
  return [
    {
      // ✅ On protège tout SAUF l'API d'uploads
      source: '/((?!api/uploads).*)', 
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Content-Security-Policy', value: "frame-ancestors 'none';" },
      ],
    },
    {
      // ✅ Configuration spécifique pour les fichiers
      source: '/api/uploads/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'Content-Security-Policy', value: "frame-ancestors 'self';" },
      ],
    },
  ];
},

  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,

  images: {
    unoptimized: true,
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },

  experimental: {
    serverActions: { bodySizeLimit: '200mb' },
    proxyClientMaxBodySize: '200mb',
  },

  serverExternalPackages: ['@prisma/client', 'fs-extra'],

  typescript: { ignoreBuildErrors: true },
  // ✅ Supprimé ici pour éviter le warning Invalid options
};

module.exports = nextConfig;