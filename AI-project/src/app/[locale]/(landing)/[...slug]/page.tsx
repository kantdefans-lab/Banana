import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { getThemePage } from '@/core/theme';
import { envConfigs } from '@/config';
import { getLocalPage } from '@/shared/models/post';

// --- 辅助函数：验证 slug 有效性 ---
function isValidSlug(slug: string): boolean {
  // 如果 slug 以 .json, .xml, .ico 等结尾，说明不是页面请求
  if (slug.endsWith('.json') || slug.endsWith('.xml') || slug.endsWith('.ico')) {
    return false;
  }
  // 特别检查导致报错的 Chrome DevTools 请求
  if (slug.includes('appspecific')) {
    return false;
  }
  return true;
}

// 动态页面元数据生成
export async function generateMetadata({
  params,
}: {
  // 注意：在 [...slug] 路由中，slug 通常是 string[] 数组
  params: Promise<{ locale: string; slug: string[] }>; 
}) {
  const { locale, slug } = await params;

  // 🛡️ 守卫逻辑：检查无效的文件请求
  const slugStr = Array.isArray(slug) ? slug.join('.') : slug;
  if (!isValidSlug(slugStr)) {
    return {}; // 对于无效请求，直接返回空元数据，避免报错
  }

  // 元数据变量
  let title = '';
  let description = '';
  let canonicalUrl = '';

  // 1. 尝试从 content/pages/**/*.mdx 获取静态页面元数据

  // 静态页面 slug (使用 / 连接)
  const staticPageSlug = Array.isArray(slug) ? slug.join('/') : slug || '';

  // 构建规范链接 (canonical url)
  canonicalUrl =
    locale !== envConfigs.locale
      ? `${envConfigs.app_url}/${locale}/${staticPageSlug}`
      : `${envConfigs.app_url}/${staticPageSlug}`;

  // 获取静态页面内容
  const staticPage = await getLocalPage({ slug: staticPageSlug, locale });

  // 如果找到静态页面，返回其元数据
  if (staticPage) {
    title = staticPage.title || '';
    description = staticPage.description || '';

    return {
      title,
      description,
      alternates: {
        canonical: canonicalUrl,
      },
    };
  }

  // 2. 静态页面未找到，尝试从 src/config/locale/messages/{locale}/pages/**/*.json 获取动态页面元数据

  // 动态页面 slug (使用 . 连接)
  const dynamicPageSlug = Array.isArray(slug) ? slug.join('.') : slug || '';

  const messageKey = `pages.${dynamicPageSlug}`;
  
  try {
    const t = await getTranslations({ locale, namespace: messageKey });

    // 如果存在元数据配置，则返回
    if (t.has('metadata')) {
      title = t.raw('metadata.title');
      description = t.raw('metadata.description');

      return {
        title,
        description,
        alternates: {
          canonical: canonicalUrl,
        },
      };
    }
  } catch (error) {
    // 如果翻译 key 不存在，捕获错误并继续，避免页面崩溃
  }

  // 3. 如果都没找到，返回通用元数据
  const tc = await getTranslations('common.metadata');

  title = tc('title');
  description = tc('description');

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function DynamicPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string[] }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  // 🛡️ 守卫逻辑：对于无效的文件请求（如 .json），直接返回 404
  const slugCheckStr = Array.isArray(slug) ? slug.join('.') : slug;
  if (!isValidSlug(slugCheckStr)) {
    notFound();
  }

  // 1. 尝试获取静态页面
  // content/pages/**/*.mdx

  const staticPageSlug = Array.isArray(slug) ? slug.join('/') : slug || '';

  // 获取静态页面内容
  const staticPage = await getLocalPage({ slug: staticPageSlug, locale });

  // 返回静态页面
  if (staticPage) {
    const Page = await getThemePage('static-page');
    return <Page locale={locale} post={staticPage} />;
  }

  // 2. 静态页面未找到
  // 尝试获取动态页面内容 src/config/locale/messages/{locale}/pages/**/*.json

  const dynamicPageSlug = Array.isArray(slug) ? slug.join('.') : slug || '';
  const messageKey = `pages.${dynamicPageSlug}`;

  try {
    const t = await getTranslations({ locale, namespace: messageKey });

    // 返回动态页面
    if (t.has('page')) {
      const Page = await getThemePage('dynamic-page');
      return <Page locale={locale} page={t.raw('page')} />;
    }
  } catch (error) {
    // 翻译 key 缺失，不做处理，继续向下执行到 404
  }

  // 3. 页面未找到，返回 404
  return notFound();
}