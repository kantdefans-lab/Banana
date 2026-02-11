// src/app/[locale]/pricing/page.tsx (或者对应的路径)
export const dynamic = 'force-dynamic';
import { setRequestLocale } from 'next-intl/server';

import { getMetadata } from '@/shared/lib/seo';
import { getCurrentSubscription } from '@/shared/models/subscription';
import { getUserInfo } from '@/shared/models/user';
// 引入新创建的组件
import PricingUI from '@/components/pricing/PricingUI'; 

export const generateMetadata = getMetadata({
  metadataKey: 'pricing.metadata',
  canonicalUrl: '/pricing',
});

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // 获取当前订阅信息
  let currentSubscription;
  let user = null;
  try {
    user = await getUserInfo();
    if (user) {
      currentSubscription = await getCurrentSubscription(user.id);
    }
  } catch (error) {
    console.log('getting current subscription failed:', error);
  }

  // 直接渲染自定义的 UI 组件，而不是通用的 DynamicPage
  return <PricingUI user={user} currentSubscription={currentSubscription} />;
}