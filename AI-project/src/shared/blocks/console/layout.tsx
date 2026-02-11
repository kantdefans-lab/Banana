'use client';

import { ReactNode, useState } from 'react';

import { Link, usePathname } from '@/core/i18n/navigation';
import { SmartIcon } from '@/shared/blocks/common/smart-icon';
import { Button } from '@/shared/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/components/ui/sheet';
import { Nav } from '@/shared/types/blocks/common';
import { ArrowLeft } from 'lucide-react'; // 🔥 引入箭头图标

export function ConsoleLayout({
  title,
  description,
  nav,
  topNav,
  className,
  children,
}: {
  title?: string;
  description?: string;
  nav?: Nav;
  topNav?: Nav;
  className?: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const filteredItems = nav?.items.filter((item) =>
    item.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 🔥 侧边栏菜单渲染
  const renderNavItems = () => (
    <nav className="space-y-1">
      
      {/* 🏠 新增：Back to Home 按钮 */}
      <Link
        href="/"
        className="flex items-center space-x-3 rounded-xl px-4 py-3 text-sm transition-all duration-200 font-medium text-gray-400 hover:text-white hover:bg-gray-800 group"
      >
        {/* 图标：使用 Lucide 的 ArrowLeft，悬停时稍微向左移动产生交互感 */}
        <ArrowLeft className="w-[18px] h-[18px] transition-transform duration-200 group-hover:-translate-x-1" />
        <span>Back to Home</span>
      </Link>

      {/* 分割线 */}
      <div className="h-px bg-gray-800 mx-2 my-2" />

      {/* 原有的设置菜单项 */}
      {filteredItems?.map((item, idx) => {
        // 判断是否激活
        const isActive = item.is_active ||
          pathname.endsWith(item.url as string) ||
          item.url?.endsWith(pathname);

        return (
          <Link
            key={idx}
            href={item.url || ''}
            className={`flex items-center space-x-3 rounded-xl px-4 py-3 text-sm transition-all duration-200 font-medium ${
              isActive
                ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-md' // 激活：橙色渐变背景 + 白字
                : 'text-gray-400 hover:text-white hover:bg-gray-800' // 未激活：灰字 + 深灰悬停
            }`}
          >
            <SmartIcon name={item.icon as string} size={18} />
            <span>{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    // 🔥 全局背景：黑色
    <div className={`bg-black min-h-screen text-gray-200 ${className}`}>
      
      {/* Top Navigation (如果有顶部导航的话) */}
      {topNav && (
        <div className="border-gray-800 border-b bg-gray-900/50 backdrop-blur-sm">
          <div className="container">
            <nav className="scrollbar-hide flex items-center gap-4 overflow-x-auto py-0 text-sm">
              {topNav.items.map((item, idx) => {
                const isActive = item.is_active || pathname?.startsWith(item.url as string);
                return (
                  <Link
                    key={idx}
                    href={item.url || ''}
                    className={`flex shrink-0 items-center gap-2 px-3 py-4 border-b-2 transition-colors duration-200 ${
                      isActive
                        ? 'border-orange-500 text-white' // 激活：橙色底边框 + 白字
                        : 'border-transparent text-gray-400 hover:text-white hover:border-gray-700'
                    }`}
                  >
                    {item.icon && (
                      <SmartIcon name={item.icon as string} size={16} />
                    )}
                    {item.title}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="border-gray-800 border-b bg-gray-950/30">
        <div className="container">
          <div className="flex items-center gap-4 py-8">
            {/* Mobile Menu Trigger (手机端菜单) */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden bg-gray-800 border-gray-700 text-white hover:bg-gray-700">
                  <SmartIcon name="Menu" size={20} />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 px-4 bg-gray-950 border-r border-gray-800 text-white">
                <SheetHeader className="mb-6 px-0">
                  <SheetTitle className="text-white text-left text-xl font-bold flex items-center gap-2">
                     <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">B</span>
                      </div>
                      {title || 'Settings'}
                  </SheetTitle>
                </SheetHeader>
                {renderNavItems()}
              </SheetContent>
            </Sheet>

            <h1 className="text-white text-3xl font-bold tracking-tight">
              {title}
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container">
        <div className="flex flex-col md:flex-row gap-8 py-8">
          {/* Left Sidebar (Desktop) */}
          <div className="hidden w-64 flex-shrink-0 md:block">
            {/* Navigation Menu */}
            {renderNavItems()}
          </div>

          {/* Right Content Area */}
          <div className="min-w-0 flex-1">
             {/* 给子内容加一个深色背景容器，使其更加突显 */}
             <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6 md:p-8">
                {children}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}