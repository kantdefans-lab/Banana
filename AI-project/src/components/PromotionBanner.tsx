// components/PromotionBanner.tsx
'use client';

import { useState, useEffect } from 'react';
import { Zap, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PromotionBannerProps {
  title?: string;
  description?: string;
  buttonText?: string;
  showButton?: boolean;
  className?: string;
  showCloseButton?: boolean;
  showCountdown?: boolean;
  countdownHours?: number;
  countdownMinutes?: number;
  countdownSeconds?: number;
  onClose?: () => void;
  onButtonClick?: () => void;
}

export default function PromotionBanner({
  title = "Nano Banana Flash Sale: 40% OFF",
  description = "Limited-Time Sale: Get 40% OFF on AI Image Generation",
  buttonText = "GET OFFER NOW",
  showButton = true,
  className = "",
  showCloseButton = false,
  showCountdown = true,
  countdownHours = 9,
  countdownMinutes = 55,
  countdownSeconds = 55,
  onClose,
  onButtonClick
}: PromotionBannerProps) {
  const router = useRouter();
  const [promoTime, setPromoTime] = useState({ 
    hours: countdownHours, 
    minutes: countdownMinutes, 
    seconds: countdownSeconds 
  });

  // 倒计时逻辑
  useEffect(() => {
    if (!showCountdown) return;

    const timer = setInterval(() => {
      setPromoTime(prev => {
        let { hours, minutes, seconds } = prev;
        
        seconds--;
        if (seconds < 0) {
          seconds = 59;
          minutes--;
        }
        if (minutes < 0) {
          minutes = 59;
          hours--;
        }
        if (hours < 0) {
          clearInterval(timer);
          return { hours: 0, minutes: 0, seconds: 0 };
        }
        
        return { hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showCountdown]);

  const formatTime = (num: number) => num.toString().padStart(2, '0');

  const handleButtonClick = () => {
    if (onButtonClick) {
      onButtonClick();
    } else {
      router.push('/pricing');
    }
  };

  return (
    <div className={`w-full bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 text-white ${className}`} style={{ height: '48px' }}>
      <div className="w-full h-full px-4">
        {/* 修改点 1: justify-between -> justify-center，并添加 gap-4 md:gap-8 来控制间距 */}
        <div className="flex items-center justify-center h-full gap-4 md:gap-8">
          
          {/* 左侧：促销信息 */}
          <div className="flex items-center space-x-3">
            {/* 火焰图标 */}
            <div className="flex items-center justify-center w-7 h-7 bg-white/20 rounded-full flex-shrink-0">
              <Zap className="w-3.5 h-3.5 text-white animate-pulse" />
            </div>
            
            {/* 文本内容 */}
            <div className="flex items-center space-x-2">
              <span className="font-bold text-white text-sm whitespace-nowrap">
                {title}
              </span>
              <span className="hidden lg:inline text-white text-xs whitespace-nowrap">
                {description}
              </span>
              <span className="inline lg:hidden text-white text-xs">
                40% OFF 🚀
              </span>
            </div>
          </div>

          {/* 右侧：倒计时和按钮 */}
          <div className="flex items-center space-x-3">
            {/* 倒计时 */}
            {showCountdown && (
              <div className="hidden md:flex items-center space-x-2">
                <div className="flex items-center bg-black/20 rounded px-2 py-1">
                  <span className="text-white font-mono text-xs">
                    {formatTime(promoTime.hours)}:{formatTime(promoTime.minutes)}:{formatTime(promoTime.seconds)}
                  </span>
                </div>
                
                {/* 警告图标 */}
                <AlertTriangle className="w-3.5 h-3.5 text-yellow-200 animate-pulse flex-shrink-0" />
              </div>
            )}
            
            {/* 行动按钮 */}
            {showButton && (
              <>
                <button
                  onClick={handleButtonClick}
                  className="hidden md:block px-4 py-1.5 bg-white text-red-600 font-extrabold rounded-full text-xs whitespace-nowrap shadow-[0_0_15px_rgba(255,255,255,0.6)] hover:shadow-[0_0_20px_rgba(255,255,255,0.8)] hover:scale-105 hover:bg-yellow-50 active:scale-95 transition-all duration-200 flex-shrink-0 ring-2 ring-white/30 border-2 border-transparent"
                >
                  {buttonText}
                </button>

                {/* 移动端简化按钮 */}
                <button
                  onClick={handleButtonClick}
                  className="md:hidden px-3 py-1 bg-white text-red-600 font-extrabold rounded-full text-xs whitespace-nowrap shadow-md hover:scale-105 active:scale-95 transition-all flex-shrink-0"
                >
                  GET OFFER
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 进度条效果 */}
      <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-white to-transparent animate-pulse" />
    </div>
  );
}