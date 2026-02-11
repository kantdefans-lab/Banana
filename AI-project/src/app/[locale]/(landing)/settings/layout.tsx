import { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';

import { ConsoleLayout } from '@/shared/blocks/console/layout';

export default async function SettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const t = await getTranslations('settings.sidebar');

  // settings title
  const title = t('title');

  // settings nav
  const rawNav = t.raw('nav');
  const rawTopNav = t.raw('top_nav');

  // 🔥 定义一个过滤函数：同时过滤掉 'Activity' 和 'API Keys'
  // 这里的 item.url 对应的是链接地址，item.title 对应的是显示的文字
  const filterMenuItems = (items: any[]) => {
    if (!Array.isArray(items)) return [];
    
    return items.filter((item: any) => {
      const url = item.url?.toLowerCase() || '';
      const title = item.title || '';
      
      // 排除 Activity 相关的
      const isActivity = url.includes('activity') || title === 'Activity';
      
      // 排除 API Keys 相关的
      const isApiKeys = url.includes('apikeys') || title === 'API Keys';
      
      // 只有既不是 Activity 也不是 API Keys 的才保留
      return !isActivity && !isApiKeys;
    });
  };

  // 1. 处理 nav (左侧菜单)
  const nav = {
    ...rawNav,
    items: filterMenuItems(rawNav?.items)
  };

  // 2. 处理 topNav (如果有顶部菜单)
  const topNav = {
    ...rawTopNav,
    items: filterMenuItems(rawTopNav?.items)
  };

  return (
    <ConsoleLayout
      title={title}
      nav={nav}
      topNav={topNav}
      className="py-16 md:py-20"
    >
      {children}
    </ConsoleLayout>
  );
}