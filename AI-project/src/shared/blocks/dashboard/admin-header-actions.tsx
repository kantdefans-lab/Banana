'use client';

import { AdminNotifications } from './admin-notifications';
import { AdminUserMenu } from './admin-user-menu';

export function AdminHeaderActions() {
  return (
    <div className="flex items-center gap-2">
      <AdminNotifications />
      <AdminUserMenu />
    </div>
  );
}
