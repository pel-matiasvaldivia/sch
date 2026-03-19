/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  // Rewrite /api/backend/* → backend container
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || "http://backend:8000";
    return [
      {
        source: "/api/backend/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ];
  },

  // Imágenes
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "http",
        hostname: "minio",
      },
    ],
  },

  // Variables de entorno públicas
  env: {
    NEXT_PUBLIC_APP_NAME: "Sistema Hematología",
    NEXT_PUBLIC_DATE_FORMAT: "dd/MM/yyyy",
    NEXT_PUBLIC_CURRENCY: "ARS",
  },
};

export default nextConfig;
