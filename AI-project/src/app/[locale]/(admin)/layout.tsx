import '@/config/style/admin-gentelella.css';

import { ReactNode } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { requireAdminAccess } from '@/core/rbac/permission';
import { LocaleDetector } from '@/shared/blocks/common';
import { DashboardLayout } from '@/shared/blocks/dashboard/layout';
import { getAllConfigs } from '@/shared/models/config';
import { getSignUser } from '@/shared/models/user';
import { getUserPermissions } from '@/shared/services/rbac';
import { Nav, NavItem } from '@/shared/types/blocks/common';
import { Sidebar as SidebarType } from '@/shared/types/blocks/dashboard';

function cloneSidebar(sidebar: SidebarType): SidebarType {
  // next-intl's t.raw(...) can return shared references; avoid cross-request mutation
  if (typeof structuredClone === 'function') {
    return structuredClone(sidebar);
  }
  return JSON.parse(JSON.stringify(sidebar)) as SidebarType;
}

function hasPermissionCode(permissionCodes: Set<string>, permissionCode: string) {
  if (!permissionCode) return true;
  if (permissionCodes.has('*') || permissionCodes.has(permissionCode)) return true;

  const parts = permissionCode.split('.');
  for (let i = parts.length - 1; i > 0; i--) {
    const wildcard = `${parts.slice(0, i).join('.')}.*`;
    if (permissionCodes.has(wildcard)) return true;
  }

  return false;
}

function isNavItemAllowed(
  item: NavItem,
  permissionCodes: Set<string>
): boolean {
  if (item.permission_code) {
    return hasPermissionCode(permissionCodes, item.permission_code);
  }
  if (item.permission_all && item.permission_all.length > 0) {
    return item.permission_all.every((code) =>
      hasPermissionCode(permissionCodes, code)
    );
  }
  if (item.permission_any && item.permission_any.length > 0) {
    return item.permission_any.some((code) =>
      hasPermissionCode(permissionCodes, code)
    );
  }
  return true;
}

function filterNavItemByPermission(
  item: NavItem,
  permissionCodes: Set<string>
): NavItem | null {
  const children = item.children
    ?.map((child) => filterNavItemByPermission(child, permissionCodes))
    .filter((child): child is NavItem => Boolean(child));

  const hasVisibleChildren = Boolean(children && children.length > 0);
  const allowed = isNavItemAllowed(item, permissionCodes);

  // Leaf item: require permission
  if (!hasVisibleChildren && !allowed) {
    return null;
  }

  // Parent item: keep if any child remains, even if it doesn't have explicit permission itself
  const next: NavItem = { ...item };
  if (children) next.children = children;
  return next;
}

function filterNavByPermission(nav: Nav, permissionCodes: Set<string>): Nav {
  const items = nav.items
    .map((item) => (item ? filterNavItemByPermission(item, permissionCodes) : null))
    .filter((item): item is NavItem => Boolean(item));
  return { ...nav, items };
}

/**
 * Admin layout to manage datas
 */
export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Check if user has admin access permission
  await requireAdminAccess({
    redirectUrl: `/admin/no-permission`,
    locale: locale || '',
  });

  const t = await getTranslations('admin');

  const sidebar: SidebarType = cloneSidebar(t.raw('sidebar'));

  const configs = await getAllConfigs();
  if (configs.app_name) {
    sidebar.header!.brand!.title = configs.app_name;
    sidebar.header!.brand!.logo!.alt = configs.app_name;
  }
  if (configs.app_description) {
    sidebar.header!.brand!.description = configs.app_description;
  }
  if (configs.app_logo) {
    sidebar.header!.brand!.logo!.src = configs.app_logo;
  }
  if (configs.version) {
    sidebar.header!.version = configs.version;
  }

  const isLegacy = process.env.ADMIN_UI_LEGACY === 'true';

  // Filter sidebar items by current user's permissions (UI convenience; server guards still enforce access)
  try {
    const user = await getSignUser();
    if (user) {
      const permissions = await getUserPermissions(user.id);
      const permissionCodes = new Set(permissions.map((p) => p.code));

      if (sidebar.main_navs) {
        sidebar.main_navs = sidebar.main_navs
          .map((nav) => filterNavByPermission(nav, permissionCodes))
          .filter((nav) => nav.items.length > 0);
      }
      if (sidebar.bottom_nav) {
        sidebar.bottom_nav = filterNavByPermission(sidebar.bottom_nav, permissionCodes);
        if (sidebar.bottom_nav.items.length === 0) {
          sidebar.bottom_nav = undefined;
        }
      }
    }
  } catch (error) {
    // Fail closed-ish: keep only a safe minimal nav
    console.error('[Admin] Failed to filter sidebar by permissions:', error);
  }

  return (
    <div className={isLegacy ? undefined : 'admin-gentelella'}>
      <DashboardLayout sidebar={sidebar}>
        <LocaleDetector />
        {children}
      </DashboardLayout>
    </div>
  );
}
