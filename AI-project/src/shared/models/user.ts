import { headers } from 'next/headers';
import { cache } from 'react';
import { and, count, desc, eq, inArray } from 'drizzle-orm';

import { getAuth } from '@/core/auth';
import { db } from '@/core/db';
import { user } from '@/config/db/schema';
import { Permission, Role } from '../services/rbac';

// ❌ 保持现状：不要在这里 import credit.ts

export type User = typeof user.$inferSelect & {
  isAdmin?: boolean;
  roles?: Role[];
  permissions?: Permission[];
  // 🔥🔥🔥 修复点：加回 credits 类型定义，解决 GlobalNavigation 报错
  // 使用 loose type (number | any) 以兼容不同的数据结构，且不引入外部依赖
  credits?: number | { remainingCredits: number } | any;
};

export type NewUser = typeof user.$inferInsert;
export type UpdateUser = Partial<Omit<NewUser, 'id' | 'createdAt' | 'email'>>;

export async function updateUser(userId: string, updatedUser: UpdateUser) {
  const [result] = await db()
    .update(user)
    .set(updatedUser)
    .where(eq(user.id, userId))
    .returning();
  return result;
}

export async function findUserById(userId: string) {
  const [result] = await db().select().from(user).where(eq(user.id, userId));
  return result;
}

export async function getUsers({
  page = 1,
  limit = 30,
  email,
  emailVerified,
}: {
  email?: string;
  page?: number;
  limit?: number;
  emailVerified?: boolean;
} = {}): Promise<User[]> {
  const conditions = [];
  if (email) conditions.push(eq(user.email, email));
  if (typeof emailVerified === 'boolean') {
    conditions.push(eq(user.emailVerified, emailVerified));
  }

  const result = await db()
    .select()
    .from(user)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(user.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);

  return result;
}

export async function getUsersCount({
  email,
  emailVerified,
}: {
  email?: string;
  emailVerified?: boolean;
}) {
  const conditions = [];
  if (email) conditions.push(eq(user.email, email));
  if (typeof emailVerified === 'boolean') {
    conditions.push(eq(user.emailVerified, emailVerified));
  }

  const [result] = await db()
    .select({ count: count() })
    .from(user)
    .where(conditions.length > 0 ? and(...conditions) : undefined);
  return result?.count || 0;
}

export async function getUserByUserIds(userIds: string[]) {
  const result = await db()
    .select()
    .from(user)
    .where(inArray(user.id, userIds));
  return result;
}

export async function getUserInfo() {
  const signUser = await getSignUser();
  return signUser;
}

const getSignUserCached = cache(async () => {
  const auth = await getAuth();

  const timeoutMs = (() => {
    const raw = process.env.AUTH_SESSION_TIMEOUT_MS;
    if (raw) {
      const parsed = Number(raw);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }

    return process.env.NODE_ENV !== 'production' ? 1500 : 8000;
  })();

  let timer: NodeJS.Timeout | null = null;
  try {
    const session = await Promise.race([
      auth.api.getSession({
        headers: await headers(),
      }),
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), timeoutMs);
      }),
    ]);

    return session?.user;
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
});

export async function getSignUser() {
  return getSignUserCached();
}

export async function appendUserToResult(result: any) {
  if (!result || !result.length) {
    return result;
  }
  const userIds = result.map((item: any) => item.userId);
  const users = await getUserByUserIds(userIds);
  result = result.map((item: any) => {
    const user = users.find((user: any) => user.id === item.userId);
    return { ...item, user };
  });
  return result;
}
