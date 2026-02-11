import bundleAnalyzer from '@next/bundle-analyzer';
import { createMDX } from 'fumadocs-mdx/next';
import createNextIntlPlugin from 'next-intl/plugin';

const withMDX = createMDX();

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const withNextIntl = createNextIntlPlugin(
  './src/core/i18n/request.ts'
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.VERCEL ? undefined : 'standalone',
  reactStrictMode: false,
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  
  // ✅ Prisma 修复: 防止打包失败，保留
  serverExternalPackages: ['@prisma/client'],

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*',
      },
    ],
  },
  async redirects() {
    return [];
  },
  
  // 暂时注释掉 Turbopack 配置，除非你确定在开发环境使用它
  // turbopack: {
  //   resolveAlias: {
  //   },
  // },

  experimental: {
    // ❌ 删除：导致 "Unrecognized key" 报错
    // turbopackFileSystemCacheForDev: true,
    
    // ✅ 保留：Fumadocs 必需配置
    mdxRs: false, 
  },

  // ❌ 删除：导致 "Unrecognized key" 报错
  // reactCompiler: true,
};

export default withBundleAnalyzer(withNextIntl(withMDX(nextConfig)));