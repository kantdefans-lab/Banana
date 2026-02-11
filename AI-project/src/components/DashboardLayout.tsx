// components/DashboardLayout.tsx
'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  showPromotion?: boolean;
}

export default function DashboardLayout({ 
  children, 
  showPromotion = true 
}: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-950 relative">
      {/* 侧边栏 */}
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onCollapseChange={setSidebarCollapsed} 
      />
      
      {/* 背景层 - 确保背景延伸到整个屏幕 */}
      <div className="fixed inset-0 bg-gray-950 -z-10" />
      
      {/* 主内容区域 */}
      <div className={`transition-all duration-300 min-h-screen ${
        sidebarCollapsed ? 'ml-16' : 'ml-80'
      }`}>
        {/* 促销条 - 放在主内容区域，不会被覆盖 */}
        {showPromotion && (
          <div className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white p-4 shadow-lg sticky top-0 z-30">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <span className="text-xl">🎉</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg">Special Promotion!</h3>
                  <p className="text-sm opacity-90">
                    Get 50% off on all Pro plans. Limited time offer!
                  </p>
                </div>
              </div>
              <button className="bg-white text-orange-600 hover:bg-gray-100 px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap">
                Upgrade Now
              </button>
            </div>
          </div>
        )}
        
        {/* 页面内容 */}
        <div className="p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}