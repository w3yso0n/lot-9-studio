import type { NextConfig } from "next";
import path from "node:path";

const modernPolyfillStub = path.join(process.cwd(), "scripts/empty-polyfill.js");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
  experimental: {
    inlineCss: true,
    optimizePackageImports: ["lucide-react", "react-icons"],
    serverActions: {
      bodySizeLimit: "50mb",
    },
  } as NextConfig["experimental"],
  /**
   * Rutas serverless no deben empaquetar assets estáticos enormes (p. ej. renders 4K en public/images).
   * Esas rutas siguen disponibles en /images/... vía CDN de Vercel; solo se excluyen del .nft del Lambda.
   * @see https://nextjs.org/docs/app/api-reference/config/next-config-js/output#caveats
   */
  outputFileTracingExcludes: {
    "/*": ["public/images/**/*", "public/video1.mp4"],
  },
  webpack(config, { isServer, webpack }) {
    if (!isServer) {
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /[\\/]build[\\/]polyfills[\\/]polyfill-module$/,
          modernPolyfillStub
        )
      );
    }
    return config;
  },
};

export default nextConfig;
