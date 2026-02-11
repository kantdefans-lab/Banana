import { Link } from '@/core/i18n/navigation';
import {
  SidebarHeader as SidebarHeaderComponent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/shared/components/ui/sidebar';
import { SidebarHeader as SidebarHeaderType } from '@/shared/types/blocks/dashboard';

export function SidebarHeader({ header }: { header: SidebarHeaderType }) {
  const { open } = useSidebar();
  return (
    <SidebarHeaderComponent className="mb-1">
      <SidebarMenu>
        <SidebarMenuItem className="flex items-center justify-between gap-2">
          {header.brand && (
            <SidebarMenuButton asChild className="h-auto items-start overflow-visible py-2">
              <Link
                href={header.brand.url || ''}
                className="flex items-center gap-2"
                title={header.brand.title || ''}
              >
                {header.brand.logo?.src ? (
                  <img
                    src={header.brand.logo.src}
                    alt={header.brand.logo.alt || header.brand.title || ''}
                    className="h-8 w-8 shrink-0 rounded-md"
                  />
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-sidebar-accent text-sidebar-accent-foreground text-sm font-semibold">
                    {(header.brand.title || 'A').slice(0, 1)}
                  </div>
                )}
                {open && (
                  <div className="flex min-w-0 flex-1 flex-col leading-tight">
                    <span className="text-sm font-semibold leading-tight break-words whitespace-normal">
                      {header.brand.title}
                    </span>
                    {header.version && (
                      <span className="text-xs text-muted-foreground break-words whitespace-normal">
                        v{header.version}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            </SidebarMenuButton>
          )}
          <div className="flex-1"></div>
          {header.show_trigger && <SidebarTrigger />}
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeaderComponent>
  );
}
