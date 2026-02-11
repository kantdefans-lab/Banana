'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import PromptInput from './components/PromptInput';
import ModelSelector from './components/ModelSelector';
import ParameterPanel from './components/ParameterPanel';
import ImageGallery from './components/ImageGallery';
import CreditBalance from './components/CreditBalance';
import { generateImage, queryTaskStatus } from './actions/generate';
import { toast, Toaster } from 'react-hot-toast';
import { Sparkles, Zap, History, Settings, ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function GeneratePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('gpt4o-image');
  const [parameters, setParameters] = useState({
    size: '1:1',
    numImages: 1,
    quality: 'standard',
    style: 'vivid',
    seed: null as number | null,
  });
  const [loading, setLoading] = useState(false);
  const [currentTask, setCurrentTask] = useState<any>(null);
  const [userCredits, setUserCredits] = useState(100);

  // 从URL获取提示词
  useEffect(() => {
    const urlPrompt = searchParams.get('prompt');
    if (urlPrompt) {
      setPrompt(decodeURIComponent(urlPrompt));
    }
  }, [searchParams]);

  
  // ✅ 自动修复补充的轮询函数
  const startPollingTask = async (taskId: string) => {
    console.log('Starting polling for task:', taskId);
    // 模拟轮询逻辑
    try {
       const result = await queryTaskStatus(taskId);
       if (result?.data?.status === 'completed') {
         toast.success('生成成功！');
       }
    } catch (e) {
       console.error(e);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('请输入提示词');
      return;
    }

    if (userCredits < 2) {
      toast.error('积分不足，请先购买积分');
      router.push('/pricing');
      return;
    }

    setLoading(true);
    
    try {
      const result = await generateImage({
        prompt,
        provider: 'kie',
        model,
        media_type: 'image',
        scene: 'text-to-image',
        options: {
          size: parameters.size,
          nVariants: parameters.numImages,
          quality: parameters.quality,
          style: parameters.style,
          ...(parameters.seed && { seed: parameters.seed }),
        },
      });

      if (result.code === 0) {
        // 任务创建成功
        setUserCredits(prev => prev - result.data.costCredits);
        toast.success('开始生成图片，请稍候...');
        
        // 开始轮询任务状态
        startPollingTask(result.data.id);
      } else {
        toast.error(result.message || '生成失败');
      }
    } catch (error: any) {
      toast.error(error.message || '生成失败');
    } finally {
      setLoading(false);
    }
  };

  // ... 其他函数 ...

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Toaster position="top-right" />
      
      {/* 导航栏 */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/')}
                className="mr-4 p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <Sparkles className="h-8 w-8 text-purple-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">AI 图像生成</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <CreditBalance credits={userCredits} />
              <button
                onClick={() => router.push('/history')}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                <History className="h-5 w-5 mr-2" />
                历史记录
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* 提示词输入区域 */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              输入你的创意
            </h2>
            
            <PromptInput
              value={prompt}
              onChange={setPrompt}
              onGenerate={handleGenerate}
              loading={loading}
            />
          </div>

          {/* 模型选择 */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              选择 AI 模型
            </h2>
            <ModelSelector
              selectedModel={model}
              onSelect={setModel}
              userCredits={userCredits}
            />
          </div>

          {/* 参数调整 */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Settings className="h-6 w-6 mr-2 text-gray-500" />
              参数设置
            </h2>
            <ParameterPanel
              parameters={parameters}
              onChange={setParameters}
              model={model}
            />
          </div>

          {/* 生成按钮 */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-lg p-1">
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="w-full bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl py-6 px-6 flex items-center justify-center transition-all duration-200"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-purple-600 mr-3"></div>
                  <span className="text-xl font-medium">生成中...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-7 w-7 mr-3 text-purple-600" />
                  <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    生成图片
                  </span>
                  <span className="ml-3 text-gray-500">(消耗 2 积分)</span>
                </>
              )}
            </button>
          </div>

          {/* 生成结果 */}
          {currentTask && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                生成结果
              </h2>
              <ImageGallery
                images={currentTask.images || []}
                loading={loading}
                prompt={prompt}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}