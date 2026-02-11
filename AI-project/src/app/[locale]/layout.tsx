// ✅ 只保留 global.css，去掉 fumadocs-ui/css/preset.css
import '@/config/style/global.css';

import type { Metadata } from 'next';
import { JetBrains_Mono, Merriweather, Noto_Sans_Mono, Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import NextTopLoader from 'nextjs-toploader';
import { cookies } from 'next/headers';

import { envConfigs } from '@/config';
import { locales } from '@/config/locale';
import { ANALYTICS_CONSENT_COOKIE } from '@/shared/constants/consent';
import { getAdsService } from '@/shared/services/ads';
import { getAffiliateService } from '@/shared/services/affiliate';
import { getAnalyticsService } from '@/shared/services/analytics';
import { getCustomerService } from '@/shared/services/customer_service';
import { AppContextProvider } from '@/shared/contexts/app';
import CookieConsentBanner from '@/components/CookieConsentBanner';

const inter = Inter({ subsets: ['latin'] });
const notoSansMono = Noto_Sans_Mono({
  subsets: ['latin'],
  variable: '--font-sans',
});
const merriweather = Merriweather({
  subsets: ['latin'],
  weight: ['300', '400', '700', '900'],
  variable: '--font-serif',
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'AI Image Generator',
  description: 'Create stunning AI art in just 5 seconds',
};

export function generateStaticParams() {
  return [{ locale: 'zh' }, { locale: 'en' }];
}

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages = await getMessages({ locale });

  const isProduction = process.env.NODE_ENV === 'production';
  const isDebug = process.env.NEXT_PUBLIC_DEBUG === 'true';
  const appUrl = envConfigs.app_url || '';
  const cookieStore = await cookies();
  const consentCookieValue = cookieStore.get(ANALYTICS_CONSENT_COOKIE)?.value;
  const analyticsConsent =
    consentCookieValue === 'granted' || consentCookieValue === 'denied'
      ? consentCookieValue
      : null;
  const shouldLoadAnalytics = (isProduction || isDebug) && analyticsConsent === 'granted';

  let adsMetaTags = null, adsHeadScripts = null, adsBodyScripts = null;
  let analyticsMetaTags = null, analyticsHeadScripts = null, analyticsBodyScripts = null;
  let affiliateMetaTags = null, affiliateHeadScripts = null, affiliateBodyScripts = null;
  let customerServiceMetaTags = null, customerServiceHeadScripts = null, customerServiceBodyScripts = null;

  if (isProduction || isDebug) {
    const [ads, affiliate, customer] = await Promise.all([
      getAdsService(),
      getAffiliateService(),
      getCustomerService(),
    ]);

    [adsMetaTags, adsHeadScripts, adsBodyScripts] = [ads.getMetaTags(), ads.getHeadScripts(), ads.getBodyScripts()];
    [affiliateMetaTags, affiliateHeadScripts, affiliateBodyScripts] = [affiliate.getMetaTags(), affiliate.getHeadScripts(), affiliate.getBodyScripts()];
    [customerServiceMetaTags, customerServiceHeadScripts, customerServiceBodyScripts] = [customer.getMetaTags(), customer.getHeadScripts(), customer.getBodyScripts()];

    if (shouldLoadAnalytics) {
      const analytics = await getAnalyticsService();
      [analyticsMetaTags, analyticsHeadScripts, analyticsBodyScripts] = [analytics.getMetaTags(), analytics.getHeadScripts(), analytics.getBodyScripts()];
    }
  }

  return (
    <html
      lang={locale}
      className={`scroll-smooth ${notoSansMono.variable} ${merriweather.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        
        

        {locales?.map((loc) => (
          <link
            key={loc}
            rel="alternate"
            hrefLang={loc}
            href={`${appUrl}${loc === 'en' ? '' : `/${loc}`}`}
          />
        ))}

        {adsMetaTags}{adsHeadScripts}
        {analyticsMetaTags}{analyticsHeadScripts}
        {affiliateMetaTags}{affiliateHeadScripts}
        {customerServiceMetaTags}{customerServiceHeadScripts}

      </head>
      
      <body className={`${inter.className} antialiased overflow-x-hidden`} suppressHydrationWarning>
        <NextTopLoader color="#6466F1" initialPosition={0.08} crawlSpeed={200} height={3} showSpinner={true} />

        <NextIntlClientProvider messages={messages} locale={locale}>
          <AppContextProvider>
            <CookieConsentBanner initialConsent={analyticsConsent} />
            {children}
          </AppContextProvider>
        </NextIntlClientProvider>

        {adsBodyScripts}
        {analyticsBodyScripts}
        {affiliateBodyScripts}
        {customerServiceBodyScripts}
      </body>
    </html>
  );
}
