'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Heart, Download, Play } from 'lucide-react';

interface MediaItem {
  id: number;
  type: 'image' | 'video';
  url: string;
  title: string;
  model: string;
  likes: number;
}

interface MediaCarouselProps {
  items: MediaItem[];
  title?: string;
}

export default function MediaCarousel({ items, title = "Recent Creations" }: MediaCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // 自动轮播
  useEffect(() => {
    if (!isPlaying || items.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % items.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isPlaying, items.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsPlaying(false);
  };

  const goToPrevious = () => {
    setIsPlaying(false);
    setCurrentIndex(prev => prev === 0 ? items.length - 1 : prev - 1);
  };

  const goToNext = () => {
    setIsPlaying(false);
    setCurrentIndex(prev => (prev + 1) % items.length);
  };

  if (items.length === 0) return null;

  const currentItem = items[currentIndex];

  return (
    <div className="h-full p-4">
      {/* 标题和控制 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="text-sm text-gray-400 hover:text-white"
          >
            {isPlaying ? 'Pause' : 'Play'} Auto
          </button>
          <div className="flex space-x-2">
            <button
              onClick={goToPrevious}
              className="p-1.5 hover:bg-gray-800 rounded-full"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goToNext}
              className="p-1.5 hover:bg-gray-800 rounded-full"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 轮播内容 */}
      <div className="relative h-32 bg-gray-900/50 rounded-xl overflow-hidden">
        {/* 当前媒体项 */}
        <div className="absolute inset-0 flex">
          {/* 左侧：媒体预览 */}
          <div className="w-1/3 relative">
            {currentItem.type === 'video' ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900/30 to-blue-900/30">
                <Play className="w-8 h-8 text-white" />
                <div className="absolute bottom-2 right-2 text-xs bg-black/50 px-2 py-1 rounded">
                  VIDEO
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-yellow-900/30 to-orange-900/30">
                <div className="text-3xl">🖼️</div>
              </div>
            )}
          </div>

          {/* 右侧：信息 */}
          <div className="w-2/3 p-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-white truncate">{currentItem.title}</h4>
                <p className="text-sm text-gray-400 mt-1">Created with {currentItem.model}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-1.5 hover:bg-gray-800 rounded">
                  <Heart className="w-4 h-4" />
                </button>
                <span className="text-sm">{currentItem.likes}</span>
                <button className="p-1.5 hover:bg-gray-800 rounded">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* 进度指示器 */}
            <div className="flex space-x-1 mt-6">
              {items.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`h-1 rounded-full transition-all ${
                    index === currentIndex
                      ? 'bg-yellow-500 w-6'
                      : 'bg-gray-700 hover:bg-gray-600 w-3'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 缩略图列表 */}
      <div className="flex space-x-2 mt-4 overflow-x-auto pb-2">
        {items.map((item, index) => (
          <button
            key={item.id}
            onClick={() => goToSlide(index)}
            className={`flex-shrink-0 w-20 h-12 rounded overflow-hidden relative ${
              index === currentIndex ? 'ring-2 ring-yellow-500' : 'opacity-70 hover:opacity-100'
            }`}
          >
            <div className={`absolute inset-0 flex items-center justify-center ${
              item.type === 'video' 
                ? 'bg-purple-900/50' 
                : 'bg-yellow-900/50'
            }`}>
              {item.type === 'video' ? '🎥' : '🖼️'}
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1">
              <div className="text-xs truncate">{item.model}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}