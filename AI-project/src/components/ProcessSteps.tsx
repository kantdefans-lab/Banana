'use client';

import React from 'react';

const ProcessSteps = () => {
  const steps = [
    {
      id: 1,
      title: 'Describe',
      description: 'Input your text prompt, visual concept, or creative idea. Our AI generators instantly understand your vision, forming the foundation for your professional-quality content.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#FF6B35]">
          <path d="M12 20h9"></path>
          <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"></path>
        </svg>
      )
    },
    {
      id: 2,
      title: 'Generate',
      description: 'Watch as our AI models (Flux, Nano Banana, GPT-4o, Seedream) transform your description into vibrant, detailed images and videos, bringing your unique vision to life with stunning AI capabilities.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#FF6B35]">
          <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"></path>
          <rect x="2" y="6" width="14" height="12" rx="2"></rect>
        </svg>
      )
    },
    {
      id: 3,
      title: 'Edit',
      description: 'Enhance your creation with our powerful AI editing tools. Adjust colors, add elements, or refine details to perfect your AI-generated artwork with professional features.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#FF6B35]">
          <line x1="4" x2="4" y1="21" y2="14"></line>
          <line x1="4" x2="4" y1="10" y2="3"></line>
          <line x1="12" x2="12" y1="21" y2="12"></line>
          <line x1="12" x2="12" y1="8" y2="3"></line>
          <line x1="20" x2="20" y1="21" y2="16"></line>
          <line x1="20" x2="20" y1="12" y2="3"></line>
          <line x1="2" x2="6" y1="14" y2="14"></line>
          <line x1="10" x2="14" y1="8" y2="8"></line>
          <line x1="18" x2="22" y1="16" y2="16"></line>
        </svg>
      )
    },
    {
      id: 4,
      title: 'Export',
      description: 'Download your polished, professional content in high resolution. Your AI-generated masterpiece is ready to captivate your audience across any platform or medium!',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#FF6B35]">
          <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"></path>
          <path d="m21.854 2.147-10.94 10.939"></path>
        </svg>
      )
    }
  ];

  return (
    <section className="relative px-4 py-16 md:py-24 bg-black">
      {/* 背景装饰 */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="left-1/6 absolute top-1/4 h-64 w-64 rounded-full bg-gradient-to-r from-[#FF6B35]/20 to-[#9333EA]/20 opacity-10 blur-3xl"></div>
        <div className="right-1/6 absolute bottom-1/4 h-64 w-64 rounded-full bg-gradient-to-r from-[#9333EA]/20 to-[#FF6B35]/20 opacity-10 blur-3xl"></div>
      </div>

      <div className="relative mx-auto max-w-7xl">
        {/* 标题部分 */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-2xl font-bold md:text-3xl lg:text-4xl text-white">
            How We Create Professional Content with AI
          </h2>
          <p className="md:text-md mx-auto max-w-3xl text-sm text-gray-400 md:max-w-5xl">
            Experience a streamlined, AI-powered journey from your creative idea to stunning visual content, with access to multiple industry-leading models on Bnn AI platform.
          </p>
        </div>

        {/* 步骤卡片 */}
        <div className="relative">
          {/* 连接线 - 横向（桌面端） */}
          <div 
            className="absolute left-1/2 top-1/2 z-0 hidden h-0.5 -translate-x-1/2 -translate-y-1/2 transform bg-gradient-to-r from-[#FF6B35] via-[#FF6B35] to-[#FF6B35] opacity-30 lg:block"
            style={{ width: '960px' }}
          />
          
          {/* 连接线 - 纵向（平板端） */}
          <div className="absolute bottom-0 left-1/2 top-0 z-0 hidden w-0.5 -translate-x-1/2 bg-gradient-to-b from-[#FF6B35] via-[#FF6B35] to-[#FF6B35] opacity-30 md:block lg:hidden" />

          <div className="relative z-10 flex flex-wrap justify-center gap-8">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className="group relative w-full max-w-[280px] overflow-hidden rounded-xl border border-gray-800 bg-gray-900 shadow-lg transition-all duration-300 hover:translate-y-[-4px] hover:border-orange-500/50 hover:shadow-xl sm:w-[280px]"
              >
                {/* 卡片背景装饰 */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute -right-32 -top-32 h-64 w-64 rounded-full bg-[#FF6B35] opacity-[0.05] blur-3xl" />
                  <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-[#FF6B35] opacity-[0.05] blur-3xl" />
                </div>

                {/* 步骤序号 */}
                <div className="absolute left-5 top-4 z-10 flex h-10 w-10 items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-[#FF6B35] opacity-90 hover:bg-[#FF8B5C]" />
                  <span className="text-white relative text-lg font-bold">
                    {step.id}
                  </span>
                </div>

                <div className="relative z-10 p-6 pt-16">
                  {/* 图标 */}
                  <div className="mb-6 flex justify-center">
                    <div className="gradient-glow-bg relative overflow-hidden rounded-xl border border-gray-800 bg-gray-900/80 p-4 backdrop-blur-sm transition-all duration-300 group-hover:border-[#FF6B35]/50">
                      <div className="relative">
                        {step.icon}
                      </div>
                    </div>
                  </div>

                  {/* 内容 */}
                  <div className="text-center">
                    {/* 🔥 修改点：此处已改为 text-white */}
                    <h3 className="text-white mb-3 text-lg font-semibold md:text-xl">
                      {step.title}
                    </h3>
                    <p className="md:text-md text-sm text-gray-400">
                      {step.description}
                    </p>
                  </div>
                </div>

                {/* 箭头连接器（只在桌面端显示） */}
                {index < steps.length - 1 && (
                  <div className="absolute -right-4 top-1/2 z-20 hidden -translate-y-1/2 transform lg:block">
                    <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-gray-800 bg-gray-900">
                      <div className="absolute inset-0 bg-[#FF6B35] opacity-[0.1] blur-sm" />
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative">
                        <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProcessSteps;