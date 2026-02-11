'use client';

import { useState, useEffect } from 'react';
import { X, Zap, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TopPromoBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const [timeLeft, setTimeLeft] = useState({
    hours: 9,
    minutes: 55,
    seconds: 55
  });
  const router = useRouter();

  // 模拟倒计时
  useEffect(() => {
    if (!isVisible) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
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
          hours = 0;
          minutes = 0;
          seconds = 0;
        }

        return { hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible]);

  const handleGetOffer = () => {
    // 实际应用中这里应该导航到促销页面
    router.push('/promo/flash-sale');
    // 或者触发一个模态框
    console.log('Promo clicked - would navigate to sale page');
  };

  const formatTime = (num: number) => num.toString().padStart(2, '0');

  if (!isVisible) return null;

  return (
    <div className="relative bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500">
      {/* 主横幅内容 */}
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          {/* 左侧：促销信息 */}
          <div className="flex items-center space-x-4">
            {/* 火焰图标 */}
            <div className="flex items-center justify-center w-8 h-8 bg-white/20 rounded-full">
              <Zap className="w-4 h-4 text-white animate-pulse" />
            </div>
            
            {/* 文本内容 */}
            <div className="flex items-center space-x-2">
              <span className="font-bold text-white text-sm md:text-base">
                Nano Banana Flash Sale:
              </span>
              <span className="text-white text-sm md:text-base">
                40% OFF
              </span>
              <span className="hidden md:inline text-white text-sm md:text-base">
                Limited-Time Sale: Get 40% OFF on AI Image Generation 
              </span>
              <span className="inline md:hidden text-white text-sm">
                Get 40% OFF 🚀
              </span>
              <span className="ml-1">🚀</span>
            </div>
          </div>

          {/* 右侧：倒计时和按钮 */}
          <div className="flex items-center space-x-4">
            {/* 倒计时 */}
            <div className="hidden md:flex items-center space-x-2">
              <div className="flex items-center bg-black/20 rounded px-2 py-1">
                <span className="text-white font-mono text-sm">
                  {formatTime(timeLeft.hours)}:{formatTime(timeLeft.minutes)}:{formatTime(timeLeft.seconds)}
                </span>
              </div>
              
              {/* 警告图标 */}
              <AlertTriangle className="w-4 h-4 text-yellow-200 animate-pulse" />
              
              {/* 行动按钮 */}
              <button
                onClick={handleGetOffer}
                className="px-4 py-1.5 bg-white text-red-600 font-bold rounded-lg hover:bg-gray-100 transition-colors text-sm whitespace-nowrap shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                GET OFFER NOW
              </button>
            </div>

            {/* 移动端简化按钮 */}
            <button
              onClick={handleGetOffer}
              className="md:hidden px-3 py-1 bg-white text-red-600 font-bold rounded text-xs whitespace-nowrap"
            >
              GET OFFER
            </button>

            {/* 关闭按钮 */}
            <button
              onClick={() => setIsVisible(false)}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Close promotion"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* 进度条效果（可选） */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent animate-pulse" />
    </div>
  );
}