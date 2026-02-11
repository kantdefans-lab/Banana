'use client';

import { Bell } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';

export function AdminNotifications() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
          aria-label="Notifications"
        >
          <Bell className="size-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[320px]">
        <DropdownMenuLabel className="px-3 py-2 text-sm font-semibold">
          Notifications
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/admin/chats" className="flex w-full items-center">
            Go to Chats
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/admin/payments" className="flex w-full items-center">
            Go to Payments
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/admin/ai-tasks" className="flex w-full items-center">
            Go to AI Tasks
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-default text-muted-foreground">
          No new notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
