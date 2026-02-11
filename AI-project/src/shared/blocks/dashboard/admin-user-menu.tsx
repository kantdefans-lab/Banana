'use client';

import { LogOut, User } from 'lucide-react';

import { signOut } from '@/core/auth/client';
import { Link, useRouter } from '@/core/i18n/navigation';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/shared/components/ui/avatar';
import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { useAppContext } from '@/shared/contexts/app';

export function AdminUserMenu() {
  const { user } = useAppContext();
  const router = useRouter();

  const displayName = user?.name || user?.email || 'Admin';
  const displayInitial = displayName.charAt(0).toUpperCase();

  const onSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="h-9 gap-2 px-2"
          aria-label="User menu"
        >
          <Avatar className="h-7 w-7 rounded-md">
            <AvatarImage src={user?.image || ''} alt={displayName} />
            <AvatarFallback className="rounded-md">
              {displayInitial}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-[220px]">
        <DropdownMenuItem asChild>
          <Link
            href="/settings/profile"
            target="_blank"
            className="flex w-full items-center gap-2"
          >
            <User className="size-4" />
            Profile
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={onSignOut}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
