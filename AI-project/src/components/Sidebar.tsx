'use client';

import { useState, useEffect } from 'react';
// 注意：虽然我们不用 Link 组件了，但为了保持代码结构整洁，我们改用原生 a 标签
import { 
  Home, 
  ImageIcon,
  Video, 
  Layers,
  Crown,
  ChevronDown,
  Info 
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: 'new' | 'hot' | 'free' | 'pro';
  href?: string;
  subItems?: MenuItem[];
}

interface SidebarProps {
  collapsed?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
  className?: string;
}

export default function Sidebar({ 
  collapsed: externalCollapsed, 
  onCollapseChange,
  className = ''
}: SidebarProps) {
  // --- 状态管理 ---
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;
  
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'ai-generations': true,
  });
  
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // --- 路由处理 ---
  const currentLocale = pathname ? pathname.split('/')[1] : 'en';
  const isLocalePath = ['zh', 'en', 'ja', 'ko'].includes(currentLocale);
  const localePrefix = isLocalePath ? `/${currentLocale}` : '';

  const getLocalizedHref = (href: string) => {
    if (!href) return '#';
    if (href.startsWith('http')) return href;
    if (href.startsWith(localePrefix)) return href;
    if (href === '/' && localePrefix) return localePrefix;
    return `${localePrefix}${href}`;
  };

  // --- 菜单结构定义 ---
  const menuStructure: MenuItem[] = [
    {
      id: 'home',
      label: 'Home',
      icon: <Home className="h-5 w-5" />,
      href: '/',
    },
    {
      id: 'ai-generations',
      label: 'AI Generations',
      icon: <Layers className="h-5 w-5" />,
      subItems: [
        {
          id: 'ai-image-generator',
          label: 'AI Image Generator',
          icon: <ImageIcon className="h-4 w-4" />,
          badge: 'free',
          href: '/image',
        },
        {
          id: 'ai-video-generator',
          label: 'AI Video Generator',
          icon: <Video className="h-4 w-4" />,
          href: '/video',
        },
      ],
    },
    {
      id: 'about-us',
      label: 'About Us',
      icon: <Info className="h-5 w-5" />,
      href: '/aboutus',
    },
    {
      id: 'upgrade-plan',
      label: 'Upgrade Plan',
      icon: <Crown className="h-5 w-5" />,
      badge: 'pro',
      href: '/pricing',
    },
  ];

  // --- 交互处理函数 ---
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const handleParentClick = (item: MenuItem) => {
    if (item.subItems && collapsed) {
      const newCollapsed = false;
      if (onCollapseChange) {
        onCollapseChange(newCollapsed);
      } else {
        setInternalCollapsed(newCollapsed);
      }
      setExpandedSections(prev => ({
        ...prev,
        [item.id]: true
      }));
    } else if (item.subItems) {
      toggleSection(item.id);
    }
  };

  // --- 渲染辅助函数 ---
  const renderBadge = (badge?: string | number | boolean) => {
    if (!badge) return null;
    
    if (typeof badge === 'number') {
      return (
        <div className="h-5 w-5 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-xs text-white font-bold">{badge > 9 ? '9+' : badge}</span>
        </div>
      );
    }
    
    if (typeof badge === 'boolean') {
      return (
        <div className="h-2 w-2 bg-red-500 rounded-full"></div>
      );
    }
    
    const badgeStyles = {
      new: 'bg-blue-500',
      hot: 'bg-gradient-to-r from-red-500 to-orange-500',
      free: 'bg-green-500',
      pro: 'bg-gradient-to-r from-orange-500 to-yellow-500',
    };

    const badgeText = {
      new: 'NEW',
      hot: 'HOT',
      free: 'FREE',
      pro: 'PRO',
    };

    return (
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${(badgeStyles as any)[badge]} text-white whitespace-nowrap flex-shrink-0`}>
        {(badgeText as any)[badge]}
      </span>
    );
  };

  // --- 渲染主要函数 ---
  const renderMenuItem = (item: MenuItem, level = 0) => {
    const hasSubItems = item.subItems && item.subItems.length > 0;
    const isSectionExpanded = expandedSections[item.id];
    
    const itemHref = item.href ? getLocalizedHref(item.href) : undefined;
    const isActive = pathname === itemHref || item.subItems?.some(sub => sub.href && pathname === getLocalizedHref(sub.href));

    const buttonClasses = `w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${
      isActive
        ? 'bg-gradient-to-r from-orange-500/20 to-orange-500/10 border-l-4 border-orange-500'
        : 'hover:bg-gray-800/50'
    } whitespace-nowrap group`;

    const ItemContent = () => (
      <>
        <div className="flex items-center min-w-0">
          <div className={`h-5 w-5 mr-3 flex-shrink-0 ${
            isActive ? 'text-orange-400' : 'text-gray-400 group-hover:text-white transition-colors'
          }`}>
            {item.icon}
          </div>
          {!collapsed && (
            <span className={`text-sm font-medium ${
              isActive ? 'text-white' : 'text-gray-300 group-hover:text-white transition-colors'
            } truncate`}>
              {item.label}
            </span>
          )}
        </div>
        
        {!collapsed && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {item.badge && renderBadge(item.badge)}
            {hasSubItems && (
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${
                isSectionExpanded ? '' : '-rotate-90'
              } ${isActive ? 'text-orange-400' : 'text-gray-400'} flex-shrink-0`} />
            )}
          </div>
        )}
      </>
    );

    return (
      <div key={item.id} className="mb-1">
        {/* 顶级菜单项 */}
        {level === 0 && (
          <div className="mb-1">
            {hasSubItems ? (
              // 1. 如果有子菜单：渲染为 Button，用于折叠
              <button
                onClick={() => handleParentClick(item)}
                className={buttonClasses}
              >
                <ItemContent />
              </button>
            ) : (
              // 2. 🔥 核心修改：使用原生 <a> 标签替代 <Link>，强制跳转
              <a 
                href={itemHref || '#'}
                className={buttonClasses}
              >
                <ItemContent />
              </a>
            )}
            
            {/* 子菜单区域 */}
            {!collapsed && hasSubItems && isSectionExpanded && (
              <div className="mt-1 ml-4 bg-gray-800/30 rounded-xl p-2">
                {item.subItems!.map((subItem) => {
                  const subItemHref = subItem.href ? getLocalizedHref(subItem.href) : '';
                  const isSubActive = pathname === subItemHref;
                  
                  if (subItem.href) {
                    return (
                      // 3. 🔥 核心修改：子菜单也使用原生 <a> 标签
                      <a
                        key={subItem.id}
                        href={subItemHref}
                        className={`block w-full ${
                          isSubActive ? 'bg-gray-700/50' : ''
                        }`}
                      >
                        <div className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-700/50 transition-colors group whitespace-nowrap">
                          <div className="flex items-center min-w-0">
                            <div className={`h-4 w-4 mr-3 flex-shrink-0 ${
                              isSubActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
                            }`}>
                              {subItem.icon}
                            </div>
                            <span className={`text-sm ${
                              isSubActive ? 'text-white' : 'text-gray-300 group-hover:text-white'
                            } truncate`}>
                              {subItem.label}
                            </span>
                          </div>
                          {subItem.badge && (
                            <div className="flex-shrink-0 ml-2">
                              {renderBadge(subItem.badge)}
                            </div>
                          )}
                        </div>
                      </a>
                    );
                  }
                  
                  // 没有 href 的子项
                  return (
                    <button
                      key={subItem.id}
                      className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-700/50 transition-colors group whitespace-nowrap"
                    >
                      <div className="flex items-center min-w-0">
                        <div className="h-4 w-4 mr-3 text-gray-400 group-hover:text-white flex-shrink-0">
                          {subItem.icon}
                        </div>
                        <span className="text-sm text-gray-300 group-hover:text-white truncate">
                          {subItem.label}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (!mounted) return null;

  return (
    <div 
      // 🔥 强制修复 Z-Index：防止被 Image 页面遮挡
      style={{ zIndex: 999999 }}
      className={`fixed left-0 top-[104px] h-[calc(100vh-104px)] bg-gradient-to-b from-gray-900 to-gray-950 border-r border-gray-800 flex flex-col transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-80'
      } ${className} z-[99999]`}
    >
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
        {menuStructure.map((item) => renderMenuItem(item))}
      </div>
    </div>
  );
}