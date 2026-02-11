'use client';

import { useState, useEffect, useRef } from 'react';

interface VideoBackgroundProps {
  videoUrl?: string;
  posterUrl?: string;
  showControls?: boolean;
}

export default function VideoBackground({
  videoUrl = 'https://pub-93dbf869a4c54dde90c209f63c68799b.r2.dev/h008vi5t0pgy.mp4',
  posterUrl = '/videos/s7y9gq9efsm3.png',
  showControls = false,
}: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);

  // 视频播放控制
  useEffect(() => {
    const playVideo = async () => {
      if (videoRef.current && !videoError) {
        try {
          // 确保视频设置正确
          const video = videoRef.current;
          video.muted = true;
          video.playsInline = true;
          video.preload = 'auto';
          
          // 强制设置视频样式以确保可见
          video.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            opacity: 1;
            visibility: visible;
            display: block;
            z-index: 1;
          `;
          
          const playPromise = video.play();
          
          if (playPromise !== undefined) {
            await playPromise;
            console.log('背景视频开始播放');
          }
        } catch (error) {
          console.error('背景视频播放失败:', error);
          
          // 如果自动播放失败，等待用户交互
          const handleUserInteraction = () => {
            if (videoRef.current && !videoError) {
              videoRef.current.play().catch(e => 
                console.log('用户交互后播放失败:', e)
              );
            }
            document.removeEventListener('click', handleUserInteraction);
            document.removeEventListener('touchstart', handleUserInteraction);
          };
          
          document.addEventListener('click', handleUserInteraction);
          document.addEventListener('touchstart', handleUserInteraction);
        }
      }
    };

    // 视频加载完成时尝试播放
    if (videoLoaded) {
      playVideo();
    }
  }, [videoLoaded, videoError]);

  // 处理视频加载完成
  const handleVideoLoaded = () => {
    console.log('背景视频加载完成');
    setVideoLoaded(true);
  };

  // 处理视频错误 (优化版：打印具体错误代码)
  const handleVideoError = (e: any) => {
    const videoElement = videoRef.current;
    if (videoElement && videoElement.error) {
      const err = videoElement.error;
      console.error('背景视频加载详细错误:', {
        code: err.code, // 1=用户终止, 2=网络错误, 3=解码错误, 4=格式不支持
        message: err.message
      });
    } else {
      console.error('背景视频加载错误 (未知原因):', e);
    }
    setVideoError(true);
  };

  return (
    <div className="absolute inset-0 z-0 h-full w-full overflow-hidden bg-black">
      {/* 视频背景 */}
      <video
        ref={videoRef}
        autoPlay
        loop
        playsInline
        muted
        preload="auto"
        // 🔥 关键修改：添加 crossOrigin 属性以允许跨域请求 R2 资源
        crossOrigin="anonymous"
        poster={posterUrl}
        className="absolute inset-0 h-full w-full object-cover opacity-100"
        style={{
          zIndex: 1,
          opacity: 1,
          visibility: 'visible',
          display: 'block'
        }}
        onLoadedData={handleVideoLoaded}
        onError={handleVideoError}
      >
        <source 
          src={videoUrl} 
          type="video/mp4" 
        />
        <p>您的浏览器不支持视频播放。</p>
      </video>
      
      {/* 轻微遮罩层 - 确保文字可读 */}
      <div className="absolute inset-0 z-2 bg-black/40"></div>
      
      {/* 视频错误提示 */}
      {videoError && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80">
          <div className="text-white text-center p-6">
            <p className="text-lg mb-4">视频加载失败</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              刷新页面重试
            </button>
          </div>
        </div>
      )}
    </div>
  );
}