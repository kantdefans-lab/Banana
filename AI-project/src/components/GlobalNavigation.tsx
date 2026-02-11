'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ChevronLeft, 
  ChevronRight, 
  User, 
  Coins, 
  CreditCard, 
  // Activity, // ❌ 已移除：不再需要 Activity 图标
  LogOut 
} from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';

import { signOut } from '@/core/auth/client';
import { useAppContext } from '@/shared/contexts/app';

import { LoginModal } from '@/components/LoginModal'; 

interface GlobalNavigationProps {
  showPromotion?: boolean;
  isLoggedIn?: boolean;
  userName?: string;
  sidebarCollapsed?: boolean;
  onSidebarToggle?: () => void;
  onSignIn?: () => void;
}

export default function GlobalNavigation({ 
  showPromotion = false,
  isLoggedIn: propIsLoggedIn = false,
  userName: propUserName = '', 
  sidebarCollapsed = false,
  onSidebarToggle,
}: GlobalNavigationProps) {
  
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const { user } = useAppContext();
  const isUserAuthenticated = !!user || propIsLoggedIn;
  
  const currentUser = user || { name: propUserName, credits: 30, image: null };
  const displayName = currentUser.name || 'User';
  const displayInitial = displayName.charAt(0).toUpperCase();

  const displayCredits = (() => {
    const credits = currentUser.credits;
    if (typeof credits === 'number') {
      return credits;
    }
    if (typeof credits === 'object' && credits !== null && 'remainingCredits' in credits) {
      return (credits as { remainingCredits: number }).remainingCredits;
    }
    return 0;
  })();

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/'; 
  };

  const hoverHighlightClass = "focus:bg-gray-800 focus:text-white cursor-pointer transition-colors outline-none";

  return (
    <>
      <nav className={`fixed bg-gradient-to-b from-gray-900 to-gray-950 border-b border-gray-800 w-screen left-0 z-40 ${
        showPromotion ? 'top-12' : 'top-0'
      }`}>
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            
            {/* 左侧区域 */}
            <div className="flex items-center space-x-4">
              {onSidebarToggle && (
                <button
                  onClick={onSidebarToggle}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
                  aria-label={sidebarCollapsed ? "展开侧边栏" : "收起侧边栏"}
                >
                  {sidebarCollapsed ? (
                    <ChevronRight className="h-5 w-5 text-gray-300 hover:text-white" />
                  ) : (
                    <ChevronLeft className="h-5 w-5 text-gray-300 hover:text-white" />
                  )}
                </button>
              )}
              
              <Link href="/" className="flex items-center group">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                  <span className="text-white font-bold text-sm">B</span>
                </div>
                <span className="ml-2 text-lg font-bold text-white hidden md:block">
                  BananaImg
                </span>
              </Link>
            </div>
            
            {/* 右侧区域 */}
            <div className="flex items-center space-x-4">
              {isUserAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="flex items-center space-x-2 cursor-pointer outline-none select-none hover:opacity-80 transition-opacity">
                      <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                        {displayInitial}
                      </div>
                      <span className="text-sm font-medium text-gray-300 hidden md:block">
                        {displayName}
                      </span>
                    </div>
                  </DropdownMenuTrigger>
                  
                  <DropdownMenuContent align="end" className="w-56 bg-gray-900 border-gray-800 text-gray-300 z-50 shadow-xl">
                    
                    {/* Profile */}
                    <DropdownMenuItem asChild className={hoverHighlightClass}>
                      <Link href="/settings/profile" className="flex items-center w-full">
                        <User className="mr-2 h-4 w-4 text-gray-400 group-focus:text-white" />
                        <span>{displayName}</span>
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator className="-mx-1 my-1 h-px bg-gray-800" />
                    
                    {/* Credits */}
                    <DropdownMenuItem asChild className={hoverHighlightClass}>
                      <Link href="/settings/credits" className="flex items-center w-full">
                        <Coins className="mr-2 h-4 w-4 text-gray-400" />
                        <span>Credits: {displayCredits}</span>
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator className="-mx-1 my-1 h-px bg-gray-800" />
                    
                    {/* Billing */}
                    <DropdownMenuItem asChild className={hoverHighlightClass}>
                      <Link href="/settings/billing" className="flex items-center w-full">
                        <CreditCard className="mr-2 h-4 w-4 text-gray-400" />
                        <span>Billing</span>
                      </Link>
                    </DropdownMenuItem>
                    
                    {/* ❌ 已删除 Activity 及其分割线 */}
                    {/* ❌ 已删除 Admin System 及其分割线 */}
                    
                    <DropdownMenuSeparator className="-mx-1 my-1 h-px bg-gray-800" />
                    
                    {/* Sign Out */}
                    <DropdownMenuItem 
                      onClick={handleSignOut} 
                      className={`${hoverHighlightClass} text-red-400 focus:text-red-300 focus:bg-red-900/20`}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>

                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <div className="hidden md:flex items-center">
                    <button 
                      onClick={() => setIsLoginModalOpen(true)}
                      className="text-sm font-medium bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-6 py-2 rounded-lg hover:shadow-md hover:opacity-90 transition-all duration-200 shadow-sm"
                    >
                      Log in
                    </button>
                  </div>
                  
                  <div className="flex md:hidden items-center">
                    <button 
                      onClick={() => setIsLoginModalOpen(true)}
                      className="text-sm font-medium bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-4 py-2 rounded-lg"
                    >
                      Log in
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className={`h-14 ${showPromotion ? 'mt-12' : ''}`} />

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </>
  );
}