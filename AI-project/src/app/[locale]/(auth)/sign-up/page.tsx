import { getTranslations } from 'next-intl/server';

import { redirect } from '@/core/i18n/navigation';
import { envConfigs } from '@/config';
import { defaultLocale } from '@/config/locale';
import { SignUp } from '@/shared/blocks/sign/sign-up';
import { getPublicConfigs } from '@/shared/models/config';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const t = await getTranslations('common');

  return {
    title: `${t('sign.sign_up_title')} - ${t('metadata.title')}`,
    alternates: {
      canonical:
        locale !== defaultLocale
          ? `${envConfigs.app_url}/${locale}/sign-up`
          : `${envConfigs.app_url}/sign-up`,
    },
  };
}

export default async function SignUpPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { locale } = await params;
  const { callbackUrl } = await searchParams;

  const configs = await getPublicConfigs();

  if (configs.auth_google_only === 'true') {
    redirect({ href: '/sign-in', locale });
  }

  return <SignUp configs={configs} callbackUrl={callbackUrl || '/'} />;
}
