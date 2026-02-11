import { getTranslations, setRequestLocale } from 'next-intl/server';
// ✅ 引入所有需要的操作符
import { and, eq, gt, inArray, isNull, or, sum } from 'drizzle-orm';
import { pgTable, text, integer, timestamp } from 'drizzle-orm/pg-core';

import { PERMISSIONS, requirePermission } from '@/core/rbac';
import { db } from '@/core/db'; 
import { Header, Main, MainHeader } from '@/shared/blocks/dashboard';
import { TableCard } from '@/shared/blocks/table';
import { Badge } from '@/shared/components/ui/badge';
import { getUsers, getUsersCount, User } from '@/shared/models/user';
import { getRolesByUserIds } from '@/shared/services/rbac';
import { Crumb, Search } from '@/shared/types/blocks/common';
import { type Table } from '@/shared/types/blocks/table';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface UserWithExtras extends User {
  _prefetchedRoles?: any[];
  _credits?: number;
}

const LocalCredit = pgTable('credit', {
  userId: text('user_id'), 
  remainingCredits: integer('remaining_credits'),
  status: text('status'),        
  expiresAt: timestamp('expires_at'), 
  deletedAt: timestamp('deleted_at'), 
});

async function fetchCreditsByUserIds(userIds: string[]): Promise<Record<string, number>> {
  if (!userIds || userIds.length === 0) return {};

  try {
    const now = new Date(); // 获取当前时间

    const result = await db()
      .select({
        userId: LocalCredit.userId,
        totalValue: sum(LocalCredit.remainingCredits),
      })
      .from(LocalCredit)
      .where(
        and(
          // 1. 基础条件
          inArray(LocalCredit.userId, userIds),
          eq(LocalCredit.status, 'active'),
          isNull(LocalCredit.deletedAt),
          
          // 2. 垃圾过滤 (只算 >0 的)
          gt(LocalCredit.remainingCredits, 0),

          // 3. 🔥 恢复时间限制 (严谨模式)
          // 只有 "未过期" 或 "永久有效(NULL)" 的积分才会被计算
          or(
            gt(LocalCredit.expiresAt, now), 
            isNull(LocalCredit.expiresAt)
          )
        )
      )
      .groupBy(LocalCredit.userId);

    const map: Record<string, number> = {};
    for (const row of result) {
      if (!row.userId) continue;
      map[row.userId] = Number(row.totalValue) || 0;
    }

    return map;

  } catch (error: any) {
    console.error(`[Admin] Credit Error:`, error);
    return {};
  }
}

export default async function AdminUsersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    page?: number;
    pageSize?: number;
    email?: string;
    verified?: string;
  }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  await requirePermission({
    code: PERMISSIONS.USERS_READ,
    redirectUrl: '/admin/no-permission',
    locale,
  });

  const t = await getTranslations('admin.users');

  const { page: pageNum, pageSize, email, verified } = await searchParams;
  const page = pageNum ? Number(pageNum) : 1;
  const limit = pageSize ? Number(pageSize) : 30;

  const emailVerified =
    verified === 'verified' ? true : verified === 'unverified' ? false : undefined;

  const [total, rawUsers] = await Promise.all([
    getUsersCount({ email, emailVerified }),
    getUsers({ email, emailVerified, page, limit }),
  ]);

  const userIds = rawUsers.map((u) => u.id);
  const [rolesByUserId, creditsByUserId] = await Promise.all([
    getRolesByUserIds(userIds).catch(() => ({} as Record<string, any[]>)),
    fetchCreditsByUserIds(userIds),
  ]);

  const users: UserWithExtras[] = rawUsers.map((user) => ({
    ...user,
    _prefetchedRoles: rolesByUserId[user.id] || [],
    _credits: creditsByUserId[user.id] || 0,
  }));

  const crumbs: Crumb[] = [
    { title: t('list.crumbs.admin'), url: '/admin' },
    { title: t('list.crumbs.users'), is_active: true },
  ];

  const search: Search = {
    name: 'email',
    title: t('list.search.email.title'),
    placeholder: t('list.search.email.placeholder'),
    value: email,
  };

  const table: Table = {
    columns: [
      { name: 'id', title: t('list.columns.id'), type: 'copy' },
      { name: 'name', title: t('list.columns.name') },
      { name: 'image', title: t('list.columns.avatar'), type: 'image', placeholder: '-' },
      { name: 'email', title: t('list.columns.email'), type: 'copy' },
      {
        name: 'roles',
        title: t('list.columns.roles'),
        callback: (item: UserWithExtras) => {
          const roles = item._prefetchedRoles || [];
          if (roles.length === 0) return <span>-</span>;
          return (
            <div className="flex flex-wrap gap-1">
              {roles.map((role: any) => (
                <Badge key={role.id} variant="outline" className="text-xs">{role.title || role.name}</Badge>
              ))}
            </div>
          );
        },
      },
      {
        name: 'emailVerified',
        title: t('list.columns.email_verified'),
        type: 'label', 
        placeholder: '-',
        callback: (item: User) => (
          item.emailVerified 
            ? <span className="text-green-600 font-bold">Verified</span> 
            : <span className="text-gray-400">Unverified</span>
        )
      },
      {
        name: 'remainingCredits',
        title: t('list.columns.credits'),
        callback: (item: UserWithExtras) => {
          const val = item._credits || 0;
          return (
            <div className={val > 0 ? "text-green-600 font-bold text-lg" : "text-gray-500"}>
              {val.toLocaleString()}
            </div>
          );
        },
      },
      { name: 'createdAt', title: t('list.columns.created_at'), type: 'time' },
      {
        name: 'actions',
        title: t('list.columns.actions'),
        type: 'dropdown',
        callback: (item: User) => [
          { name: 'edit', title: t('list.actions.edit'), icon: 'RiEditLine', url: `/admin/users/${item.id}/edit` },
          { name: 'edit-roles', title: t('list.actions.edit_roles'), icon: 'RiShieldUserLine', url: `/admin/users/${item.id}/edit-roles` },
        ],
      },
    ],
    data: users, 
    pagination: { total, page, limit },
  };

  return (
    <>
      <Header crumbs={crumbs} />
      <Main>
        <MainHeader
          title={t('list.title')}
          description={t('list.description')}
          search={search}
          filters={[
            {
              name: 'verified',
              title: t('list.filters.email_verified.title'),
              value: verified,
              options: [
                { value: '__all__', label: t('list.filters.email_verified.options.all') },
                { value: 'verified', label: t('list.filters.email_verified.options.verified') },
                { value: 'unverified', label: t('list.filters.email_verified.options.unverified') },
              ],
            },
          ]}
        />
        <TableCard table={table} />
      </Main>
    </>
  );
}
