'use client';

import { useRef } from 'react';

interface ModeOption {
  id: string;
  label: string;
  badge?: 'NEW' | 'HOT';
}

interface ModeSelectorProps {
  activeMode: string;
  onModeChange: (mode: string) => void;
}

export default function ModeSelector({ activeMode, onModeChange }: ModeSelectorProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const modes: ModeOption[] = [
    {
      id: 'nano-banana',
      label: 'Nano Banana',
      badge: 'NEW',
    },
    {
      id: 'veo-3-video',
      label: 'Veo 3 Video',
      badge: 'HOT',
    },
    {
      id: 'text-to-image',
      label: 'Text to Image',
    },
    {
      id: 'image-to-image',
      label: 'Image to Image',
    },
    {
      id: 'text-to-video',
      label: 'Text to Video',
    },
    {
      id: 'image-to-video',
      label: 'Image to Video',
    },
    {
      id: 'chat-mode',
      label: 'Chat Mode',
    },
  ];

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -150, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 150, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative w-full mb-4">
      {/* 左侧渐变遮罩 */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
      
      {/* 右侧渐变遮罩 */}
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
      
      {/* 滚动容器 */}
      <div
        ref={scrollContainerRef}
        className="flex space-x-0 overflow-x-auto scrollbar-hide py-2"
      >
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => onModeChange(mode.id)}
            className={`relative flex-shrink-0 px-4 py-2 transition-all duration-200 ${
              activeMode === mode.id
                ? 'text-black'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {/* 标签和徽章 */}
            <div className="flex items-center whitespace-nowrap">
              <span className="font-medium text-sm">
                {mode.label}
              </span>
              {mode.badge && (
                <span className={`ml-2 text-xs font-bold px-1.5 py-0.5 rounded ${
                  mode.badge === 'NEW' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-red-100 text-red-600'
                }`}>
                  {mode.badge}
                </span>
              )}
            </div>
            
            {/* 选中下划线 */}
            {activeMode === mode.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>
            )}
          </button>
        ))}
      </div>
      
      {/* 横向滚动指示器 */}
      <div className="h-px bg-gray-200 mt-1"></div>
    </div>
  );
}