/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  // Headers de seguridad HTTP
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },

  // Imágenes
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      { protocol: "http", hostname: "minio" },
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
