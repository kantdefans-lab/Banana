import { unstable_cache } from 'next/cache';
import { and, count, desc, eq, gte, inArray, sum } from 'drizzle-orm';

import { envConfigs } from '@/config';
import { aiTask, order, subscription, user } from '@/config/db/schema';
import { db } from '@/core/db';
import { AITaskStatus } from '@/extensions/ai';
import { OrderStatus } from '@/shared/models/order';
import { SubscriptionStatus } from '@/shared/models/subscription';
import { buildDayBuckets, DayBucket } from '@/shared/lib/metrics/day-buckets';

export type RecentUser = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
};

export type RecentPayment = {
  orderNo: string;
  amount: number;
  currency: string;
  userEmail: string | null;
  createdAt: Date;
  paymentProvider: string | null;
};

export type RecentAITask = {
  id: string;
  mediaType: string;
  status: string;
  provider: string;
  model: string;
  createdAt: Date;
};

export type AdminOverviewData = {
  metrics: {
    totalUsers: number;
    newUsers14d: number;
    paidOrders14d: number;
    revenue14dCents: number;
    activeSubscriptions: number;
    aiTasks14d: number;
    aiSuccess14d: number;
  };
  trends: {
    revenue14d: DayBucket[];
    newUsers14d: DayBucket[];
  };
  recent: {
    users: RecentUser[];
    payments: RecentPayment[];
    aiTasks: RecentAITask[];
  };
  diagnostics?: {
    dbConfigured: boolean;
    dbHost?: string;
    dbName?: string;
    timeoutMs: number;
    errors: string[];
  };
};

async function fetchAdminOverviewData({
  days = 14,
  limit = 10,
}: {
  days?: number;
  limit?: number;
} = {}): Promise<AdminOverviewData> {
  const empty: AdminOverviewData = {
    metrics: {
      totalUsers: 0,
      newUsers14d: 0,
      paidOrders14d: 0,
      revenue14dCents: 0,
      activeSubscriptions: 0,
      aiTasks14d: 0,
      aiSuccess14d: 0,
    },
    trends: {
      revenue14d: [],
      newUsers14d: [],
    },
    recent: {
      users: [],
      payments: [],
      aiTasks: [],
    },
  };

  if (!envConfigs.database_url) {
    return {
      ...empty,
      diagnostics: {
        dbConfigured: false,
        timeoutMs: process.env.NODE_ENV !== 'production' ? 6000 : 8000,
        errors: ['DATABASE_URL is not set'],
      },
    };
  }

  const database = db();
  const now = new Date();
  const start = new Date(now);
  start.setUTCDate(now.getUTCDate() - (days - 1));
  start.setUTCHours(0, 0, 0, 0);

  try {
    const timeoutMs = (() => {
      const raw = process.env.ADMIN_DB_TIMEOUT_MS;
      if (raw) {
        const parsed = Number(raw);
        if (Number.isFinite(parsed) && parsed > 0) return parsed;
      }

      return process.env.NODE_ENV !== 'production' ? 6000 : 8000;
    })();

    const errors: string[] = [];
    async function safeQuery<T>(
      label: string,
      query: Promise<T>,
      fallback: T
    ): Promise<T> {
      let timer: NodeJS.Timeout | null = null;
      try {
        const result = await Promise.race([
          query,
          new Promise<T>((resolve) => {
            timer = setTimeout(() => resolve(fallback), timeoutMs);
          }),
        ]);
        if (result === fallback) {
          const msg = `${label} timed out`;
          console.warn(`[Admin Overview] ${msg}`);
          errors.push(msg);
        }
        return result;
      } catch (error) {
        const msg = `${label} failed`;
        console.error(`[Admin Overview] ${msg}:`, error);
        errors.push(msg);
        return fallback;
      } finally {
        if (timer) clearTimeout(timer);
      }
    }

    const [
      totalUsersRow,
      newUsersRow,
      paidOrdersRow,
      activeSubscriptionsRow,
      aiTasksRow,
      aiSuccessRow,
      recentUsers,
      recentPayments,
      recentAITasks,
      usersInWindow,
      paidOrdersInWindow,
    ] = await Promise.all([
      safeQuery('total_users', database.select({ count: count() }).from(user), [
        { count: 0 },
      ]),
      safeQuery(
        'new_users_14d',
        database
          .select({ count: count() })
          .from(user)
          .where(gte(user.createdAt, start)),
        [{ count: 0 }]
      ),
      safeQuery(
        'paid_orders_14d',
        database
          .select({ count: count(), total: sum(order.amount) })
          .from(order)
          .where(
            and(eq(order.status, OrderStatus.PAID), gte(order.createdAt, start))
          ),
        [{ count: 0, total: '0' }]
      ),
      safeQuery(
        'active_subscriptions',
        database
          .select({ count: count() })
          .from(subscription)
          .where(
            inArray(subscription.status, [
              SubscriptionStatus.ACTIVE,
              SubscriptionStatus.PENDING_CANCEL,
              SubscriptionStatus.TRIALING,
            ])
          ),
        [{ count: 0 }]
      ),
      safeQuery(
        'ai_tasks_14d',
        database
          .select({ count: count() })
          .from(aiTask)
          .where(gte(aiTask.createdAt, start)),
        [{ count: 0 }]
      ),
      safeQuery(
        'ai_success_14d',
        database
          .select({ count: count() })
          .from(aiTask)
          .where(
            and(
              gte(aiTask.createdAt, start),
              eq(aiTask.status, AITaskStatus.SUCCESS)
            )
          ),
        [{ count: 0 }]
      ),
      safeQuery(
        'recent_users',
        database
          .select({
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
          })
          .from(user)
          .orderBy(desc(user.createdAt))
          .limit(limit),
        []
      ),
      safeQuery(
        'recent_payments',
        database
          .select({
            orderNo: order.orderNo,
            amount: order.amount,
            currency: order.currency,
            userEmail: order.userEmail,
            createdAt: order.createdAt,
            paymentProvider: order.paymentProvider,
          })
          .from(order)
          .where(eq(order.status, OrderStatus.PAID))
          .orderBy(desc(order.createdAt))
          .limit(limit),
        []
      ),
      safeQuery(
        'recent_ai_tasks',
        database
          .select({
            id: aiTask.id,
            mediaType: aiTask.mediaType,
            status: aiTask.status,
            provider: aiTask.provider,
            model: aiTask.model,
            createdAt: aiTask.createdAt,
          })
          .from(aiTask)
          .orderBy(desc(aiTask.createdAt))
          .limit(limit),
        []
      ),
      safeQuery(
        'users_trend',
        database
          .select({ createdAt: user.createdAt })
          .from(user)
          .where(gte(user.createdAt, start)),
        []
      ),
      safeQuery(
        'revenue_trend',
        database
          .select({ createdAt: order.createdAt, amount: order.amount })
          .from(order)
          .where(
            and(eq(order.status, OrderStatus.PAID), gte(order.createdAt, start))
          ),
        []
      ),
    ]);

    const totalUsers = Number(totalUsersRow?.[0]?.count) || 0;
    const newUsers14d = Number(newUsersRow?.[0]?.count) || 0;
    const paidOrders14d = Number(paidOrdersRow?.[0]?.count) || 0;
    const revenue14dCents = Number(paidOrdersRow?.[0]?.total) || 0;
    const activeSubscriptions = Number(activeSubscriptionsRow?.[0]?.count) || 0;
    const aiTasks14d = Number(aiTasksRow?.[0]?.count) || 0;
    const aiSuccess14d = Number(aiSuccessRow?.[0]?.count) || 0;

    const newUsersTrend = buildDayBuckets({
      start,
      days,
      items: usersInWindow,
      getDate: (item) => item.createdAt,
      getValue: () => 1,
    });

    const revenueTrend = buildDayBuckets({
      start,
      days,
      items: paidOrdersInWindow,
      getDate: (item) => item.createdAt,
      getValue: (item) => Number(item.amount) || 0,
    });

    const safeUrl = (() => {
      try {
        return new URL(envConfigs.database_url);
      } catch {
        return null;
      }
    })();

    return {
      metrics: {
        totalUsers,
        newUsers14d,
        paidOrders14d,
        revenue14dCents,
        activeSubscriptions,
        aiTasks14d,
        aiSuccess14d,
      },
      trends: {
        revenue14d: revenueTrend,
        newUsers14d: newUsersTrend,
      },
      recent: {
        users: recentUsers,
        payments: recentPayments,
        aiTasks: recentAITasks,
      },
      diagnostics: {
        dbConfigured: true,
        dbHost: safeUrl?.host,
        dbName: safeUrl?.pathname?.replace('/', ''),
        timeoutMs,
        errors,
      },
    };
  } catch (error) {
    console.error('[Admin Overview] Failed to load metrics:', error);
    const safeUrl = (() => {
      try {
        return new URL(envConfigs.database_url);
      } catch {
        return null;
      }
    })();

    return {
      ...empty,
      diagnostics: {
        dbConfigured: true,
        dbHost: safeUrl?.host,
        dbName: safeUrl?.pathname?.replace('/', ''),
        timeoutMs: process.env.NODE_ENV !== 'production' ? 6000 : 8000,
        errors: ['overview_failed'],
      },
    };
  }
}

const getAdminOverviewDataCached = unstable_cache(
  async (days: number, limit: number) =>
    fetchAdminOverviewData({ days, limit }),
  ['admin-overview'],
  { revalidate: 30 }
);

export async function getAdminOverviewData({
  days = 14,
  limit = 10,
}: {
  days?: number;
  limit?: number;
} = {}): Promise<AdminOverviewData> {
  return getAdminOverviewDataCached(days, limit);
}
