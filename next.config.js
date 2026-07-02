const checkEnvVariables = require("./check-env-variables")

checkEnvVariables()

const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL?.replace(/^https?:\/\//, "").split("/")[0] ||
  ""
const backendUrl =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL?.replace(/^https?:\/\//, "").split("/")[0] ||
  ""
const isBaseUrlHttps = process.env.NEXT_PUBLIC_BASE_URL?.startsWith("https")

const remotePatterns = [
  {
    protocol: "http",
    hostname: "localhost",
  },
  ...(baseUrl
    ? [
        // Note: needed to serve images from /public folder
        {
          protocol: isBaseUrlHttps ? "https" : "http",
          hostname: baseUrl,
        },
      ]
    : []),
  ...(backendUrl
    ? [
        // Note: only needed when using local-file for product media
        {
          protocol: "https",
          hostname: backendUrl,
        },
      ]
    : []),
  // Note: can be removed after deleting demo products
  {
    protocol: "https",
    hostname: "medusa-public-images.s3.eu-west-1.amazonaws.com",
  },
  {
    protocol: "https",
    hostname: "medusa-server-testing.s3.amazonaws.com",
  },
  {
    protocol: "https",
    hostname: "medusa-server-testing.s3.us-east-1.amazonaws.com",
  },
  ...(process.env.NEXT_PUBLIC_MINIO_ENDPOINT
    ? [
        // Note: needed when using MinIO bucket storage for media
        {
          protocol: "https",
          hostname: process.env.NEXT_PUBLIC_MINIO_ENDPOINT,
        },
      ]
    : []),
]

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns,
  },
  serverRuntimeConfig: {
    port: process.env.PORT || 3000
  }
}

module.exports = nextConfig
