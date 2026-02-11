'use client';

import { useState } from 'react';
import PromotionBanner from '@/components/PromotionBanner';
import GlobalNavigation from '@/components/GlobalNavigation';
import Sidebar from '@/components/Sidebar';
import HeroSection from '@/components/HeroSection';
// ✅ 已移除 FeaturesSection 的引用
import ProcessSteps from '@/components/ProcessSteps';
import Footer from '@/components/Footer';
import { useAppContext } from '@/shared/contexts/app';

export default function LandingPage() {
  const [showPromo, setShowPromo] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const { user, setIsShowSignModal } = useAppContext();
  
  const isLoggedIn = !!user;
  const userName = user?.name || "User";

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handlePromoClose = () => {
    setShowPromo(false);
  };

  const handleSignIn = () => {
    setIsShowSignModal(true);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 促销条 */}
      {showPromo && (
        <PromotionBanner 
          title="Nano Banana Flash Sale: 40% OFF"
          description="Limited-Time Sale: Get 40% OFF on AI Image Generation"
          buttonText="GET OFFER NOW"
          showButton={true}
          showCloseButton={true}
          className="fixed top-0 left-0 right-0 z-50"
          onClose={handlePromoClose}
        />
      )}

      {/* 全局导航 */}
      <GlobalNavigation 
        showPromotion={showPromo}
        isLoggedIn={isLoggedIn}
        userName={userName}
        sidebarCollapsed={sidebarCollapsed}
        onSidebarToggle={handleSidebarToggle}
        onSignIn={handleSignIn}
      />

      {/* 主布局 */}
      <div className="flex min-h-screen">
        {/* 侧边栏 */}
        <div className="hidden md:block">
          <Sidebar 
            collapsed={sidebarCollapsed} 
            onCollapseChange={setSidebarCollapsed}
            className="z-45"
          />
        </div>

        {/* 主内容区 */}
        <main className={`flex-1 transition-all duration-300 ${
          sidebarCollapsed ? 'md:ml-16' : 'md:ml-80'
        }`}>
          <div className="pt-0">
            {/* Hero 区域 */}
            <HeroSection />
            
            {/* 过程步骤组件 */}
            <ProcessSteps />
            
            {/* ✅ FeaturesSection 已经在这里被删除了 */}
            
            {/* 页脚 */}
            <Footer />
          </div>
        </main>
      </div>
    </div>
  );
}