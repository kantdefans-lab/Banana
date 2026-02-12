'use client';

import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { useSearchParams } from 'next/navigation'; 
import { 
  ChevronDown, 
  Sparkles, 
  Info, 
  Coins, 
  Film,
  Check,
  Loader2,
  AlertCircle,
  CloudUpload,
  Clock,       
  Monitor,
  History,   
  Download,
  ChevronLeft,
  CreditCard,
  Layers, 
} from 'lucide-react';
import Link from 'next/link';

const API_BASE_URL = "/api/video";
const WAVESPEED_MODELS_API = "/api/wavespeed/models?media=video";

// --- 工具函数 ---
const safeParse = (data: any): any => {
  if (!data) return null;
  if (typeof data !== 'string') return data;
  try {
    const parsed = JSON.parse(data);
    if (typeof parsed === 'string') return safeParse(parsed);
    return parsed;
  } catch (e) {
    return null;
  }
};

const deepExtractVideoUrl = (obj: any): string | null => {
  let foundUrl: string | null = null;
  const visited = new Set<any>();

  const traverse = (current: any) => {
    if (foundUrl) return; 
    if (!current) return;
    if (typeof current === 'object') {
        if (visited.has(current)) return;
        visited.add(current);
    }
    if (Array.isArray(current)) {
      current.forEach(item => traverse(item));
      return;
    }
    if (typeof current === 'object') {
      const candidate = current.video_url || current.videoUrl || current.url || current.result_url || current.output_video_url;
      if (typeof candidate === 'string' && candidate.match(/\.(mp4|mov|webm|mkv)$/i)) {
        foundUrl = candidate;
        return;
      }
      if (Array.isArray(current.resultUrls)) {
         const vid = current.resultUrls.find((u: any) => typeof u === 'string' && u.match(/\.(mp4|mov|webm)$/i));
         if (vid) { foundUrl = vid; return; }
      }
      Object.keys(current).forEach(key => {
        if (key !== 'prompt' && key !== 'input') traverse(current[key]);
      });
      return;
    }
    if (typeof current === 'string') {
      if (current.match(/^https?:\/\/.*\.(mp4|mov|webm)$/i)) {
         foundUrl = current;
      } else if (current.startsWith('{') || current.startsWith('[')) {
        try { traverse(JSON.parse(current)); } catch (e) {}
      }
    }
  };
  traverse(obj);
  return foundUrl;
};

// --- 接口定义 ---
interface GeneratedVideo {
  id: string;
  url: string;
  prompt: string;
  model: string;
  createdAt: string;
  type: 'Text to Video' | 'Image to Video';
  duration?: string;
}

interface ModelOption {
  id: string;
  name: string;
  icon: string;
  badges: { text: string; type: 'premium' | 'audio' | 'hot' | 'new' | 'fast' }[];
  description: string;
  highlightNote?: string;
  tags: { icon?: React.ReactNode; text: string }[];
  apiModelValue: string; 
  // 支持文生图/图生图不同价格
  credits: { text: number; image: number };
  wsType?: string;
}

type WaveSpeedModelBrief = {
  model_id: string;
  name?: string;
  type?: string;
  description?: string;
  base_price?: number | string;
};

interface VideoGeneratorProps {
  initialPrompt?: string;
  initialModel?: string; 
  initialTab?: 'text' | 'image'; 
  initialHistory?: GeneratedVideo[];
  initialImageUrl?: string; 
  isLoggedIn: boolean; 
}

const VideoGenerator = ({ 
  initialPrompt = '', 
  initialModel = '', 
  initialTab = 'text', 
  initialHistory = [],
  initialImageUrl = '', 
  isLoggedIn = false 
}: VideoGeneratorProps) => {
  const searchParams = useSearchParams(); 
  
  const [activeTab, setActiveTab] = useState<'text' | 'image'>('text');
  const [prompt, setPrompt] = useState('');
  const [selectedSize, setSelectedSize] = useState('16:9');
  
  // 参数状态
  const [duration, setDuration] = useState('5'); 
  const [resolution, setResolution] = useState('1080p'); 
  const [hasSound, setHasSound] = useState(false);
  const [soraSize, setSoraSize] = useState<'Standard' | 'High'>('Standard');
  const [removeWatermark, setRemoveWatermark] = useState(false);
  const [cameraFixed, setCameraFixed] = useState(false);

  // UI 状态
  const [isModelOpen, setIsModelOpen] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false); 
  
  // 历史记录
  const [history, setHistory] = useState<GeneratedVideo[]>(initialHistory || []);
  const [showHistory, setShowHistory] = useState(true); 
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);

  const [wavespeedModels, setWavespeedModels] = useState<WaveSpeedModelBrief[]>(
    []
  );
  const [isLoadingWavespeedModels, setIsLoadingWavespeedModels] =
    useState(false);
  const [wavespeedModelsError, setWavespeedModelsError] = useState<string | null>(
    null
  );
  
  // 当前展示
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // 存储远程图片的 URL（当 File 创建失败时使用它）
  const [remoteImageUrl, setRemoteImageUrl] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 初始化 Prompt 和 Tab
  useEffect(() => {
    if (initialPrompt) setPrompt(initialPrompt);
    if (initialModel) setSelectedModelId(initialModel);
    if (initialTab === 'image' || initialTab === 'text') setActiveTab(initialTab);
  }, [initialPrompt, initialModel, initialTab]);

  // 图片初始化逻辑：Props > URL Params
  useEffect(() => {
    const targetImageUrl = initialImageUrl || searchParams.get('image') || searchParams.get('img');

    const initImage = async () => {
      if (targetImageUrl) {
        setPreviewUrl(targetImageUrl);
        setRemoteImageUrl(targetImageUrl);
        setActiveTab('image');

        try {
          const response = await fetch(targetImageUrl);
          const blob = await response.blob();
          const filename = targetImageUrl.split('/').pop()?.split('?')[0] || 'initial-image.png';
          const file = new File([blob], filename, { type: blob.type });
          setSelectedImage(file);
        } catch (error) {
          console.warn("Could not convert URL to File (likely CORS). Will use URL directly.", error);
        }
      }
    };

    initImage();
  }, [initialImageUrl, searchParams]);

  // 🔥🔥🔥 核心修复：获取历史记录 (Infinite Loop Fix) 🔥🔥🔥
  useEffect(() => {
    if (!isLoggedIn) {
        setIsFetchingHistory(false);
        setHistory([]);
        return;
    }

    const fetchHistory = async () => {
      // 1. 如果 props 传入了初始历史数据，优先使用，不发请求
      if (initialHistory && initialHistory.length > 0) {
          setHistory(initialHistory);
          return; 
      }

      setIsFetchingHistory(true);
      try {
        const response = await fetch(`${API_BASE_URL}/history`); 
        if (response.ok) {
            const res = await response.json();
            if (res.code === 0 && Array.isArray(res.data)) {
                setHistory(res.data);
            }
        }
      } catch (error) {
        console.error("Failed to fetch history:", error);
      } finally {
        setIsFetchingHistory(false);
      }
    };

    fetchHistory();
    // ⚠️⚠️⚠️ 关键：依赖数组只包含 isLoggedIn，移除了 initialHistory
  }, [isLoggedIn]); 

  // 视图切换
  useEffect(() => {
    if (isLoggedIn) {
        if (generatedVideoUrl && !isLoading && !showHistory) {
           // stay in detail view
        } else if (history.length > 0 && !generatedVideoUrl) {
           setShowHistory(true);
        }
    }
  }, [history.length, isLoggedIn]);

  const getModelIcon = (modelId: string) => {
    const id = (modelId || '').toLowerCase();
    if (id.startsWith('openai/')) return '/model_icon/openai-icon.svg';
    if (id.startsWith('google/')) return '/model_icon/google-icon.svg';
    if (id.startsWith('x-ai/') || id.includes('grok')) return '/model_icon/xai-icon.svg';
    if (id.startsWith('bytedance/') || id.includes('bytedance'))
      return '/model_icon/bytedance-icon.svg';
    if (id.includes('flux')) return '/model_icon/flux-icon.svg';
    return '/model_icon/wan-icon.svg';
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoadingWavespeedModels(true);
      setWavespeedModelsError(null);
      try {
        const resp = await fetch(WAVESPEED_MODELS_API, { method: 'GET' });
        const json = await resp.json();

        if (cancelled) return;

        if (resp.ok && json?.code === 0 && Array.isArray(json?.data)) {
          setWavespeedModels(json.data as WaveSpeedModelBrief[]);
        } else {
          setWavespeedModels([]);
          setWavespeedModelsError(
            String(json?.message || `Failed to load models (${resp.status})`)
          );
        }
      } catch (e: any) {
        if (cancelled) return;
        setWavespeedModels([]);
        setWavespeedModelsError(String(e?.message || 'Failed to load models'));
      } finally {
        if (!cancelled) setIsLoadingWavespeedModels(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- legacy curated list (WaveSpeed models are loaded dynamically)
  const LEGACY_MODELS: ModelOption[] = [
    {
      id: 'veo-3-1-quality',
      name: 'Veo 3.1 Quality',
      icon: '/model_icon/google-icon.svg',
      badges: [{ text: 'ULTRA', type: 'premium' }, { text: 'AUDIO', type: 'audio' }],
      description: "Ultimate video quality with native audio—Google's most advanced model",
      highlightNote: "🚀 Google's flagship model",
      tags: [{ icon: <Clock className="h-3 w-3" />, text: '8s' }, { icon: <Layers className="h-3 w-3" />, text: '60+' }, { text: 'Text & Image' }],
      apiModelValue: 'veo3', 
      credits: { text: 15, image: 15 }
    },
    {
      id: 'veo-3-1-fast',
      name: 'Veo 3.1 Fast',
      icon: '/model_icon/google-icon.svg',
      badges: [{ text: 'FAST', type: 'fast' }, { text: 'AUDIO', type: 'audio' }],
      description: 'High-quality videos with native audio—optimized for speed',
      tags: [{ icon: <Clock className="h-3 w-3" />, text: '8s' }, { icon: <Layers className="h-3 w-3" />, text: '20+' }, { text: 'Text & Image' }],
      apiModelValue: 'veo3_fast', 
      credits: { text: 10, image: 10 }
    },
    {
      id: 'sora-2-pro',
      name: 'Sora 2 Pro',
      icon: '/model_icon/openai-icon.svg', 
      badges: [{ text: 'SOTA', type: 'premium' }, { text: 'NEW', type: 'new' }],
      description: 'OpenAI Sora 2 Pro: Generate high-fidelity videos from text or images.',
      highlightNote: "🌟 OpenAI Sora",
      tags: [{ icon: <Clock className="h-3 w-3" />, text: '10-15s' }, { text: 'Text & Image' }],
      apiModelValue: 'sora-2-pro', 
      credits: { text: 20, image: 20 }
    },
    {
      id: 'seedance-v1',
      name: 'Seedance V1',
      icon: '/model_icon/bytedance-icon.svg', 
      badges: [{ text: 'PRO', type: 'premium' }, { text: 'NEW', type: 'new' }],
      description: 'ByteDance Seedance V1: High quality video generation with camera control.',
      highlightNote: "🎬 ByteDance",
      tags: [{ icon: <Clock className="h-3 w-3" />, text: '5-10s' }, { text: 'Text & Image' }],
      apiModelValue: 'bytedance/v1-pro-text-to-video', 
      credits: { text: 15, image: 15 }
    },
    {
      id: 'kling-2.6',
      name: 'Kling 2.6',
      icon: '/model_icon/wan-icon.svg', 
      badges: [{ text: 'NEW', type: 'new' }, { text: 'REAL', type: 'hot' }],
      description: 'Kling 2.6: Exceptional realism and motion quality. Supports 1080p generation.',
      highlightNote: "✨ Realistic Motion",
      tags: [{ icon: <Clock className="h-3 w-3" />, text: '5-10s' }, { text: 'Text & Image' }],
      apiModelValue: 'kling-2.6/text-to-video', 
      credits: { text: 12, image: 12 }
    },
    {
      id: 'wan-2.6',
      name: 'Wan 2.6',
      icon: '/model_icon/wan-icon.svg',
      badges: [{ text: 'NEW', type: 'new' }, { text: '1080P', type: 'premium' }],
      description: 'Alibaba Wan 2.6: High realism, complex motion, supports 1080p and longer durations.',
      highlightNote: "🔥 New SOTA Model",
      tags: [{ icon: <Clock className="h-3 w-3" />, text: '15s' }, { text: 'Text & Image' }],
      apiModelValue: 'wan/2-6-text-to-video', 
      credits: { text: 12, image: 12 }
    },
    {
      id: 'hailuo-2.3',
      name: 'Hailuo 2.3 Pro',
      icon: '/model_icon/wan-icon.svg',
      badges: [{ text: 'PRO', type: 'premium' }, { text: 'I2V', type: 'hot' }],
      description: 'Hailuo 2.3: Professional Image-to-Video generation. Supports high quality animation.',
      highlightNote: "🚀 Pro I2V",
      tags: [{ icon: <Clock className="h-3 w-3" />, text: '6-10s' }, { text: 'Image Only' }],
      apiModelValue: 'hailuo/2-3-image-to-video-pro', 
      credits: { text: 15, image: 15 }
    }
  ];

  const wavespeedModelOptions: ModelOption[] = (wavespeedModels || [])
    .filter((m) => m && typeof m.model_id === 'string' && m.model_id.length > 0)
    .map((m) => {
      const type = m.type || '';
      const tags: { icon?: React.ReactNode; text: string }[] = [];
      if (type) tags.push({ text: type });

      return {
        id: m.model_id,
        name: m.name || m.model_id,
        icon: getModelIcon(m.model_id),
        badges: [],
        description: m.description || '',
        tags,
        apiModelValue: m.model_id,
        credits: { text: 15, image: 15 },
        wsType: type,
      };
    });

  const models = wavespeedModelOptions.filter((m) =>
    activeTab === 'image' ? m.wsType === 'image-to-video' : m.wsType === 'text-to-video'
  );

  const modelsOrPlaceholder: ModelOption[] =
    models.length > 0
      ? models
      : [
          {
            id: '',
            name: isLoadingWavespeedModels ? 'Loading models...' : 'Select a model',
            icon: '/model_icon/wan-icon.svg',
            badges: [],
            description: wavespeedModelsError
              ? `Failed to load WaveSpeed models: ${wavespeedModelsError}`
              : '',
            tags: [],
            apiModelValue: '',
            credits: { text: 15, image: 15 },
            wsType: activeTab === 'image' ? 'image-to-video' : 'text-to-video',
          },
        ];

  const activeModel =
    modelsOrPlaceholder.find((m) => m.id === selectedModelId) ||
    modelsOrPlaceholder[0];

  useEffect(() => {
    if (!activeModel) return;
    if (activeModel.id && activeModel.id !== selectedModelId) setSelectedModelId(activeModel.id);
  }, [activeModel?.id, activeTab]);

  const requiredCredits =
    activeTab === 'text'
      ? activeModel?.credits.text ?? 15
      : activeModel?.credits.image ?? 15;

  // --- Handlers ---
  const handleGeneratePrompt = () => {
    setPrompt((prev) => prev + " highly detailed, cinematic lighting, 4k resolution");
  };

  const handleTextareaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  const handleModelSelect = (id: string) => {
    setSelectedModelId(id);
    setIsModelOpen(false);
  };

  const handleDurationChange = (newDuration: string) => {
    setDuration(newDuration);
  };

  const handleResolutionChange = (newResolution: string) => {
    setResolution(newResolution);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setErrorMsg('Image size must be less than 10MB');
        return;
      }
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setRemoteImageUrl(null); // 用户上传了新图片，清除远程 URL
      setErrorMsg(null);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const downloadVideo = async (url: string) => {
    if (!url) return;
    setIsDownloading(true);
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `ai-video-${Date.now()}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
        console.error("Download failed:", e);
        window.open(url, '_blank');
    } finally {
        setIsDownloading(false);
    }
  };

  const handleHistoryClick = (item: GeneratedVideo) => {
    setGeneratedVideoUrl(item.url);
    setShowHistory(false);
    setPrompt(item.prompt);
    setActiveTab(item.type === 'Text to Video' ? 'text' : 'image');
  };

  const pollTaskStatus = async (taskId: string, attempt = 0) => {
    if (attempt > 60) {
        setIsLoading(false);
        setErrorMsg("Request timed out. Please check history later.");
        return;
    }

    const nextInterval = attempt < 5 ? 3000 : 5000;

    try {
      const response = await fetch(`${API_BASE_URL}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId })
      });

      const res = await response.json();
      
      if (res.code === 0 || res.code === 200) {
        const taskData = res.data || res;
        const statusStr = (taskData.status || taskData.state || '').toString().toLowerCase();
        
        const isSuccess = taskData.successFlag === 1 || ['success', 'completed', 'succeeded', 'succeed'].includes(statusStr);
        const isFailed = ['failed', 'error'].includes(statusStr);

        if (isSuccess) {
          let videoUrl = taskData.videoUrl || taskData.video_url;
          if (!videoUrl) {
             const sources = [taskData.taskResult, taskData.taskInfo, taskData.rawData];
             for (const s of sources) {
                 const found = deepExtractVideoUrl(safeParse(s));
                 if(found) { videoUrl = found; break; }
             }
          }

          if (videoUrl) {
            setGeneratedVideoUrl(videoUrl);
            setIsLoading(false);

            const newHistoryItem: GeneratedVideo = {
                id: taskId,
                url: videoUrl,
                prompt: prompt,
                model: activeModel.name,
                createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                type: activeTab === 'text' ? 'Text to Video' : 'Image to Video',
                duration: duration + 's'
            };
            setHistory(prev => [newHistoryItem, ...prev]);
            setShowHistory(false); 

          } else {
            setTimeout(() => pollTaskStatus(taskId, attempt + 1), nextInterval);
          }
        } else if (isFailed) {
          setIsLoading(false);
          setErrorMsg(taskData.errorMessage || 'Video generation failed.');
        } else {
          setTimeout(() => pollTaskStatus(taskId, attempt + 1), nextInterval);
        }
      } else {
        setTimeout(() => pollTaskStatus(taskId, attempt + 1), nextInterval);
      }
    } catch (err) {
      setTimeout(() => pollTaskStatus(taskId, attempt + 1), nextInterval);
    }
  };

  const handleGenerateVideo = async () => {
    if (!isLoggedIn) {
        setErrorMsg('Please sign in to generate videos.');
        return;
    }

    if (isLoadingWavespeedModels) {
      setErrorMsg('Loading models...');
      return;
    }

    if (wavespeedModelsError) {
      setErrorMsg(wavespeedModelsError);
      return;
    }

    if (!activeModel.apiModelValue) {
      setErrorMsg('No available model. Please check WaveSpeed API key/config.');
      return;
    }

    if (!prompt && activeTab === 'text') {
      setErrorMsg('Please enter a prompt description.');
      return;
    }
    
    // 验证：允许有 selectedImage (File) 或者 remoteImageUrl (String)
    if (activeTab === 'image' && !selectedImage && !remoteImageUrl) {
        setErrorMsg('Please upload an image.');
        return;
    }

    setIsLoading(true);
    setShowHistory(false); 
    setErrorMsg(null);
    setGeneratedVideoUrl(null);

    try {
      let imageUrls: string[] = [];
      if (activeTab === 'image') {
         if (selectedImage) {
             // 情况A: 有本地文件，先上传
             const formData = new FormData();
             formData.append('file', selectedImage);
             const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
             const rawText = await uploadRes.text();
             let uploadData: any = {};
             try {
               uploadData = rawText ? JSON.parse(rawText) : {};
             } catch {
               uploadData = {};
             }
             if (!uploadRes.ok) throw new Error(uploadData?.message || `Image upload failed (${uploadRes.status})`);
             if (uploadData.url) imageUrls = [uploadData.url];
             else if (uploadData.data?.url) imageUrls = [uploadData.data.url];
             else throw new Error("Invalid upload response");
         } else if (remoteImageUrl) {
             // 情况B: 没有本地文件，但有远程 URL (来自首页)，直接使用
             imageUrls = [remoteImageUrl];
         }
      }

      const response = await fetch(`${API_BASE_URL}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'wavespeed',
          model: activeModel.apiModelValue, 
          prompt: prompt,
          media_type: 'video', 
          imageUrls: imageUrls,
          aspectRatio: selectedSize, 
          duration,
          resolution,
          sound: hasSound, 
          soraSize,
          removeWatermark,
          cameraFixed
        })
      });

      const data = await response.json();

      if (data.code === 0 && data.data?.taskId) {
        pollTaskStatus(data.data.taskId);
      } else {
        throw new Error(data.message || 'Failed to create task');
      }
    } catch (err: any) {
      const msg = err.message || 'Network error occurred.';
      setErrorMsg(msg);
      setIsLoading(false);
    }
  };

  const getBadgeClass = (type: string) => {
    switch (type) {
      case 'premium': case 'audio': return 'border border-yellow-400/30 bg-yellow-400/20 text-yellow-400';
      case 'hot': return 'bg-red-500/20 text-red-400 border-red-500/30 border';
      case 'new': case 'fast': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30 border';
      default: return 'bg-gray-800 text-gray-300 border border-gray-700';
    }
  };

  const getDurationOptions = () => {
    return ['5', '10', '15']; 
  };

  const showAspectRatio = true;

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <main className="flex-1 overflow-auto bg-black p-4 md:p-6">
        <div className="flex flex-col gap-4 md:gap-6 lg:h-[calc(100vh-120px)] lg:flex-row">
          
          {/* Left Panel (Form) */}
          <div className="w-full flex-shrink-0 lg:w-[380px] xl:w-[420px]">
            <div className="rounded-xl border text-card-foreground flex h-full flex-col border-border/50 bg-[#1a1a1a] shadow-lg relative">
              
              {/* Header and Dropdown */}
              <div className="flex flex-col space-y-1.5 p-6 flex-shrink-0 pb-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="tracking-tight text-lg font-bold text-white whitespace-nowrap">AI Video Generator</div>
                  <div className="relative">
                    <button 
                      className="justify-center whitespace-nowrap rounded-md font-medium transition-colors border shadow-sm h-9 flex w-full items-center gap-1 border-border/50 bg-[#1e1e1e] hover:bg-[#252525] py-2 px-3 text-sm"
                      type="button" 
                      onClick={() => setIsModelOpen(!isModelOpen)}
                    >
                      <div className="flex-shrink-0">
                        <img alt={activeModel.name} className="h-6 w-6" src={activeModel.icon} />
                      </div>
                      <span className="text-yellow-400 truncate">{activeModel.name}</span>
                      <ChevronDown className="h-4 w-4 text-white ml-auto" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Dropdown Menu */}
              {isModelOpen && (
                <div 
                  className="absolute top-[70px] left-0 right-0 z-50 mx-4 rounded-md border border-border/50 bg-black shadow-2xl overflow-hidden outline-none" 
                  style={{ width: 'calc(100% - 32px)' }}
                >
                  <div className="custom-scrollbar flex max-h-[60vh] flex-col overflow-auto">
                    {models.length === 0 ? (
                      <div className="p-4 text-sm text-gray-300">
                        {wavespeedModelsError
                          ? `Failed to load WaveSpeed models: ${wavespeedModelsError}`
                          : isLoadingWavespeedModels
                            ? 'Loading WaveSpeed models...'
                            : 'No models available for this mode.'}
                      </div>
                    ) : (
                      models.map((model) => (
                        <button 
                          key={model.id}
                          className={`flex w-full flex-col border-b border-border/50 p-4 pr-2 text-left transition-all duration-200 hover:bg-[#111] ${selectedModelId === model.id ? 'border-l-2 border-l-yellow-400 bg-[#222]' : ''}`}
                          onClick={() => handleModelSelect(model.id)}
                        >
                          <div className="relative z-10 mb-2 flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="flex-shrink-0"><img alt={model.name} className="h-6 w-6" src={model.icon} /></div>
                              <span className={`text-lg font-medium ${selectedModelId === model.id ? 'font-semibold text-yellow-400' : 'text-white'}`}>{model.name}</span>
                              {model.badges.map((badge, i) => (
                                <span key={i} className={`rounded-full px-2 py-1 text-xs font-medium ${getBadgeClass(badge.type)}`}>{badge.text}</span>
                              ))}
                              {selectedModelId === model.id && <Check className="ml-auto h-5 w-5 text-yellow-400" />}
                            </div>
                          </div>
                          {model.description ? <p className="text-sm relative z-10 mb-3 text-gray-300">{model.description}</p> : null}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Form Content */}
              <div className="flex min-h-0 flex-1 flex-col p-6 pt-2">
                <div className="flex h-full flex-col">
                  {/* Tabs */}
                  <div className="mb-4 flex-shrink-0">
                    <div className="w-full items-center justify-center bg-black text-muted-foreground rounded-lg p-1 gap-1 grid grid-cols-2">
                        <button 
                          type="button" 
                          className={`relative inline-flex flex-1 items-center justify-center px-6 py-3 text-sm font-medium transition-all rounded-md hover:text-white ${activeTab === 'text' ? 'border-2 border-yellow-400 text-white' : 'text-gray-400'}`} 
                          onClick={() => setActiveTab('text')}
                        >
                          <span className="z-10">Text to video</span>
                        </button>
                        <button 
                          type="button" 
                          className={`relative inline-flex flex-1 items-center justify-center px-6 py-3 text-sm font-medium transition-all rounded-md hover:text-white ${activeTab === 'image' ? 'border-2 border-yellow-400 text-white' : 'text-gray-400'} ${activeTab === 'image' ? 'text-white' : 'text-gray-400'}`} 
                          onClick={() => setActiveTab('image')}
                        >
                          <span className="z-10">Image to video</span>
                        </button>
                    </div>
                  </div>

                  <div className="custom-scrollbar mb-4 min-h-0 flex-1 space-y-4 overflow-y-auto">
                    {/* Image Upload */}
                    {activeTab === 'image' && (
                      <div className="space-y-1">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="font-medium text-sm text-white">Upload Image</label>
                          </div>
                          <div 
                            className="media-card-surface media-card-surface-hover group relative cursor-pointer rounded-xl border-2 border-dashed border-gray-700 hover:border-yellow-400 transition-all duration-300"
                            onClick={handleUploadClick}
                          >
                            <input ref={fileInputRef} id="image" className="hidden" accept="image/jpeg,image/png,image/webp" type="file" onChange={handleFileChange} />
                            
                            {selectedImage || previewUrl ? (
                                <div className="relative w-full aspect-video overflow-hidden rounded-lg">
                                    <img src={previewUrl!} alt="Preview" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium">Click to change</div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-4 p-8">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-400/10 transition-colors group-hover:bg-yellow-400/20">
                                        <CloudUpload className="h-8 w-8 text-yellow-400 transition-colors group-hover:text-yellow-300" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-medium text-foreground text-white">Drag and drop image or Click to select image</p>
                                        <p className="mt-1 text-xs text-muted-foreground">JPG/PNG (Max 10MB)</p>
                                    </div>
                                </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Prompt */}
                    <div className="space-y-1">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <label className="font-medium text-sm text-white">Prompt</label>
                          <Info className="cursor-help text-muted-foreground h-4 w-4" />
                        </div>
                        <div className="relative">
                          <textarea 
                            ref={textareaRef}
                            className="flex w-full rounded-md border px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-highlight disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-colors duration-200 min-h-[100px] resize-y border-border/50 bg-[#1e1e1e] pr-10 text-white" 
                            placeholder="Describe what you want to create..." 
                            style={{ resize: 'vertical' }}
                            value={prompt}
                            onChange={handleTextareaChange}
                          />
                        </div>
                      </div>
                      <div className="flex justify-between text-xs">
                        <button className="flex items-center gap-1 rounded-sm text-sm font-medium text-yellow-400 transition-colors hover:scale-105" type="button" onClick={handleGeneratePrompt}>
                          <Sparkles className="h-4 w-4 text-yellow-400" /> Generate with AI
                        </button>
                        <span className="text-muted-foreground ">{prompt.length}/10000</span>
                      </div>
                    </div>

                    {/* Parameters... */}
                    <div className="space-y-1">
                      <label className="font-medium text-sm text-white mb-2 block">Duration</label>
                      <div className="grid gap-2 grid-cols-3">
                        {getDurationOptions().map((d) => (
                          <button
                            key={d}
                            type="button"
                            className={`py-2 px-2 rounded-lg transition-all duration-200 ${duration === d ? 'bg-yellow-400 text-black' : 'bg-gray-200 text-black hover:bg-gray-300'}`}
                            onClick={() => handleDurationChange(d)}
                          >
                            <div className="flex items-center justify-center gap-1">
                              <Clock className="h-4 w-4 text-black" />
                              <span className="text-xs font-medium">{d}s</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-medium text-sm text-white mb-2 block">Resolution</label>
                      <div className="grid gap-2 grid-cols-3">
                        {['480p', '720p', '1080p'].map((r) => (
                          <button
                            key={r}
                            type="button"
                            className={`py-2 px-2 rounded-lg ${resolution === r ? 'bg-yellow-400 text-black' : 'bg-gray-200 text-black hover:bg-gray-300'}`}
                            onClick={() => handleResolutionChange(r)}
                          >
                            <div className="flex items-center justify-center gap-1">
                              <Monitor className="h-4 w-4 text-black" />
                              <span className="text-xs font-medium">{r}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {showAspectRatio && (
                      <div className="space-y-1">
                        <div className="space-y-2">
                          <label className="font-medium text-sm text-white mb-2 block">Aspect Ratio</label>
                          <div className="grid gap-2 grid-cols-3">
                            {['16:9', '9:16', '1:1'].map((ratio) => (
                              <button 
                                key={ratio} 
                                type="button" 
                                className={`relative group py-2 px-2 rounded-lg transition-all duration-200 
                                  ${selectedSize === ratio 
                                    ? 'bg-yellow-400 text-black shadow-md' 
                                    : 'bg-[#1e1e1e] hover:bg-[#252525] text-white hover:shadow-sm'
                                  }`} 
                                onClick={() => setSelectedSize(ratio)}
                              >
                                <div className={`mx-auto mb-1.5 border-2 rounded transition-colors ${ratio === '16:9' ? 'w-11 h-6' : ratio === '9:16' ? 'w-5 h-9' : 'w-7 h-7'} ${selectedSize === ratio ? 'border-black' : 'border-gray-400 group-hover:border-white'}`}></div>
                                <span className="text-xs font-medium leading-tight block">{ratio === '1:1' ? '1:1 / Auto' : ratio}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex-shrink-0 border-t border-border pt-4">
                    <div className="space-y-4">
                      {errorMsg && (
                        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 flex flex-col gap-2 text-red-400 text-xs">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            <span>{errorMsg}</span>
                          </div>
                          
                          {(errorMsg.toLowerCase().includes('insufficient') || errorMsg.toLowerCase().includes('credits')) && (
                             <Link href="/pricing" className="w-full">
                               <button className="w-full py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded font-semibold transition-colors flex items-center justify-center gap-2">
                                 <CreditCard className="h-3 w-3" />
                                 Get More Credits
                               </button>
                             </Link>
                          )}
                        </div>
                      )}
                      <div className="rounded-lg border transition-all duration-200 border-yellow-400/10 bg-yellow-400/10">
                        <div className="flex items-center justify-between p-3">
                          <div className="flex items-center gap-2">
                            <Coins className="text-yellow-400 h-4 w-4" />
                            <span className="text-sm font-medium text-white">Required Credits</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-md font-bold text-yellow-400">{requiredCredits}</span>
                          </div>
                        </div>
                      </div>
                      <button 
                        className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-yellow-400 shadow hover:bg-yellow-500 h-9 px-4 py-2 w-full gradient-button font-semibold text-black hover:opacity-90 transition-opacity ${isLoading || !isLoggedIn || isLoadingWavespeedModels || !!wavespeedModelsError || !activeModel.apiModelValue ? 'opacity-70 cursor-not-allowed' : ''}`}
                        onClick={handleGenerateVideo}
                        disabled={isLoading || !isLoggedIn || isLoadingWavespeedModels || !!wavespeedModelsError || !activeModel.apiModelValue}
                      >
                        {isLoading ? <><Loader2 className="animate-spin" /> Generating...</> : (isLoggedIn ? 'Generate video' : 'Sign in to Generate')}
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>

          {/* Right Panel (History / Preview) */}
          <div className="w-full min-w-0">
            <div className="flex h-full gap-2 md:gap-4">
              <div className="rounded-xl border text-card-foreground shadow flex h-full min-w-0 flex-1 flex-col border-border/30 bg-[#1a1a1a] backdrop-blur-md">
                
                {/* Right Header */}
                <div className="flex flex-col space-y-1.5 p-6 flex-shrink-0 border-b border-border/20">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold leading-none tracking-tight flex items-center gap-2">
                      {showHistory ? <History className="h-5 w-5 text-yellow-400" /> : <Film className={`h-5 w-5 ${isLoading ? 'animate-pulse text-yellow-200' : 'text-yellow-400'}`} />}
                      
                      <span className="text-yellow-400">
                        {isLoggedIn ? (showHistory ? 'History' : (isLoading ? 'Generating...' : 'Generated Result')) : 'Sample Videos'}
                      </span>

                      {showHistory && <span className="text-xs text-gray-500 font-normal ml-2 hidden sm:inline">(Media files are retained for 14 days)</span>}
                    </div>
                    
                    {isLoggedIn && (generatedVideoUrl || isLoading) && history.length > 0 && (
                      <button 
                        onClick={() => setShowHistory(!showHistory)}
                        className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-full bg-black/40 hover:bg-black/60 text-gray-300 transition-colors"
                      >
                        {showHistory ? <ChevronLeft className="h-3 w-3" /> : <History className="h-3 w-3" />}
                        {showHistory ? 'Back to Result' : 'View History'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-6 pt-0 flex-1 overflow-hidden relative">
                  
                  {!isLoggedIn ? (
                    <div className="flex h-full w-full items-center justify-center bg-black/20 rounded-lg overflow-hidden mt-4">
                        <video 
                            src="https://pub-93dbf869a4c54dde90c209f63c68799b.r2.dev/1.mp4" 
                            controls 
                            autoPlay 
                            muted 
                            loop 
                            playsInline
                            className="max-h-full max-w-full rounded-lg shadow-2xl object-contain"
                        >
                            Your browser does not support the video tag.
                        </video>
                    </div>
                  ) : (
                    <>
                      {/* === History List === */}
                      {showHistory || (!generatedVideoUrl && !isLoading && history.length > 0) ? (
                        <div className="h-full overflow-y-auto custom-scrollbar pr-2 mt-4">
                            {history.length === 0 && !isFetchingHistory ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                    <History className="h-12 w-12 mb-2 opacity-50"/>
                                    <p>No history yet.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4 pb-4">
                                    {history.map((item) => (
                                        <div key={item.id} className="relative group rounded-xl border border-border/30 bg-black/20 overflow-hidden hover:border-yellow-400/30 transition-all">
                                            <div 
                                                className="cursor-pointer"
                                                onClick={() => handleHistoryClick(item)}
                                            >
                                                <div className="aspect-video w-full overflow-hidden bg-black/40 relative flex items-center justify-center">
                                                    <video src={item.url} className="w-full h-full object-cover opacity-80" muted preload="metadata" />
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <div className="bg-black/50 rounded-full p-2 backdrop-blur-sm">
                                                            <Film className="h-6 w-6 text-white" />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="p-4 space-y-2">
                                                    <div className="flex items-center justify-between text-xs text-gray-400">
                                                        <span className="bg-white/10 px-2 py-0.5 rounded text-white">{item.type}</span>
                                                        <span>{item.createdAt}</span>
                                                    </div>
                                                    <p className="text-sm text-gray-200 line-clamp-2">{item.prompt}</p>
                                                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                                        <div className="text-xs text-gray-500">{item.model} • {item.duration}</div>
                                                        <div className="text-xs text-yellow-400 hover:text-yellow-300 font-medium">View Detail</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                      ) : (
                        /* === Detail View === */
                        <div className="h-full w-full rounded-[inherit] overflow-hidden flex flex-col">
                            <div className="flex-1 flex items-center justify-center relative min-h-0">
                                {isLoading ? (
                                    <div className="h-full w-full flex flex-col items-center justify-center bg-black/40 rounded-lg border border-border/20 backdrop-blur-sm">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-yellow-400 blur-xl opacity-20 animate-pulse"></div>
                                            <Sparkles className="h-16 w-16 text-yellow-400 animate-pulse relative z-10" />
                                        </div>
                                        <p className="mt-4 text-white font-medium animate-pulse">Creating masterpiece...</p>
                                    </div>
                                ) : generatedVideoUrl ? (
                                    <video
                                        controls
                                        autoPlay
                                        loop
                                        src={generatedVideoUrl}
                                        className="max-h-full max-w-full rounded-lg shadow-lg"
                                    ></video>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-50">
                                        <Film className="h-16 w-16 mb-4 text-gray-600"/>
                                        <p className="text-gray-400 text-sm">Generate a video to see it here.</p>
                                    </div>
                                )}
                            </div>

                            {!isLoading && generatedVideoUrl && (
                                <div className="p-4 flex justify-center gap-3 border-t border-border/20 mt-auto flex-shrink-0">
                                    <button
                                    onClick={() => downloadVideo(generatedVideoUrl)}
                                    disabled={isDownloading}
                                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-white transition-all shadow-md ${isDownloading ? 'bg-gray-600' : 'bg-blue-600 hover:bg-blue-500'}`}
                                    >
                                    {isDownloading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Download className="h-4 w-4" />}
                                    <span>Download</span>
                                    </button>
                                </div>
                            )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default VideoGenerator;
