import { getTranslations, setRequestLocale } from 'next-intl/server';
import { DollarSign, Sparkles, UserRound } from 'lucide-react';

import { Header, Main, MainHeader } from '@/shared/blocks/dashboard';
import {
  Card,
  CardContent,
  CardHeader as CardHeaderComponent,
  CardTitle,
} from '@/shared/components/ui/card';
import { getAdminOverviewData } from '@/shared/models/admin-overview';
import { Crumb } from '@/shared/types/blocks/common';

import { OverviewCharts } from './overview-charts';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function formatDate(locale: string, input: Date | string | number | null | undefined) {
  if (!input) return '-';
  const date = input instanceof Date ? input : new Date(input);
  if (!Number.isFinite(date.getTime())) return '-';
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default async function AdminOverviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('admin.overview');
  const data = await getAdminOverviewData();

  const numberFormatter = new Intl.NumberFormat(locale);
  const currency = data.recent.payments[0]?.currency || 'USD';
  const currencyFormatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  });

  const revenue14d = data.metrics.revenue14dCents / 100;
  const aiSuccessRate =
    data.metrics.aiTasks14d > 0
      ? (data.metrics.aiSuccess14d / data.metrics.aiTasks14d) * 100
      : 0;

  const crumbs: Crumb[] = [
    { title: t('crumbs.admin'), url: '/admin' },
    { title: t('crumbs.overview'), is_active: true },
  ];

  const revenueChart = data.trends.revenue14d.map((item) => ({
    date: item.date,
    revenue: Number((item.value / 100).toFixed(2)),
  }));

  const newUsersChart = data.trends.newUsers14d.map((item) => ({
    date: item.date,
    users: item.value,
  }));

  return (
    <>
      <Header crumbs={crumbs} />
      <Main>
        <MainHeader title={t('title')} description={t('description')} />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          <Card>
            <CardContent className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm text-muted-foreground">
                  {t('cards.total_users')}
                </div>
                <div className="mt-2 text-2xl font-semibold">
                  {numberFormatter.format(data.metrics.totalUsers)}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {t('cards.new_users_14d')}:{' '}
                  {numberFormatter.format(data.metrics.newUsers14d)}
                </div>
              </div>
              <div className="rounded-lg bg-sidebar-accent p-2 text-sidebar-accent-foreground">
                <UserRound className="size-4" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm text-muted-foreground">
                  {t('cards.revenue_14d')}
                </div>
                <div className="mt-2 text-2xl font-semibold">
                  {currencyFormatter.format(revenue14d)}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {t('cards.paid_orders_14d')}:{' '}
                  {numberFormatter.format(data.metrics.paidOrders14d)}
                </div>
              </div>
              <div className="rounded-lg bg-sidebar-accent p-2 text-sidebar-accent-foreground">
                <DollarSign className="size-4" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm text-muted-foreground">
                  {t('cards.active_subscriptions')}
                </div>
                <div className="mt-2 text-2xl font-semibold">
                  {numberFormatter.format(data.metrics.activeSubscriptions)}
                </div>
              </div>
              <div className="rounded-lg bg-sidebar-accent p-2 text-sidebar-accent-foreground">
                <Sparkles className="size-4" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                {t('cards.new_users_14d')}
              </div>
              <div className="mt-2 text-2xl font-semibold">
                {numberFormatter.format(data.metrics.newUsers14d)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                {t('cards.paid_orders_14d')}
              </div>
              <div className="mt-2 text-2xl font-semibold">
                {numberFormatter.format(data.metrics.paidOrders14d)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                {t('cards.ai_tasks_14d')}
              </div>
              <div className="mt-2 text-2xl font-semibold">
                {numberFormatter.format(data.metrics.aiTasks14d)}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {t('cards.ai_success_rate_14d')}: {aiSuccessRate.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeaderComponent className="border-b">
              <CardTitle>{t('charts.title')}</CardTitle>
            </CardHeaderComponent>
            <CardContent>
              <OverviewCharts
                revenue={revenueChart}
                newUsers={newUsersChart}
                revenueLabel={t('charts.revenue_14d')}
                newUsersLabel={t('charts.new_users_14d')}
              />
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Card>
            <CardHeaderComponent className="border-b">
              <CardTitle className="text-sm">{t('recent.users')}</CardTitle>
            </CardHeaderComponent>
            <CardContent className="space-y-3">
              {data.recent.users.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  {t('recent.empty')}
                </div>
              )}
              {data.recent.users.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{item.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.email}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(locale, item.createdAt)}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeaderComponent className="border-b">
              <CardTitle className="text-sm">{t('recent.payments')}</CardTitle>
            </CardHeaderComponent>
            <CardContent className="space-y-3">
              {data.recent.payments.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  {t('recent.empty')}
                </div>
              )}
              {data.recent.payments.map((item) => (
                <div key={item.orderNo} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{item.orderNo}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.userEmail || '-'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {new Intl.NumberFormat(locale, {
                        style: 'currency',
                        currency: item.currency || currency,
                        maximumFractionDigits: 0,
                      }).format(item.amount / 100)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(locale, item.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeaderComponent className="border-b">
              <CardTitle className="text-sm">{t('recent.ai_tasks')}</CardTitle>
            </CardHeaderComponent>
            <CardContent className="space-y-3">
              {data.recent.aiTasks.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  {t('recent.empty')}
                </div>
              )}
              {data.recent.aiTasks.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">
                      {item.provider}/{item.model}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.mediaType} · {item.status}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(locale, item.createdAt)}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  );
}
