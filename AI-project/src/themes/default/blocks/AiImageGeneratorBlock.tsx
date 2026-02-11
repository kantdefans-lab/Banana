// @ts-nocheck
'use client';

import { PageHeader } from '@/shared/blocks/common';
import { ImageGenerator } from '@/shared/blocks/generator';
import { useState, useEffect, useRef, useCallback } from 'react';

interface AiImageGeneratorBlockProps {
  className?: string;
  translations?: {
    page?: {
      title: string;
      description: string;
    };
    generator?: {
      title: string;
    };
  };
}

// 默认翻译文本
const defaultTranslations = {
  page: {
    title: "AI 图片生成器",
    description: "使用人工智能将您的想法转化为视觉艺术。描述您想要的画面，让我们为您创造独特的图像。"
  },
  generator: {
    title: "AI 图片生成器"
  }
};

// 后端API配置
const BACKEND_CONFIG = {
  maxAttempts: 120,
  basePollInterval: 3000,
  maxPollInterval: 20000,
  timeout: 900000,
  
  createEndpoint: '/api/ai/generate',  // 修正为实际路径
  queryEndpoint: '/api/ai/query',
  
  statusMapping: {
    'processing': 'processing',
    'pending': 'processing',
    'generating': 'processing',
    'completed': 'completed',
    'success': 'completed',
    'failed': 'failed',
    'error': 'failed',
    'timeout': 'failed',
    'cancelled': 'failed'
  }
};

// 任务状态类型
interface TaskResult {
  status: 'succeeded' | 'failed' | 'processing' | 'timeout' | 'pending';
  output?: string[];
  id?: string;
  error?: string;
  message?: string;
  images?: string[];
  taskData?: any;
}

// 任务状态历史记录
interface TaskStatusHistory {
  timestamp: number;
  status: string;
  message: string;
  data?: any;
}

export function AiImageGeneratorBlock({
  className = '',
  translations = {}
}: AiImageGeneratorBlockProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'processing' | 'success' | 'error' | 'timeout'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [taskHistory, setTaskHistory] = useState<TaskStatusHistory[]>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollingControllerRef = useRef<AbortController | null>(null);
  const taskStartTimeRef = useRef<number>(0);
  
  // 合并默认翻译和传入的翻译
  const mergedTranslations = {
    page: { ...defaultTranslations.page, ...translations.page },
    generator: { ...defaultTranslations.generator, ...translations.generator }
  };

  // 清理轮询
  const cleanupPolling = useCallback(() => {
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
    
    if (pollingControllerRef.current) {
      pollingControllerRef.current.abort('用户取消或组件卸载');
      pollingControllerRef.current = null;
    }
    
    console.log('🔄 清理轮询');
  }, []);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      cleanupPolling();
    };
  }, [cleanupPolling]);

  // 记录状态历史
  const recordStatus = useCallback((status: string, message: string, data?: any) => {
    const historyEntry: TaskStatusHistory = {
      timestamp: Date.now(),
      status,
      message,
      data
    };
    
    setTaskHistory(prev => [...prev.slice(-19), historyEntry]);
    console.log(`📝 ${status}: ${message}`, data ? { data } : '');
  }, []);

  // 检查是否是图片URL
  const isImageUrl = useCallback((url: string): boolean => {
    if (!url || typeof url !== 'string') return false;
    
    // 检查协议
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return false;
    }
    
    // 检查常见图片扩展名
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.avif'];
    const lowerUrl = url.toLowerCase();
    
    // 检查扩展名
    for (const ext of imageExtensions) {
      if (lowerUrl.includes(ext) || lowerUrl.includes(ext + '?')) {
        return true;
      }
    }
    
    // 检查常见图片CDN域名
    const imageDomains = [
      'tempfile.aiquickdraw.com',
      'aiquickdraw.com'
    ];
    
    for (const domain of imageDomains) {
      if (lowerUrl.includes(domain)) {
        return true;
      }
    }
    
    return false;
  }, []);

  // 从任务数据中提取图片URL
  const extractImageUrlsFromTaskData = useCallback((taskData: any): string[] => {
    console.log('🔍 =========== 开始提取图片URL ===========');
    
    if (!taskData) {
      console.log('❌ 任务数据为空');
      return [];
    }
    
    console.log('📋 任务数据结构:', {
      id: taskData.id,
      status: taskData.status,
      hasTaskResult: !!taskData.task_result,
      hasTaskInfo: !!taskData.task_info
    });
    
    const urls: string[] = [];
    
    // 1. 首先检查 task_result 字段
    if (taskData.task_result) {
      console.log('📦 解析 task_result 字段');
      try {
        const taskResult = typeof taskData.task_result === 'string' 
          ? JSON.parse(taskData.task_result) 
          : taskData.task_result;
        
        console.log('📦 解析后的 taskResult:', {
          success: taskResult.success,
          hasResultUrls: !!taskResult.result_urls,
          hasResult_urls: !!taskResult.result_urls,
          hasRawData: !!taskResult.rawData,
          keys: Object.keys(taskResult)
        });
        
        // 关键修复：直接从 rawData.response.resultUrls 提取
        if (taskResult.rawData?.response?.resultUrls && Array.isArray(taskResult.rawData.response.resultUrls)) {
          console.log(`✅ 从 rawData.response.resultUrls 找到 ${taskResult.rawData.response.resultUrls.length} 个URL`);
          urls.push(...taskResult.rawData.response.resultUrls);
        }
        
        // 检查其他可能的URL字段
        if (taskResult.result_urls && Array.isArray(taskResult.result_urls)) {
          console.log(`✅ 从 result_urls 找到 ${taskResult.result_urls.length} 个URL:`, taskResult.result_urls);
          urls.push(...taskResult.result_urls);
        }
        
        if (taskResult.resultUrls && Array.isArray(taskResult.resultUrls)) {
          console.log(`✅ 从 resultUrls 找到 ${taskResult.resultUrls.length} 个URL:`, taskResult.resultUrls);
          urls.push(...taskResult.resultUrls);
        }
        
        if (taskResult.images && Array.isArray(taskResult.images)) {
          console.log(`✅ 从 images 找到 ${taskResult.images.length} 个URL`);
          urls.push(...taskResult.images);
        }
        
      } catch (e: any) {
        console.error('❌ 解析 task_result 失败:', e.message);
      }
    } else {
      console.log('⚠️ 没有找到 task_result 字段');
    }
    
    // 2. 检查 task_info 字段
    if (taskData.task_info) {
      console.log('📦 解析 task_info 字段');
      try {
        const taskInfo = typeof taskData.task_info === 'string' 
          ? JSON.parse(taskData.task_info) 
          : taskData.task_info;
        
        console.log('📦 解析后的 taskInfo:', {
          hasExtractedImageUrls: !!taskInfo.extractedImageUrls,
          keys: Object.keys(taskInfo)
        });
        
        if (taskInfo.extractedImageUrls && Array.isArray(taskInfo.extractedImageUrls)) {
          console.log(`✅ 从 taskInfo.extractedImageUrls 找到 ${taskInfo.extractedImageUrls.length} 个URL`);
          urls.push(...taskInfo.extractedImageUrls);
        }
        
        if (taskInfo.result_urls && Array.isArray(taskInfo.result_urls)) {
          console.log(`✅ 从 taskInfo.result_urls 找到 ${taskInfo.result_urls.length} 个URL`);
          urls.push(...taskInfo.result_urls);
        }
        
      } catch (e: any) {
        console.error('❌ 解析 task_info 失败:', e.message);
      }
    }
    
    // 3. 深度搜索以防万一
    const deepSearch = (obj: any, path: string = ''): string[] => {
      const foundUrls: string[] = [];
      
      if (!obj || typeof obj !== 'object') return foundUrls;
      
      if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          foundUrls.push(...deepSearch(item, `${path}[${index}]`));
        });
        return foundUrls;
      }
      
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;
        
        // 检查是否是URL字符串
        if (typeof value === 'string' && isImageUrl(value)) {
          console.log(`🔎 深度搜索找到URL (${currentPath}):`, value.substring(0, 80));
          foundUrls.push(value);
        }
        // 如果是对象或数组，继续搜索
        else if (value && typeof value === 'object') {
          foundUrls.push(...deepSearch(value, currentPath));
        }
      }
      
      return foundUrls;
    };
    
    urls.push(...deepSearch(taskData, 'taskData'));
    
    // 去重
    const uniqueUrls = [...new Set(urls.filter(url => url && url.trim()))];
    console.log(`🎯 总共提取到 ${uniqueUrls.length} 个唯一图片URL:`, uniqueUrls);
    console.log('=================================');
    
    return uniqueUrls;
  }, [isImageUrl]);

  // 轮询后端查询任务状态
  const pollTaskStatusViaBackend = useCallback((taskId: string): Promise<TaskResult> => {
    return new Promise((resolve) => {
      let attempts = 0;
      let consecutiveErrors = 0;
      
      const controller = new AbortController();
      pollingControllerRef.current = controller;
      
      const calculatePollInterval = (attempt: number): number => {
        if (attempt < 10) return 3000;
        if (attempt < 30) return 5000;
        if (attempt < 60) return 8000;
        if (attempt < 90) return 12000;
        return BACKEND_CONFIG.maxPollInterval;
      };
      
      const poll = async () => {
        const currentAttempt = attempts + 1;
        const elapsedMs = Date.now() - taskStartTimeRef.current;
        const elapsedMinutes = Math.round(elapsedMs / 60000);
        
        // 检查总超时
        if (elapsedMs > BACKEND_CONFIG.timeout) {
          const timeoutMessage = `任务处理超时（${elapsedMinutes}分钟），请稍后查看`;
          cleanupPolling();
          setIsGenerating(false);
          setGenerationStatus('timeout');
          setStatusMessage(timeoutMessage);
          recordStatus('backend_timeout', timeoutMessage, { attempts, elapsedMinutes });
          
          resolve({
            status: 'timeout',
            message: timeoutMessage,
            taskData: { attempts, elapsedMinutes }
          });
          return;
        }
        
        // 检查最大尝试次数
        if (currentAttempt > BACKEND_CONFIG.maxAttempts) {
          const maxAttemptsMessage = `已达到最大查询次数（${elapsedMinutes}分钟），请稍后查看`;
          cleanupPolling();
          setIsGenerating(false);
          setGenerationStatus('timeout');
          setStatusMessage(maxAttemptsMessage);
          recordStatus('backend_max_attempts', maxAttemptsMessage, { attempts, elapsedMinutes });
          
          resolve({
            status: 'timeout',
            message: maxAttemptsMessage,
            taskData: { attempts, elapsedMinutes }
          });
          return;
        }

        if (controller.signal.aborted) {
          console.log('轮询已被取消');
          return;
        }

        attempts = currentAttempt;
        
        // 更新状态消息
        let statusMsg = '正在查询任务状态...';
        if (elapsedMinutes < 1) {
          statusMsg = '任务处理中...';
        } else if (elapsedMinutes < 3) {
          statusMsg = `任务处理中（${elapsedMinutes}分钟）...`;
        } else if (elapsedMinutes < 5) {
          statusMsg = `任务需要更多时间（${elapsedMinutes}分钟）...`;
        } else {
          statusMsg = `复杂图像生成中（${elapsedMinutes}分钟），请耐心等待...`;
        }
        
        setStatusMessage(statusMsg);
        
        console.log(`🔄 查询任务状态... (${currentAttempt}/${BACKEND_CONFIG.maxAttempts}, ${elapsedMinutes}分钟)`);

        try {
          // 调用后端查询接口
          const response = await fetch(BACKEND_CONFIG.queryEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ taskId }),
            signal: controller.signal,
          });
          
          console.log('📡 后端查询响应状态:', response.status);
          
          const data = await response.json();
          console.log('📊 后端查询响应数据 code:', data.code, 'message:', data.msg);
          
          recordStatus('backend_query_response', `查询 ${currentAttempt} 次`, {
            code: data.code,
            hasData: !!data.data,
            elapsedMinutes
          });
          
          if (response.ok && data.code === 0 && data.data) {
            const task = data.data;
            
            console.log('🎯 后端任务数据状态:', task.status);
            
            consecutiveErrors = 0;
            
            // 关键修复：检查多种完成状态
            const isCompleted = 
              task.status === 'completed' || 
              task.status === 'success' ||
              (task.task_info && task.task_info.includes('"kieStatus":"success"')) ||
              (task.task_result && task.task_result.includes('"success":true'));
            
            console.log('🔍 状态检查:', {
              status: task.status,
              isCompleted,
              hasTaskResult: !!task.task_result
            });
            
            if (isCompleted) {
              console.log('🎉 任务已完成/成功，直接返回');
              
              // 从任务数据中提取图片URL
              const imageUrls = extractImageUrlsFromTaskData(task);
              
              console.log('📸 从已完成任务中提取到', imageUrls.length, '个图片URL');
              
              if (imageUrls.length > 0) {
                const successMessage = `图片生成成功！已生成 ${imageUrls.length} 张图片`;
                
                // 确保按正确顺序更新状态
                cleanupPolling();
                setIsGenerating(false);
                setGenerationStatus('success');
                setStatusMessage(successMessage);
                
                // 使用函数式更新确保图片正确设置
                setGeneratedImages(prev => {
                  const combined = [...prev, ...imageUrls];
                  return [...new Set(combined)];
                });
                
                recordStatus('backend_completed', successMessage, { 
                  imageCount: imageUrls.length,
                  taskId: task.id,
                  taskStatus: task.status
                });
                
                resolve({
                  status: 'succeeded',
                  output: imageUrls,
                  images: imageUrls,
                  id: task.id,
                  taskData: task
                });
                return;
              } else {
                console.warn('⚠️ 任务完成但未提取到图片URL');
                
                // 不返回错误，继续轮询等待图片URL出现
                recordStatus('backend_no_images', '任务完成但未提取到图片URL，继续轮询', task);
                
                const nextInterval = calculatePollInterval(attempts);
                pollingTimeoutRef.current = setTimeout(poll, nextInterval);
              }
              
            } else if (task.status === 'failed' || task.status === 'error') {
              const errorMsg = extractErrorMessageFromTaskData(task);
              const errorMessage = `图片生成失败: ${errorMsg}`;
              
              cleanupPolling();
              setIsGenerating(false);
              setGenerationStatus('error');
              setStatusMessage(errorMessage);
              recordStatus('backend_failed', errorMessage, { error: errorMsg, task });
              
              resolve({
                status: 'failed',
                error: errorMessage,
                taskData: task
              });
              return;
            }
            
            // 还在处理中，继续轮询
            const nextInterval = calculatePollInterval(attempts);
            pollingTimeoutRef.current = setTimeout(poll, nextInterval);
            
          } else {
            // 后端查询失败
            consecutiveErrors++;
            const errorMsg = data.msg || `查询失败 (code: ${data.code || 'unknown'})`;
            console.warn(`⚠️ 后端查询失败 ${consecutiveErrors} 次:`, errorMsg);
            
            if (consecutiveErrors >= 10) {
              const errorMessage = '服务不稳定，请稍后查看';
              cleanupPolling();
              setIsGenerating(false);
              setGenerationStatus('timeout');
              setStatusMessage(errorMessage);
              recordStatus('backend_max_query_errors', errorMessage, { consecutiveErrors });
              
              resolve({
                status: 'timeout',
                message: errorMessage,
                taskData: { consecutiveErrors }
              });
              return;
            }
            
            const retryInterval = Math.min(
              calculatePollInterval(attempts) * (consecutiveErrors + 1),
              30000
            );
            pollingTimeoutRef.current = setTimeout(poll, retryInterval);
          }
          
        } catch (error: any) {
          if (error.name === 'AbortError') {
            console.log('轮询请求被中止:', error.message);
            return;
          }
          
          consecutiveErrors++;
          console.error(`❌ 后端查询出错 ${consecutiveErrors} 次:`, error);
          
          if (consecutiveErrors >= 5) {
            const errorMessage = '网络连接不稳定，请稍后查看结果';
            cleanupPolling();
            setIsGenerating(false);
            setGenerationStatus('timeout');
            setStatusMessage(errorMessage);
            recordStatus('backend_max_network_errors', errorMessage, { consecutiveErrors });
            
            resolve({
              status: 'timeout',
              message: errorMessage,
              taskData: { consecutiveErrors }
            });
            return;
          }
          
          const retryInterval = Math.min(
            5000 * Math.pow(2, consecutiveErrors),
            30000
          );
          console.log(`🔄 网络错误，${retryInterval}ms后重试...`);
          pollingTimeoutRef.current = setTimeout(poll, retryInterval);
        }
      };

      // 开始轮询
      const initialInterval = calculatePollInterval(0);
      pollingTimeoutRef.current = setTimeout(poll, initialInterval);
    });
  }, [cleanupPolling, recordStatus, extractImageUrlsFromTaskData]);

  // 从任务数据中提取错误信息
  const extractErrorMessageFromTaskData = useCallback((taskData: any): string => {
    if (!taskData) return '未知错误';
    
    try {
      // 从task_result提取
      if (taskData.task_result) {
        try {
          const taskResult = typeof taskData.task_result === 'string' 
            ? JSON.parse(taskData.task_result) 
            : taskData.task_result;
          
          if (taskResult.error) return taskResult.error;
          if (taskResult.message) return taskResult.message;
          if (taskResult.msg) return taskResult.msg;
        } catch (e) {
          // 忽略解析错误
        }
      }
      
      return '任务失败';
      
    } catch (error) {
      return '解析错误信息失败';
    }
  }, []);

  // 处理图片生成（通过后端）
  const handleImageGeneration = useCallback(async (prompt: string, options: any = {}): Promise<TaskResult> => {
    console.log('🎨 开始生成图片（通过后端）:', { prompt, options });
    
    // 清理之前的轮询和状态
    cleanupPolling();
    setGeneratedImages([]);
    setGenerationStatus('processing');
    setStatusMessage('正在创建生成任务...');
    setTaskHistory([]);
    setCurrentTaskId(null);
    
    recordStatus('generation_started', '开始生成图片', { prompt, options });
    
    try {
      // 1. 通过后端创建任务
      setStatusMessage('正在提交请求到后端...');
      
      const createResponse = await fetch(BACKEND_CONFIG.createEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // 关键修复：使用后端期望的字段名
          provider: 'kie',
          mediaType: 'image',      // 驼峰命名
          model: 'gpt4o-image',
          prompt: prompt.trim(),
          options: {
            size: options?.size || "1:1",
            nVariants: options?.nVariants || 1,
            ...options
          },
          scene: 'text-to-image'   // 必需字段
        }),
      });

      console.log('📡 创建响应状态:', createResponse.status, createResponse.ok);
      
      const createData = await createResponse.json();
      console.log('📨 后端创建响应:', createData);
      
      // 检查响应格式
      if (!createResponse.ok || createData.code !== 0) {
        const errorMsg = createData.msg || createData.message || `创建任务失败: ${createResponse.status}`;
        console.error('❌ 创建任务失败:', errorMsg, createData);
        throw new Error(errorMsg);
      }
      
      // 解析任务数据
      let taskData = createData.data || createData;
      console.log('📊 任务数据:', taskData);
      
      // 获取任务ID（尝试多种可能的字段）
      let taskId = taskData.taskId || taskData.id || taskData.task_id;
      
      if (!taskId) {
        console.error('❌ 无法找到任务ID:', taskData);
        throw new Error('服务器返回的数据中不包含有效的任务ID');
      }
      
      console.log('✅ 获取到任务ID:', taskId, '类型:', typeof taskId);
      
      setCurrentTaskId(taskId);
      taskStartTimeRef.current = Date.now();
      setIsGenerating(true);
      
      const submittedMessage = '任务已创建，开始处理...';
      setStatusMessage(submittedMessage);
      recordStatus('task_created', submittedMessage, { 
        taskId,
        taskData 
      });
      
      // 2. 立即查询一次任务状态
      try {
        console.log('🔍 立即查询任务状态，ID:', taskId);
        const immediateResponse = await fetch(BACKEND_CONFIG.queryEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId })
        });
        
        const immediateData = await immediateResponse.json();
        console.log('📋 立即查询结果:', immediateData);
        
        if (immediateData.code === 0 && immediateData.data) {
          const task = immediateData.data;
          console.log('🎯 任务初始状态:', {
            id: task.id,
            status: task.status,
            hasTaskResult: !!task.task_result,
            hasTaskInfo: !!task.task_info
          });
          
          // 如果已经完成，直接提取图片
          if (task.status === 'completed' || task.status === 'success') {
            const imageUrls = extractImageUrlsFromTaskData(task);
            if (imageUrls.length > 0) {
              console.log('🎉 任务已经完成，直接返回图片');
              setGeneratedImages(imageUrls);
              setGenerationStatus('success');
              setStatusMessage(`已生成 ${imageUrls.length} 张图片`);
              setIsGenerating(false);
              
              return {
                status: 'succeeded',
                output: imageUrls,
                images: imageUrls,
                id: task.id,
                taskData: task
              };
            }
          }
        }
      } catch (immediateError) {
        console.log('⚠️ 立即查询失败，继续轮询:', immediateError);
      }
      
      // 3. 开始轮询任务状态
      const result = await pollTaskStatusViaBackend(taskId);
      
      if (result.status === 'succeeded') {
        console.log('✅ 图片生成成功:', result);
        return result;
      } else if (result.status === 'timeout') {
        console.log('⏰ 任务处理时间较长:', result.message);
        return result;
      } else {
        console.error('❌ 图片生成失败:', result.error);
        return result;
      }
      
    } catch (error: any) {
      console.error('❌ 图片生成过程出错:', error);
      
      const errorMessage = `生成失败: ${error.message}`;
      setIsGenerating(false);
      setGenerationStatus('error');
      setStatusMessage(errorMessage);
      recordStatus('generation_failed', errorMessage, { error: error.message });
      
      return {
        status: 'failed',
        error: error.message,
        taskData: { error: error.message }
      };
    }
  }, [pollTaskStatusViaBackend, cleanupPolling, recordStatus, extractImageUrlsFromTaskData]);

  // 显示通知
  const showNotification = useCallback((message: string, type: 'success' | 'warning' | 'error' = 'success') => {
    const colors = {
      success: 'bg-green-500',
      warning: 'bg-yellow-500',
      error: 'bg-red-500'
    };
    
    const icons = {
      success: `✅`,
      warning: `⚠️`,
      error: `❌`
    };
    
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 ${colors[type]} text-white px-4 py-2 rounded shadow-lg z-50 text-sm animate-fade-in flex items-center gap-2`;
    toast.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        setTimeout(() => {
          if (toast.parentNode) {
            document.body.removeChild(toast);
          }
        }, 300);
      }
    }, 3000);
  }, []);

  // 取消生成
  const cancelGeneration = useCallback(() => {
    cleanupPolling();
    setIsGenerating(false);
    setGenerationStatus('idle');
    setStatusMessage('已取消生成');
    setCurrentTaskId(null);
    recordStatus('cancelled', '用户取消生成');
    
    showNotification('已取消图片生成', 'warning');
  }, [cleanupPolling, showNotification, recordStatus]);

  // 重新检查任务状态
  const recheckTaskStatus = useCallback(async () => {
    if (!currentTaskId) {
      showNotification('没有可检查的任务', 'warning');
      return;
    }
    
    console.log('🔄 手动重新检查任务状态:', currentTaskId);
    setStatusMessage('正在手动检查任务状态...');
    
    try {
      const response = await fetch(BACKEND_CONFIG.queryEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskId: currentTaskId }),
      });

      const data = await response.json();
      console.log('📊 手动检查响应:', data);
      
      if (data.code === 0 && data.data) {
        const task = data.data;
        
        console.log('🔍 手动检查任务状态:', {
          status: task.status,
          hasTaskResult: !!task.task_result,
          hasTaskInfo: !!task.task_info
        });
        
        if (task.status === 'completed' || task.status === 'success') {
          const imageUrls = extractImageUrlsFromTaskData(task);
          console.log('📸 手动检查提取的图片URL:', imageUrls);
          
          if (imageUrls.length > 0) {
            setGenerationStatus('success');
            setStatusMessage('图片生成成功！');
            setGeneratedImages(prev => [...prev, ...imageUrls]);
            setIsGenerating(false);
            cleanupPolling();
            showNotification(`发现 ${imageUrls.length} 张已生成的图片`, 'success');
            recordStatus('manual_found_completed', '手动检查发现任务已完成', { 
              imageCount: imageUrls.length 
            });
          } else {
            showNotification('任务完成但未找到图片URL', 'warning');
          }
        } else {
          showNotification(`当前状态: ${task.status}`, 'warning');
        }
      } else {
        showNotification(`查询失败: ${data.msg || '未知错误'}`, 'error');
      }
    } catch (error) {
      console.error('重新检查失败:', error);
      showNotification('重新检查失败', 'error');
    }
  }, [currentTaskId, extractImageUrlsFromTaskData, showNotification, recordStatus, cleanupPolling]);

  // 查看任务历史
  const viewTaskHistory = useCallback(() => {
    console.log('📋 任务历史:', taskHistory);
    
    const historyText = taskHistory.map((entry, index) => 
      `${index + 1}. ${new Date(entry.timestamp).toLocaleTimeString()}: ${entry.status} - ${entry.message}`
    ).join('\n');
    
    alert(`任务历史记录:\n\n${historyText}`);
  }, [taskHistory]);

  // 计算已等待时间
  const getElapsedTime = useCallback(() => {
    if (!taskStartTimeRef.current) return '0分钟';
    const minutes = Math.floor((Date.now() - taskStartTimeRef.current) / 60000);
    const seconds = Math.floor(((Date.now() - taskStartTimeRef.current) % 60000) / 1000);
    return minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`;
  }, []);

  // 自动修复状态：如果生成了图片但状态不是success，自动修复
  useEffect(() => {
    if (generatedImages.length > 0 && generationStatus !== 'success') {
      console.log('🔄 检测到图片但状态不正确，自动修复状态...');
      setGenerationStatus('success');
      setStatusMessage(`已生成 ${generatedImages.length} 张图片`);
    }
  }, [generatedImages.length, generationStatus]);

  // 检查是否有未完成的任务（页面加载时）
  useEffect(() => {
    const checkExistingTask = async () => {
      const savedTaskId = localStorage.getItem('lastAITaskId');
      if (savedTaskId) {
        console.log('🔍 检查上次的任务:', savedTaskId);
        try {
          const response = await fetch(BACKEND_CONFIG.queryEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ taskId: savedTaskId })
          });
          
          const data = await response.json();
          console.log('📊 检查上次任务响应:', data);
          
          if (data.code === 0 && data.data) {
            const task = data.data;
            console.log('🔍 上次任务状态:', {
              status: task.status,
              hasTaskResult: !!task.task_result
            });
            
            if (task.status === 'completed' || task.status === 'success') {
              const imageUrls = extractImageUrlsFromTaskData(task);
              console.log('📸 上次任务的图片URL:', imageUrls);
              
              if (imageUrls.length > 0) {
                setCurrentTaskId(savedTaskId);
                setGeneratedImages(imageUrls);
                setGenerationStatus('success');
                setStatusMessage('找到上次生成的图片！');
                showNotification(`加载了 ${imageUrls.length} 张上次生成的图片`, 'success');
              }
            } else if (task.status === 'processing') {
              // 继续轮询
              setCurrentTaskId(savedTaskId);
              setIsGenerating(true);
              setGenerationStatus('processing');
              taskStartTimeRef.current = Date.now() - 60000;
              pollTaskStatusViaBackend(savedTaskId);
            }
          }
        } catch (error) {
          console.error('检查上次任务失败:', error);
        }
      }
    };
    
    checkExistingTask();
  }, [pollTaskStatusViaBackend, extractImageUrlsFromTaskData, showNotification]);

  // 保存当前任务ID到localStorage
  useEffect(() => {
    if (currentTaskId) {
      localStorage.setItem('lastAITaskId', currentTaskId);
    }
  }, [currentTaskId]);

  // 图片下载函数
// 替换现有的 downloadImage 函数
const downloadImage = useCallback(async (url: string, index: number) => {
  try {
    console.log('📥 尝试下载图片:', url);
    
    // 方法1：直接创建链接并点击（最简单直接）
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-generated-${Date.now()}-${index}.png`;
    
    // 设置必要的属性
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    
    // 添加到文档并点击
    document.body.appendChild(link);
    link.click();
    
    // 延迟清理
    setTimeout(() => {
      document.body.removeChild(link);
    }, 100);
    
    // 显示消息让用户知道可能需要手动保存
    showNotification(`已打开图片，请右键图片选择"另存为"`, 'success');
    
  } catch (error: any) {
    console.error('❌ 下载图片失败:', error);
    
    // 备用方案：直接打开新窗口
    try {
      const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
      if (newWindow) {
        showNotification('已在新窗口打开图片，请右键保存', 'warning');
      } else {
        // 如果弹出窗口被阻止，提示用户
        showNotification('请复制图片链接到浏览器地址栏手动下载', 'error');
      }
    } catch (windowError) {
      // 最后的方法：显示URL让用户手动复制
      const shouldCopy = window.confirm(`下载失败，是否复制图片链接？\n\n${url}`);
      if (shouldCopy) {
        try {
          await navigator.clipboard.writeText(url);
          showNotification('已复制图片链接到剪贴板', 'success');
        } catch (copyError) {
          prompt('请手动复制图片链接:', url);
        }
      }
    }
  }
}, [showNotification]);

  // 批量下载所有图片
  // 增强批量下载所有图片
const downloadAllImages = useCallback(async () => {
  if (generatedImages.length === 0) {
    showNotification('没有可下载的图片', 'warning');
    return;
  }
  
  // 如果图片数量多，使用zip下载
  if (generatedImages.length > 5) {
    showNotification('图片数量较多，建议逐一下载或使用批量下载工具', 'warning');
    
    // 逐一下载，但添加延迟避免请求过多
    for (let i = 0; i < generatedImages.length; i++) {
      setTimeout(() => {
        downloadImage(generatedImages[i], i + 1);
      }, i * 1000); // 每张图片间隔1秒
    }
    
    showNotification(`开始顺序下载 ${generatedImages.length} 张图片`, 'success');
    return;
  }
  
  // 图片数量少，同时下载
  try {
    const downloadPromises = generatedImages.map((url, index) => 
      downloadImage(url, index + 1)
    );
    
    await Promise.all(downloadPromises);
    showNotification(`已开始下载 ${generatedImages.length} 张图片`, 'success');
  } catch (error) {
    console.error('❌ 批量下载失败:', error);
    showNotification('部分图片下载失败', 'error');
  }
}, [generatedImages, downloadImage, showNotification]);

  // 添加动画样式
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fade-in {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes slide-out {
        to { opacity: 0; transform: translateX(20px); }
      }
      .animate-fade-in {
        animation: fade-in 0.3s ease-out;
      }
      .animate-slide-out {
        animation: slide-out 0.3s ease-out forwards;
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      .animate-pulse-slow {
        animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      }
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      .animate-spin {
        animation: spin 1s linear infinite;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className={className} ref={containerRef}>
      <PageHeader
        title={mergedTranslations.page.title}
        description={mergedTranslations.page.description}
        className="mt-16 -mb-32"
      />
      
      {/* 高级状态指示器 */}
      {generationStatus !== 'idle' && (
        <div className="fixed bottom-4 right-4 z-40 max-w-md">
          <div className={`px-4 py-3 rounded-lg shadow-lg ${
            generationStatus === 'processing' ? 'bg-blue-500 text-white' :
            generationStatus === 'success' ? 'bg-green-500 text-white' :
            generationStatus === 'error' ? 'bg-red-500 text-white' :
            'bg-yellow-500 text-white'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {generationStatus === 'processing' && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                )}
                {generationStatus === 'timeout' && (
                  <div className="animate-pulse-slow h-4 w-4 rounded-full bg-white"></div>
                )}
                <div>
                  <span className="text-sm font-medium">{statusMessage}</span>
                  {generationStatus === 'processing' && (
                    <div className="text-xs opacity-80 mt-1">
                      等待: {getElapsedTime()} | 任务: {currentTaskId?.substring(0, 8)}...
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {(generationStatus === 'processing' || generationStatus === 'timeout') && (
                  <>
                    <button
                      onClick={recheckTaskStatus}
                      className="text-xs px-2 py-1 bg-white/20 rounded hover:bg-white/30 transition-colors"
                      title="手动检查任务状态"
                    >
                      刷新
                    </button>
                    <button
                      onClick={cancelGeneration}
                      className="text-xs px-2 py-1 bg-white/20 rounded hover:bg-white/30 transition-colors"
                    >
                      取消
                    </button>
                  </>
                )}
                {generationStatus === 'success' && generatedImages.length > 0 && (
                  <button
                    onClick={downloadAllImages}
                    className="text-xs px-2 py-1 bg-white/20 rounded hover:bg-white/30 transition-colors"
                    title="下载全部图片"
                  >
                    下载全部
                  </button>
                )}
                {taskHistory.length > 0 && (
                  <button
                    onClick={viewTaskHistory}
                    className="text-xs px-2 py-1 bg-white/20 rounded hover:bg-white/30 transition-colors"
                    title="查看任务历史记录"
                  >
                    历史
                  </button>
                )}
              </div>
            </div>
            
            {/* 进度指示器 */}
            {generationStatus === 'processing' && (
              <div className="mt-2">
                <div className="h-1 bg-white/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white transition-all duration-1000 ease-out"
                    style={{ 
                      width: `${Math.min(95, (taskHistory.length / 30) * 100)}%` 
                    }}
                  ></div>
                </div>
                <div className="text-xs mt-1 opacity-80 flex justify-between">
                  <span>任务处理中...</span>
                  <span>查询次数: {taskHistory.length}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* 图片预览面板 */}
      {generatedImages.length > 0 && (
        <div className="fixed bottom-20 right-4 z-40 max-w-xs">
          <div className="bg-white rounded-lg shadow-xl p-3 border">
            <div className="text-sm font-medium text-gray-900 mb-2 flex items-center justify-between">
              <span>
                {generationStatus === 'success' ? '🎨 生成完成' : '🖼️ 已生成图片'} 
                ({generatedImages.length}张)
              </span>
              <span className="text-xs text-gray-500">
                {currentTaskId?.substring(0, 8)}...
              </span>
            </div>
            <div className="space-y-2">
              {generatedImages.slice(0, 3).map((url, index) => (
                <div key={index} className="relative group">
                  <img 
                    src={url} 
                    alt={`生成结果 ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                    onError={(e) => {
                      console.error('❌ 图片加载失败:', url);
                      (e.target as HTMLImageElement).style.display = 'none';
                      showNotification(`图片 ${index + 1} 加载失败`, 'warning');
                      
                      // 尝试重新加载
                      setTimeout(() => {
                        console.log('🔄 尝试重新加载图片...');
                        (e.target as HTMLImageElement).src = url + '?retry=' + Date.now();
                      }, 2000);
                    }}
                    onLoad={() => {
                      console.log(`✅ 图片 ${index + 1} 加载成功:`, url);
                      // 如果之前是错误状态，更新状态
                      if (generationStatus !== 'success') {
                        console.log('🔄 图片加载成功，更新状态...');
                        setGenerationStatus('success');
                        setStatusMessage('图片生成成功！');
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-lg">
                    <a 
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-white text-sm px-3 py-1 bg-blue-500 rounded hover:bg-blue-600 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      查看原图
                    </a>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadImage(url, index + 1);
                      }}
                      className="text-white text-sm px-3 py-1 bg-green-500 rounded hover:bg-green-600 transition-colors"
                    >
                      下载
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {generatedImages.length > 3 && (
              <div className="text-xs text-gray-500 mt-2 text-center">
                还有 {generatedImages.length - 3} 张图片...
              </div>
            )}
            <div className="flex gap-2 mt-3">
              <button
                onClick={downloadAllImages}
                className="flex-1 text-sm px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                下载全部
              </button>
              <button
                onClick={() => {
                  setGeneratedImages([]);
                  setGenerationStatus('idle');
                  setCurrentTaskId(null);
                  localStorage.removeItem('lastAITaskId');
                  showNotification('已清除图片预览', 'success');
                }}
                className="flex-1 text-sm px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                清除
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 调试信息面板（仅在开发模式显示） */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 right-4 z-30">
          <details className="bg-gray-800 text-white text-xs rounded-lg p-2 max-w-xs">
            <summary className="cursor-pointer font-medium">🔧 调试信息</summary>
            <div className="mt-2 space-y-1">
              <div>当前任务: {currentTaskId || '无'}</div>
              <div>历史记录: {taskHistory.length} 条</div>
              <div>生成状态: {generationStatus}</div>
              <div>已生成图片: {generatedImages.length} 张</div>
              <div>等待时间: {getElapsedTime()}</div>
              <button
                onClick={() => console.log('完整历史:', taskHistory)}
                className="mt-2 px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 w-full transition-colors"
              >
                输出完整日志
              </button>
            </div>
          </details>
        </div>
      )}
      
      <ImageGenerator 
        srOnlyTitle={mergedTranslations.generator.title}
        onGenerate={handleImageGeneration}
        isGenerating={isGenerating}
      />
    </div>
  );
}