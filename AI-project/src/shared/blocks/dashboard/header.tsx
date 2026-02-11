import { Fragment } from 'react';

import { Link } from '@/core/i18n/navigation';
import {
  LocaleSelector,
  SmartIcon,
  ThemeToggler,
} from '@/shared/blocks/common';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/shared/components/ui/breadcrumb';
import { Button } from '@/shared/components/ui/button';
import { Separator } from '@/shared/components/ui/separator';
import { SidebarTrigger } from '@/shared/components/ui/sidebar';
import { Button as ButtonType, Crumb } from '@/shared/types/blocks/common';

import { AdminHeaderActions } from './admin-header-actions';

export function Header({
  title,
  crumbs,
  buttons,
  show_locale,
  show_theme,
}: {
  title?: string;
  crumbs?: Crumb[];
  buttons?: ButtonType[];
  show_locale?: boolean;
  show_theme?: boolean;
}) {
  const isLegacy = process.env.ADMIN_UI_LEGACY === 'true';

  return (
    <header className="sticky top-0 z-30 flex h-[var(--header-height)] shrink-0 items-center border-b bg-background/90 shadow-sm backdrop-blur">
      <div className="flex w-full items-center gap-3 px-4 lg:px-6">
        <SidebarTrigger className="-ml-1" />

        {crumbs && crumbs.length > 0 && (
          <>
            <Separator orientation="vertical" className="h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                {crumbs.map((crumb, index) => (
                  <Fragment key={index}>
                    <BreadcrumbItem className="hidden md:flex items-center">
                      {crumb.is_active ? (
                        <BreadcrumbPage>{crumb.title}</BreadcrumbPage>
                      ) : (
                        <Link
                          href={crumb.url || ''}
                          className="flex items-center transition-colors hover:text-foreground"
                        >
                          {crumb.title}
                        </Link>
                      )}
                    </BreadcrumbItem>
                    {index < crumbs.length - 1 && (
                      <BreadcrumbSeparator className="hidden md:flex items-center" />
                    )}
                  </Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </>
        )}

        <div className="ml-auto flex items-center gap-3">
          {!isLegacy && <AdminHeaderActions />}
          {buttons && buttons.length > 0 && (
            <div className="flex items-center gap-3">
              {buttons.map((button, idx) => (
                <Button
                  key={idx}
                  variant={button.variant || 'outline'}
                  size="sm"
                >
                  <Link
                    href={button.url || ''}
                    target={button.target || '_self'}
                    className="flex items-center gap-2"
                  >
                    {button.icon && <SmartIcon name={button.icon as string} />}
                    {button.title}
                  </Link>
                </Button>
              ))}
            </div>
          )}
          {show_theme && <ThemeToggler />}
          {show_locale !== false && <LocaleSelector type="button" />}
        </div>
      </div>
    </header>
  );
}
