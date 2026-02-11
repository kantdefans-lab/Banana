// src/app/[locale]/(landing)/layout.tsx
'use client';

import { useEffect } from 'react';

// 这个文件是子布局，绝对不能包含 <html> 或 <body> 标签
export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 保留你之前写的修复样式的逻辑
  useEffect(() => {
    // 修复 pt-12 问题
    const fixPt12 = () => {
      // 方法1: 直接修改样式
      const elements = document.querySelectorAll('.pt-12');
      elements.forEach(el => {
        el.classList.remove('pt-12');
        el.classList.add('pt-0');
        (el as HTMLElement).style.paddingTop = '0';
        (el as HTMLElement).style.marginTop = '0';
      });
      
      // 方法2: 查找 HeroSection 的父元素
      const heroSection = document.querySelector('[class*="HeroSection"]');
      if (heroSection && heroSection.parentElement) {
        heroSection.parentElement.classList.remove('pt-12');
        heroSection.parentElement.classList.add('pt-0');
        heroSection.parentElement.style.paddingTop = '0';
      }
    };
    
    fixPt12();
    
    // 监听DOM变化
    const observer = new MutationObserver(fixPt12);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing-layout-wrapper" style={{ paddingTop: 0, marginTop: 0 }}>
      {children}
    </div>
  );
}