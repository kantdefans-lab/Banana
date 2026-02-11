'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import PromotionBanner from '@/components/PromotionBanner';
import GlobalNavigation from '@/components/GlobalNavigation';
import Sidebar from '@/components/Sidebar';
import VideoGenerator from '@/components/VideoGenerator';

// 🔥 1. 引入鉴权 Hook (确保路径正确)
import { useSession } from '@/core/auth/client'; 

export const dynamic = 'force-dynamic';

export default function VideoPage() {
  const searchParams = useSearchParams();
  const [showPromo, setShowPromo] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // 定义状态用于接收首页带过来的数据
  const [initialPrompt, setInitialPrompt] = useState('');
  const [initialModel, setInitialModel] = useState('');
  const [initialTab, setInitialTab] = useState<'text' | 'image'>('text');

  // 🔥 2. 获取真实登录状态
  const { data: session } = useSession();
  const isLoggedIn = !!session; // 转换为布尔值
  const userName = session?.user?.name || "User";

  // 监听 URL 参数变化并更新状态
  useEffect(() => {
    const promptParam = searchParams.get('prompt');
    const modelParam = searchParams.get('model');
    const tabParam = searchParams.get('tab');
    
    if (promptParam) setInitialPrompt(promptParam);
    if (modelParam) setInitialModel(modelParam);
    
    // 处理 Tab 参数
    if (tabParam === 'image' || tabParam === 'image-to-video') {
      setInitialTab('image');
    } else {
      setInitialTab('text');
    }
  }, [searchParams]);

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handlePromoClose = () => {
    setShowPromo(false);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(230 12% 8%)' }}>
      {/* 促销条 */}
      {showPromo && (
        <PromotionBanner 
          title="Nano Banana Flash Sale: 40% OFF"
          description="Limited-Time Sale: Get 40% OFF on AI Video Generation"
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
        isLoggedIn={isLoggedIn} // 传递真实状态
        userName={userName}
        sidebarCollapsed={sidebarCollapsed}
        onSidebarToggle={handleSidebarToggle}
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
          {/* 根据是否有促销条调整顶部间距 */}
          <div className={showPromo ? 'pt-12' : 'pt-0'}>
            {/* 面包屑导航 */}
            <nav className="px-4 py-2.5" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2 w-full text-sm">
                <li className="flex items-center">
                  <a 
                    className="flex items-center text-gray-400 hover:text-white transition-colors duration-200" 
                    title="Home" 
                    href="/"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-4 w-4 mr-1" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
                      />
                    </svg>
                    <span>Home</span>
                  </a>
                </li>
                <li className="flex items-center">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-3 w-3 text-gray-500 mx-1" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="text-white font-medium">AI Video Generator</span>
                </li>
              </ol>
            </nav>

            {/* 替换组件：AI 视频生成器 */}
            <div className="px-4 pb-6">
              {/* 🔥 3. 传入 isLoggedIn 属性 */}
              <VideoGenerator 
                initialPrompt={initialPrompt}
                initialModel={initialModel}
                initialTab={initialTab}
                isLoggedIn={isLoggedIn} // ✅ 关键修复
              />
            </div>
            
            {/* 页脚 */}
            <footer className="border-t border-gray-800 py-6">
              <div className="px-4">
                <div className="max-w-7xl mx-auto">
                  <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="mb-4 md:mb-0">
                      <span className="text-lg font-semibold text-white">AI Video Generator</span>
                      <p className="text-sm text-gray-400 mt-1">Powered by Google Veo 3</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      <p>© {new Date().getFullYear()} All rights reserved.</p>
                    </div>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}