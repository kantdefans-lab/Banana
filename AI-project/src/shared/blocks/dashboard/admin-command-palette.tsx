'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Brain,
  CreditCard,
  FileText,
  Key,
  LayoutDashboard,
  MessageCircle,
  Search,
  Settings,
  ShieldCheck,
  Tags,
  Users,
} from 'lucide-react';

import { useRouter } from '@/core/i18n/navigation';
import { Button } from '@/shared/components/ui/button';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/shared/components/ui/command';

type CommandLink = {
  title: string;
  href: string;
  icon: React.ReactNode;
  keywords?: string[];
};

export function AdminCommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const groups = useMemo(() => {
    const system: CommandLink[] = [
      { title: 'Overview', href: '/admin/overview', icon: <LayoutDashboard /> },
      { title: 'Users', href: '/admin/users', icon: <Users /> },
      { title: 'Roles', href: '/admin/roles', icon: <Users /> },
      { title: 'Permissions', href: '/admin/permissions', icon: <ShieldCheck /> },
      { title: 'Payments', href: '/admin/payments', icon: <CreditCard /> },
      { title: 'Subscriptions', href: '/admin/subscriptions', icon: <BarChart3 /> },
      { title: 'Credits', href: '/admin/credits', icon: <BarChart3 /> },
      { title: 'Categories', href: '/admin/categories', icon: <Tags /> },
      { title: 'Posts', href: '/admin/posts', icon: <FileText /> },
    ];

    const business: CommandLink[] = [
      { title: 'AI Tasks', href: '/admin/ai-tasks', icon: <Brain /> },
      { title: 'AI Chats', href: '/admin/chats', icon: <MessageCircle /> },
    ];

    const settings: CommandLink[] = [
      { title: 'Settings', href: '/admin/settings/general', icon: <Settings /> },
      { title: 'API Keys', href: '/admin/apikeys', icon: <Key /> },
    ];

    return { system, business, settings };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="hidden h-9 w-[260px] justify-between gap-3 border-sidebar-border bg-background/60 text-muted-foreground hover:bg-background md:flex"
      >
        <span className="truncate text-left">Search admin…</span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <kbd className="rounded border px-1.5 py-0.5">⌘</kbd>
          <kbd className="rounded border px-1.5 py-0.5">K</kbd>
        </span>
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="h-9 w-9 md:hidden"
        aria-label="Open command palette"
      >
        <Search className="size-4" />
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen} showCloseButton>
        <CommandInput placeholder="Search pages and actions…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="System">
            {groups.system.map((item) => (
              <CommandItem
                key={item.href}
                value={[item.title, item.href].join(' ')}
                onSelect={() => go(item.href)}
              >
                {item.icon}
                <span>{item.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Business">
            {groups.business.map((item) => (
              <CommandItem
                key={item.href}
                value={[item.title, item.href].join(' ')}
                onSelect={() => go(item.href)}
              >
                {item.icon}
                <span>{item.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Settings">
            {groups.settings.map((item) => (
              <CommandItem
                key={item.href}
                value={[item.title, item.href].join(' ')}
                onSelect={() => go(item.href)}
              >
                {item.icon}
                <span>{item.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
