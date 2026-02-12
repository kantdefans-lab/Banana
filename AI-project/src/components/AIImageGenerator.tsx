'use client';

import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { 
  ChevronDown, 
  Sparkles, 
  Coins, 
  Film,
  CloudUpload,
  Loader2,
  AlertCircle,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  Layers,
  History,
  Image as ImageIcon,
  LogIn
} from 'lucide-react';
import Link from 'next/link';

const API_BASE_URL = "/api/ai"; 
const WAVESPEED_MODELS_API = "/api/wavespeed/models?media=image&include=capabilities";

// --- 🔥 工具函数保持不变 ---
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

const regexExtractImages = (text: string): string[] => {
  const urlRegex = /https?:\/\/[^"'\s\\]+(?:\.(?:jpg|jpeg|png|webp|gif)|tempfile|output|mj-images)[^"'\s\\]*/gi;
  const matches = text.match(urlRegex) || [];
  return Array.from(new Set(matches.filter(url => 
    !url.includes('api.kie.ai') && 
    !url.includes('api.wavespeed.ai') &&
    !url.includes('discord.com') && 
    !url.includes('google') &&
    !url.match(/\.(mp4|mov|webm|avi|mkv)(\?|$)/i) 
  )));
};

const deepExtractImages = (obj: any): string[] => {
  const images = new Set<string>();
  const visited = new Set<any>(); 

  const traverse = (current: any) => {
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
      const isVideoParams = (url: string) => url.match(/\.(mp4|mov|webm|avi|mkv)(\?|$)/i);
      if (Array.isArray(current.resultUrls)) {
          current.resultUrls.forEach((url: any) => {
              if (
                typeof url === 'string' &&
                url.startsWith('http') &&
                !url.includes('api.wavespeed.ai') &&
                !isVideoParams(url)
              ) images.add(url);
          });
      }
      if (
        current.resultUrl &&
        typeof current.resultUrl === 'string' &&
        current.resultUrl.startsWith('http') &&
        !current.resultUrl.includes('api.wavespeed.ai') &&
        !isVideoParams(current.resultUrl)
      ) {
        images.add(current.resultUrl);
      }
      const genericUrl = current.url || current.image_url || current.image;
      if (
        typeof genericUrl === 'string' &&
        genericUrl.startsWith('http') &&
        !genericUrl.includes('api.wavespeed.ai') &&
        !isVideoParams(genericUrl)
      ) {
        images.add(genericUrl);
      }
      Object.keys(current).forEach(key => {
        if (key !== 'prompt' && key !== 'input' && key !== 'param' && key !== 'paramJson') traverse(current[key]);
      });
      return;
    }
    if (typeof current === 'string') {
      const trimmed = current.trim();
      const isVideoParams = (url: string) => url.match(/\.(mp4|mov|webm|avi|mkv)(\?|$)/i);
      if (
        trimmed.startsWith('http') &&
        !trimmed.includes('api.kie.ai') &&
        !trimmed.includes('api.wavespeed.ai') &&
        !isVideoParams(trimmed)
      ) {
         images.add(trimmed);
      } else if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try { traverse(JSON.parse(current)); } catch (e) {}
      }
    }
  };
  traverse(obj);
  return Array.from(images);
};

// --- Interfaces ---
interface GeneratedImage {
  id: string;
  url: string;
  images?: string[]; 
  prompt: string;
  model: string;
  createdAt: string;
  type: 'Text to Image' | 'Image to Image';
  size: string;
  mediaType?: string;
}

interface ModelOption {
  id: string;
  name: string;
  icon: string;
  badge: string;
  badgeType: 'pro' | 'normal';
  description: string;
  limitLabel: string;
  capabilityLabel: string;
  apiModelValue?: string;
  credits: { text: number; image: number; };
  maxImages?: number;
  highlightNote?: string; 
  wsType?: string;
  aspectRatios?: string[];
  supportsAllAspectRatios?: boolean;
}

type WaveSpeedModelBrief = {
  model_id: string;
  name?: string;
  type?: string;
  description?: string;
  base_price?: number | string;
  capabilities?: {
    aspectRatios?: string[];
    supportsAllAspectRatios?: boolean;
    sizes?: string[];
  } | null;
};

interface AIImageGeneratorProps {
  initialPrompt?: string;
  initialTab?: string; 
  initialImage?: File | null;
  initialModel?: string; 
  initialHistory?: GeneratedImage[]; 
  isLoggedIn: boolean; 
}

const AIImageGenerator = ({ 
  initialPrompt = '', 
  initialTab = 'text', 
  initialImage = null,
  initialModel = '',
  initialHistory = [],
  isLoggedIn = false 
}: AIImageGeneratorProps) => {
  
  // --- State ---
  const [activeTab, setActiveTab] = useState<'text' | 'image'>('text');
  const [prompt, setPrompt] = useState('');
  const [selectedSize, setSelectedSize] = useState('1:1');
  const [quality, setQuality] = useState<'basic' | 'high'>('basic');
  const [resolution, setResolution] = useState<'1K' | '2K' | '4K' | '480p' | '720p' | '1080p'>('1K');
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [generatedImageUrls, setGeneratedImageUrls] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isModelOpen, setIsModelOpen] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState('');
  const [cameraFixed, setCameraFixed] = useState(false);
  const [history, setHistory] = useState<GeneratedImage[]>(initialHistory || []);
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
  const [wavespeedCapabilitiesAvailable, setWavespeedCapabilitiesAvailable] =
    useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Effects ---
  useEffect(() => {
    if (initialPrompt) setPrompt(initialPrompt);
    if (initialTab === 'image' || initialTab === 'text') setActiveTab(initialTab as 'text' | 'image');
    if (initialModel) {
      setSelectedModelId(initialModel);
    }
    if (initialImage) {
      const newUrl = URL.createObjectURL(initialImage);
      setSelectedImages([initialImage]);
      setPreviewUrls([newUrl]);
      setActiveTab('image');
    }
  }, [initialPrompt, initialTab, initialImage, initialModel]);

  // Load History - 🔥 FIXED: Removed initialHistory form dependency array
  useEffect(() => {
    if (!isLoggedIn) {
        setIsFetchingHistory(false);
        setHistory([]);
        setShowHistory(false);
        return;
    }

    const fetchHistory = async () => {
      // 这里的逻辑依然保留：如果是首次加载且 Props 里有数据，优先用 Props
      if (initialHistory && initialHistory.length > 0) {
          const filteredInitial = initialHistory.filter(item => !JSON.stringify(item).match(/\.(mp4|mov|webm)/i));
          setHistory(filteredInitial);
          return; 
      }
      setIsFetchingHistory(true);
      try {
        const response = await fetch(`${API_BASE_URL}/history`); 
        if (response.ok) {
            const res = await response.json();
            if (res.code === 0 && Array.isArray(res.data)) {
                const filteredData = res.data.filter((item: any) => {
                    const rawString = JSON.stringify(item).toLowerCase();
                    if (rawString.includes('.mp4') || rawString.includes('.mov') || rawString.includes('.webm')) return false; 
                    const mType = (item.mediaType || item.media_type || '').toLowerCase();
                    if (mType === 'video') return false; 
                    const scene = (item.scene || '').toLowerCase();
                    if (scene.includes('video')) return false;
                    const model = (item.model || '').toLowerCase();
                    const videoModels = ['veo', 'sora', 'kling', 'hailuo', 'seedance', 'runway', 'pika', 'luma', 'minimax', 'wan'];
                    if (videoModels.some(v => model.includes(v))) return false;
                    const typeStr = (item.type || '').toLowerCase();
                    if (typeStr.includes('video')) return false;
                    return true; 
                });

                const processedHistory = filteredData.map((item: any) => {
                    const sources = [
                        item, 
                        safeParse(item.images),
                        safeParse(item.task_info || item.taskInfo),
                        safeParse(item.task_result || item.taskResult),
                        safeParse(item.rawData),
                        safeParse(item.rawData?.resultJson)
                    ];
                    let allUrls: string[] = [];
                    sources.forEach(source => {
                        const found = deepExtractImages(source);
                        if (found.length > 0) allUrls = [...allUrls, ...found];
                    });
                    if (allUrls.length <= 1) {
                        const regexFound = regexExtractImages(JSON.stringify(item));
                        if (regexFound.length > 1) allUrls = regexFound;
                    }
                    const uniqueUrls = Array.from(new Set(allUrls));
                    if (uniqueUrls.length === 0 && item.url) uniqueUrls.push(item.url);
                    return { 
                      ...item, 
                      images: uniqueUrls, 
                      url: uniqueUrls[0] || item.url,
                      mediaType: 'image'
                    };
                });
                setHistory(processedHistory);
            }
        }
      } catch (error) { console.error("History fetch error", error); } 
      finally { setIsFetchingHistory(false); }
    };
    fetchHistory();
    // 🔥 关键修改：依赖数组只保留 isLoggedIn，去掉了 initialHistory
  }, [isLoggedIn]); 

  useEffect(() => {
    if (isLoggedIn && generatedImageUrls.length === 0 && history.length > 0) setShowHistory(true);
    else setShowHistory(false);
  }, [isLoggedIn]);

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

  const getBadgeForType = (t?: string) => {
    if (t === 'image-to-image') return { badge: 'EDIT', badgeType: 'normal' as const };
    if (t === 'text-to-image') return { badge: 'GEN', badgeType: 'normal' as const };
    return { badge: 'WS', badgeType: 'normal' as const };
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
          setWavespeedCapabilitiesAvailable(!!json?.capabilitiesAvailable);
        } else {
          setWavespeedModels([]);
          setWavespeedCapabilitiesAvailable(false);
          setWavespeedModelsError(
            String(json?.message || `Failed to load models (${resp.status})`)
          );
        }
      } catch (e: any) {
        if (cancelled) return;
        setWavespeedModels([]);
        setWavespeedCapabilitiesAvailable(false);
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

  // --- Models Configuration ---
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- legacy curated list (WaveSpeed models are loaded dynamically)
  const LEGACY_MODELS: ModelOption[] = [
    {
      id: 'nano-banana',
      name: 'Nano Banana',
      icon: '/model_icon/google-icon.svg',
      badge: 'SMART',
      badgeType: 'normal',
      description: 'Advanced AI model excelling in natural language-driven image generation powered by Google',
      limitLabel: '4+',
      capabilityLabel: 'Text & Image',
      apiModelValue: 'google/nano-banana',
      credits: { text: 5, image: 10 }, // 🟢 基础模型: 1/2
      maxImages: 4 
    },
    {
      id: 'nano-banana-pro',
      name: 'Nano Banana Pro',
      icon: '/model_icon/google-icon.svg',
      badge: 'PRO',
      badgeType: 'pro',
      description: 'Professional AI image generation with enhanced quality and advanced controls powered by Google',
      limitLabel: '10+',
      capabilityLabel: 'Text & Image',
      apiModelValue: 'nano-banana-pro',
      credits: { text: 3, image: 6 }, // 🟢 高级模型: 3/6
      maxImages: 8
    },
    {
      id: 'qwen-image',
      name: 'Qwen Image',
      icon: '/model_icon/wan-icon.svg',
      badge: 'HD',
      badgeType: 'normal',
      description: 'High-quality image generation by Qwen, optimized for HD compositions.',
      limitLabel: '1+',
      capabilityLabel: 'Text & Image',
      apiModelValue: 'qwen/text-to-image',
      credits: { text: 3, image: 6 }, // 🟢 高级模型: 3/6
      maxImages: 1,
      highlightNote: '🎨 Artistic HD'
    },
    {
      id: 'grok-imagine',
      name: 'Grok Imagine',
      icon: '/model_icon/xai-icon.svg', 
      badge: 'NEW',
      badgeType: 'normal',
      description: 'Powered by xAI, delivering high-fidelity image generation with exceptional prompt understanding.',
      limitLabel: '1+',
      capabilityLabel: 'Text Only',
      apiModelValue: 'grok-imagine/text-to-image',
      credits: { text: 3, image: 3 }, // 🟢 特殊模型: 3 (图生图也是3，虽然可能用不到)
      maxImages: 0, 
      highlightNote: '🚀 xAI Latest Model'
    },
    {
      id: 'flux-2-pro',
      name: 'Flux 2 Pro',
      icon: '/model_icon/flux-icon.svg', 
      badge: 'SOTA',
      badgeType: 'pro',
      description: 'Next-gen model with superior prompt adherence. Supports both Text-to-Image and Image-to-Image.',
      limitLabel: '8+',
      capabilityLabel: 'Text & Image',
      apiModelValue: 'flux-2/pro-text-to-image', 
      credits: { text: 3, image: 6 }, // 🟢 高级模型: 3/6
      maxImages: 8,
      highlightNote: '🔥 Best for complex prompts'
    },
    {
      id: 'z-image-turbo',
      name: 'Z-Image Turbo',
      icon: '/model_icon/wan-icon.svg',
      badge: 'FAST',
      badgeType: 'normal',
      description: 'Super fast text-to-image model by Tongyi-MAI with photorealistic quality',
      limitLabel: '3+',
      capabilityLabel: 'Text Only',
      apiModelValue: 'z-image',
      credits: { text: 1, image: 2 }, // 🟢 基础模型: 1/2
      maxImages: 0
    },
    {
      id: 'seedream',
      name: 'Seedream',
      icon: '/model_icon/bytedance-icon.svg',
      badge: 'NEW',
      badgeType: 'normal',
      description: "ByteDance's advanced image generation model with superior quality and creative control",
      limitLabel: '3+',
      capabilityLabel: 'Image Only',
      apiModelValue: 'seedream/4.5-text-to-image',
      credits: { text: 3, image: 6 }, // 🟢 高级模型: 3/6
      maxImages: 10
    },
    {
      id: 'gpt-4o',
      name: 'GPT-4o Image',
      icon: '/model_icon/openai-icon.svg',
      badge: 'STANDARD',
      badgeType: 'normal',
      description: 'AI-powered image generation and editing',
      limitLabel: '4+',
      capabilityLabel: 'Text & Image',
      apiModelValue: 'gpt4o-image',
      credits: { text: 8, image: 12 }, // 🟢 昂贵模型: 8/12
      maxImages: 4
    }
  ];

  const wavespeedModelOptions: ModelOption[] = (wavespeedModels || [])
    .filter((m) => m && typeof m.model_id === 'string' && m.model_id.length > 0)
    .map((m) => {
      const type = m.type || '';
      const badge = getBadgeForType(type);
      const capabilityLabel = type === 'image-to-image' ? 'Text & Image' : 'Text Only';
      const cap = (m as any)?.capabilities || null;
      const aspectRatios: string[] | undefined = Array.isArray(cap?.aspectRatios)
        ? cap.aspectRatios.map((x: any) => String(x))
        : undefined;
      const supportsAllAspectRatios = !!cap?.supportsAllAspectRatios;

      return {
        id: m.model_id,
        name: m.name || m.model_id,
        icon: getModelIcon(m.model_id),
        badge: badge.badge,
        badgeType: badge.badgeType,
        description: m.description || '',
        limitLabel: '',
        capabilityLabel,
        apiModelValue: m.model_id,
        credits: { text: 2, image: 4 },
        maxImages: 4,
        wsType: type,
        aspectRatios,
        supportsAllAspectRatios,
      };
    });

  const ratioSet = new Set(
    [
      '16:9',
      '5:4',
      '4:3',
      '3:2',
      '1:1',
      '2:3',
      '3:4',
      '4:5',
      '9:16',
      '21:9',
    ].map((r) => String(r))
  );

  const modelsByMode = wavespeedModelOptions.filter((m) =>
    activeTab === 'image' ? m.wsType === 'image-to-image' : m.wsType === 'text-to-image'
  );

  const models = wavespeedCapabilitiesAvailable
    ? modelsByMode.filter((m: any) => {
        const hasAnyCap =
          (Array.isArray(m?.aspectRatios) && m.aspectRatios.length > 0) ||
          m?.supportsAllAspectRatios === true;
        // Strict mode: if capabilities are available globally, models without capabilities are hidden.
        if (!hasAnyCap) return false;
        if (m?.supportsAllAspectRatios === true) return true;
        const selected = String(selectedSize || '').trim();
        if (!selected || !ratioSet.has(selected)) return true;
        return Array.isArray(m?.aspectRatios) && m.aspectRatios.includes(selected);
      })
    : modelsByMode;

  const activeModel =
    models.find((m) => m.id === selectedModelId) || models[0];

  useEffect(() => {
    if (!activeModel) return;
    if (activeModel.id !== selectedModelId) setSelectedModelId(activeModel.id);
  }, [activeModel?.id, activeTab]);

  useEffect(() => {
    if (!wavespeedCapabilitiesAvailable) return;
    if (!selectedSize || !ratioSet.has(String(selectedSize))) return;

    // If filtering yields no models, fall back to 1:1 to keep the UI usable.
    if (!activeModel) {
      setSelectedSize('1:1');
      setErrorMsg(`No models support ratio ${selectedSize}. Switched to 1:1.`);
    }
  }, [wavespeedCapabilitiesAvailable, selectedSize, activeTab, activeModel?.id]);

  const maxUploadLimit = activeModel?.maxImages ?? 4;
  const requiredCredits =
    activeTab === 'text'
      ? activeModel?.credits.text ?? 2
      : activeModel?.credits.image ?? 4;

  // --- Sizes ---
  const imageSizes = [
    { ratio: '16:9', widthClass: 'w-11', heightClass: 'h-6' },
    { ratio: '5:4', widthClass: 'w-8', heightClass: 'h-6' },
    { ratio: '4:3', widthClass: 'w-8', heightClass: 'h-6' },
    { ratio: '3:2', widthClass: 'w-9', heightClass: 'h-6' },
    { ratio: '1:1', widthClass: 'w-7', heightClass: 'h-7' },
    { ratio: '2:3', widthClass: 'w-5', heightClass: 'h-7' },
    { ratio: '3:4', widthClass: 'w-6', heightClass: 'h-8' },
    { ratio: '4:5', widthClass: 'w-6', heightClass: 'h-8' },
    { ratio: '9:16', widthClass: 'w-5', heightClass: 'h-9' },
    { ratio: '21:9', widthClass: 'w-12', heightClass: 'h-6' }
  ];

  let availableImageSizes = imageSizes;

  useEffect(() => {
    if (!availableImageSizes.find(s => s.ratio === selectedSize)) setSelectedSize('1:1');
    if (selectedImages.length > maxUploadLimit) setErrorMsg(`Selected model only supports up to ${maxUploadLimit} images. Please remove some.`);
    else if (errorMsg?.startsWith('Selected model only supports up to')) setErrorMsg(null);
  }, [selectedSize, maxUploadLimit, selectedImages.length, errorMsg]); 

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFiles: File[] = [];
      const newUrls: string[] = [];
      if (selectedImages.length + files.length > maxUploadLimit) return setErrorMsg(`Max ${maxUploadLimit} images.`);
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 5 * 1024 * 1024) continue;
        newFiles.push(file);
        newUrls.push(URL.createObjectURL(file));
      }
      setSelectedImages(prev => [...prev, ...newFiles]);
      setPreviewUrls(prev => [...prev, ...newUrls]);
      setErrorMsg(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    const newFiles = [...selectedImages];
    const newUrls = [...previewUrls];
    URL.revokeObjectURL(newUrls[index]);
    newFiles.splice(index, 1);
    newUrls.splice(index, 1);
    setSelectedImages(newFiles);
    setPreviewUrls(newUrls);
    setErrorMsg(null);
  };

  const uploadImages = async (files: File[]): Promise<string[]> => {
    const uploadPromises = files.map(async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      return data.url; 
    });
    return Promise.all(uploadPromises);
  };

  const handleModelSelect = (id: string) => { setSelectedModelId(id); setIsModelOpen(false); };
  const handleUploadClick = () => { fileInputRef.current?.click(); };
  const handleGeneratePrompt = () => { setPrompt((prev) => prev + " highly detailed, 8k, cinematic lighting"); };

  const downloadSingleImage = async (url: string) => {
    const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
    try {
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const timestamp = new Date().getTime();
      link.download = `ai-generated-${timestamp}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) { alert('Download failed.'); }
  };

  // 🔥🔥🔥 核心修复：动态轮询间隔，防止请求过于频繁 🔥🔥🔥
  const pollTaskStatus = async (taskId: string, attempt = 0) => {
    if (attempt > 60) {
        setIsLoading(false);
        setErrorMsg("Request timed out. Please check history later.");
        return;
    }

    // 动态计算间隔：前5次每3秒，之后每5秒 (最大5秒)
    // 之前是固定的 2000ms，太快了
    const nextInterval = attempt < 5 ? 3000 : 5000;

    try {
      const response = await fetch(`${API_BASE_URL}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId }) 
      });
      const text = await response.text();
      let res;
      try { res = JSON.parse(text); } catch (e) { 
          setTimeout(() => pollTaskStatus(taskId, attempt + 1), nextInterval); 
          return; 
      }
      
      console.log(`Poll Attempt ${attempt + 1}:`, res);

      if (res.code === 0 && res.data) {
        const taskData = res.data;
        const parsedInfo = safeParse(taskData.task_info || taskData.taskInfo);
        const parsedResult = safeParse(taskData.task_result || taskData.taskResult);
        let explicitResultJson = null;
        if (taskData.rawData && typeof taskData.rawData.resultJson === 'string') {
            explicitResultJson = safeParse(taskData.rawData.resultJson);
        } else if (parsedResult && parsedResult.rawData && typeof parsedResult.rawData.resultJson === 'string') {
            explicitResultJson = safeParse(parsedResult.rawData.resultJson);
        }
        const dataSources = [
            taskData, res, parsedInfo, parsedInfo?.data, parsedResult, parsedResult?.rawData, parsedResult?.data, explicitResultJson
        ];
        let allUrls: string[] = [];
        dataSources.forEach(source => {
            const found = deepExtractImages(source);
            if (found.length > 0) allUrls = [...allUrls, ...found];
        });
        if (allUrls.length <= 1) {
            const regexFound = regexExtractImages(JSON.stringify(taskData));
            if (regexFound.length > 1) allUrls = regexFound;
        }
        const uniqueUrls = Array.from(new Set(allUrls));
        const status = (taskData.status || taskData.state || 'processing').toLowerCase();
        
        if (uniqueUrls.length > 0 || status === 'success' || status === 'completed') {
          if (uniqueUrls.length > 0) {
            setGeneratedImageUrls(uniqueUrls);
            setCurrentImageIndex(0); 
            setIsLoading(false);
            const newHistoryItem: GeneratedImage = {
              id: taskId,
              url: uniqueUrls[0], 
              images: uniqueUrls, 
              prompt: prompt,
              model: activeModel?.name || selectedModelId || '',
              createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              type: activeTab === 'text' ? 'Text to Image' : 'Image to Image',
              size: selectedSize,
              mediaType: 'image'
            };
            setHistory(prev => [newHistoryItem, ...prev]);
            setShowHistory(false);
            return; 
          }
          if (status !== 'success' && status !== 'completed') { 
              setTimeout(() => pollTaskStatus(taskId, attempt + 1), nextInterval); 
              return; 
          }
        } 
        
        if (status === 'failed' || status === 'error') {
          setIsLoading(false);
          let error = 'Generation failed';
          if (parsedResult?.rawData?.errorMessage) error = parsedResult.rawData.errorMessage;
          setErrorMsg(error);
        } else { 
            setTimeout(() => pollTaskStatus(taskId, attempt + 1), nextInterval); 
        }
      } else { 
          setTimeout(() => pollTaskStatus(taskId, attempt + 1), nextInterval); 
      }
    } catch (err) { setTimeout(() => pollTaskStatus(taskId, attempt + 1), nextInterval); }
  };

  const handleGenerateImage = async () => {
    if (!isLoggedIn) return setErrorMsg('Please sign in to generate images.');
    if (isLoadingWavespeedModels) return setErrorMsg('Loading models...');
    if (wavespeedModelsError) return setErrorMsg(wavespeedModelsError);
    if (!activeModel) return setErrorMsg('No available model. Please check WaveSpeed API key/config.');
    if (!prompt) return setErrorMsg('Please enter a prompt.');
    let filesUrls: string[] = [];
    if (activeTab === 'image') {
      if (selectedImages.length === 0) return setErrorMsg('Upload at least one image.');
      try {
        setIsLoading(true);
        filesUrls = await uploadImages(selectedImages);
      } catch (e: any) { setIsLoading(false); return setErrorMsg(`Upload failed: ${e.message}`); }
    }

    setIsLoading(true);
    setShowHistory(false); 
    setErrorMsg(null);
    setCurrentImageIndex(0);
    setGeneratedImageUrls([]); 

    const modelToUse = activeModel.apiModelValue || activeModel.id;

    try {
      const response = await fetch(`${API_BASE_URL}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'wavespeed', 
          model: modelToUse, 
          prompt: prompt,
          media_type: 'image',
          scene: activeTab === 'text' ? 'text-to-image' : 'image-to-image',
          options: { size: selectedSize, numImages: 1, quality, resolution, cameraFixed },
          imageUrl: filesUrls[0],
          filesUrl: filesUrls
        })
      });
      const data = await response.json();
      if (data.code === 0 && data.data?.id) pollTaskStatus(data.data.id); 
      else throw new Error(data.message || 'Failed to create task');
    } catch (err: any) { setErrorMsg(err.message || 'Error occurred.'); setIsLoading(false); }
  };

  const handleTextareaChange = (e: ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value);
  const getBadgeStyles = (type: 'pro' | 'normal') => type === 'pro' ? 'rounded-full px-2 py-1 text-xs font-medium bg-yellow-400/20 text-white border-yellow-400/30 border' : 'rounded-full px-2 py-1 text-xs font-medium bg-white/10 text-white border-white/20 border';
  
  const handleDownload = async () => {
    const currentUrl = generatedImageUrls[currentImageIndex];
    if (!currentUrl) return;
    setIsDownloading(true);
    try { await downloadSingleImage(currentUrl); } catch (error) { } finally { setIsDownloading(false); }
  };

  const handleBatchDownload = async () => {
    if (generatedImageUrls.length === 0) return;
    setIsDownloading(true);
    try {
      for (const url of generatedImageUrls) {
        await downloadSingleImage(url);
        await new Promise(r => setTimeout(r, 500));
      }
    } catch (error) { alert('Some images failed to download.'); } finally { setIsDownloading(false); }
  };

  const handlePrevImage = (e: React.MouseEvent) => { 
      e.preventDefault(); e.stopPropagation(); 
      setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : generatedImageUrls.length - 1)); 
  };
  const handleNextImage = (e: React.MouseEvent) => { 
      e.preventDefault(); e.stopPropagation(); 
      setCurrentImageIndex((prev) => (prev < generatedImageUrls.length - 1 ? prev + 1 : 0)); 
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6 lg:h-[calc(100vh-120px)] lg:flex-row" style={{ backgroundColor: 'hsl(234 12% 16%)' }}>
      {/* Left Control Panel */}
      <div className="w-full flex-shrink-0 lg:w-[380px] xl:w-[420px]">
        <div className="rounded-xl border text-card-foreground flex h-full flex-col border-border/50 shadow-lg relative" style={{ backgroundColor: 'hsl(234 12% 16%)' }}>
          {/* Header */}
          <div className="flex flex-col space-y-1.5 p-6 flex-shrink-0 pb-2">
            <div className="flex items-center justify-between gap-2">
              <div className="tracking-tight text-lg font-bold text-white whitespace-nowrap">AI Image Generator</div>
              <div className="relative">
                <button className="justify-center whitespace-nowrap rounded-md font-medium transition-colors border shadow-sm h-9 flex w-full items-center gap-1 border-border/50 bg-black hover:bg-gray-900 py-2 px-3 text-sm outline-none ring-0" onClick={() => setIsModelOpen(!isModelOpen)}>
                  <img src={activeModel?.icon || '/model_icon/wan-icon.svg'} alt={activeModel?.name || 'model'} className="h-6 w-6" />
                  <span className="text-yellow-400 truncate">
                    {activeModel?.name || (isLoadingWavespeedModels ? 'Loading models...' : 'Select a model')}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-white transition-transform duration-200 ${isModelOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>
          </div>
          {/* Models */}
          {isModelOpen && (
            <div className="absolute top-[70px] left-0 right-0 z-50 mx-4 rounded-md border border-border/50 bg-[#1a1a1a] shadow-xl overflow-hidden outline-none">
              <div className="custom-scrollbar flex max-h-[60vh] flex-col overflow-auto outline-none">
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
                      <button key={model.id} className={`flex w-full flex-col border-b border-border/50 p-4 pr-2 text-left hover:bg-[#222] ${selectedModelId === model.id ? 'border-l-2 border-l-yellow-400 bg-[#1a1a1a]' : ''}`} onClick={() => handleModelSelect(model.id)}>
                        <div className="flex items-center gap-2 mb-2"><img className="h-6 w-6" src={model.icon} /><span className={`text-lg font-medium ${selectedModelId === model.id ? 'text-yellow-400 font-semibold' : 'text-white'}`}>{model.name}</span><span className={getBadgeStyles(model.badgeType)}>{model.badge}</span></div>
                        {model.description ? <p className="text-sm text-gray-300 mb-2">{model.description}</p> : null}
                        <div className="flex gap-2"><div className="flex items-center rounded-xl border border-border/50 bg-card px-2 py-1"><div className="text-xs font-medium text-white">{model.credits.text} Credits</div></div></div>
                      </button>
                  ))
                )}
              </div>
            </div>
          )}
          {/* Main Form */}
          <div className="flex min-h-0 flex-1 flex-col p-6 pt-2">
             <div className="custom-scrollbar mb-4 min-h-0 flex-1 space-y-4 overflow-y-auto">
                <div className="flex bg-black rounded-lg p-1 gap-1"><button onClick={() => setActiveTab('text')} className={`flex-1 py-2 text-sm rounded-md ${activeTab === 'text' ? 'bg-[hsl(50_90%_72%)] text-black' : 'text-white'}`}>Text to image</button><button onClick={() => setActiveTab('image')} className={`flex-1 py-2 text-sm rounded-md ${activeTab === 'image' ? 'bg-[hsl(50_90%_72%)] text-black' : 'text-white'}`}>Image to image</button></div>
                {activeTab === 'image' && (
                    <div className="space-y-4">
                        <input ref={fileInputRef} className="hidden" type="file" multiple onChange={handleFileChange} />
                        <div className="grid grid-cols-2 gap-3">
                            {previewUrls.map((url, index) => (
                                <div key={index} className="relative w-full aspect-square bg-black/20 rounded-xl overflow-hidden group"><img src={url} className="w-full h-full object-cover" /><button onClick={() => removeImage(index)} className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100"><X className="h-3 w-3" /></button></div>
                            ))}
                            <div className="w-full aspect-square rounded-xl border-2 border-dashed border-gray-700 hover:border-yellow-400/50 flex flex-col items-center justify-center cursor-pointer" onClick={handleUploadClick}><CloudUpload className="h-5 w-5 text-gray-400" /></div>
                        </div>
                    </div>
                )}
                <div className="space-y-2"><textarea ref={textareaRef} className="w-full rounded-md border border-border/50 bg-[#1a1a1a] p-3 text-white min-h-[100px]" placeholder="Describe what you want..." value={prompt} onChange={handleTextareaChange} /><div className="flex justify-between"><button className="text-yellow-400 text-xs flex items-center gap-1" onClick={handleGeneratePrompt}><Sparkles className="h-3 w-3" /> Generate with AI</button><span className="text-gray-400 text-xs">{prompt.length}/5000</span></div></div>
                {!isLoadingWavespeedModels && !wavespeedModelsError && !wavespeedCapabilitiesAvailable && (
                  <div className="text-xs text-gray-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    WaveSpeed did not return usable size metadata for ratio-based filtering.
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2">{availableImageSizes.map(size => (<button key={size.ratio} onClick={() => setSelectedSize(size.ratio)} className={`py-2 px-2 rounded-lg border ${selectedSize === size.ratio ? 'bg-[hsl(50_90%_72%)] text-black border-transparent' : 'bg-black text-white border-border/50'}`}><div className={`mx-auto mb-1 border-2 ${selectedSize === size.ratio ? 'border-black' : 'border-gray-500'} ${size.widthClass} ${size.heightClass}`}></div><span className="text-xs font-bold">{size.ratio}</span></button>))}</div>
             </div>
             {/* Bottom Actions */}
             <div className="pt-4 border-t border-border">
                {errorMsg && <div className="text-red-400 text-xs mb-2 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errorMsg}</div>}
                <div className="flex justify-between items-center mb-3 bg-yellow-400/10 p-2 rounded border border-yellow-400/20"><div className="flex items-center gap-2 text-white text-sm"><Coins className="h-4 w-4 text-yellow-400" /> Required Credits</div><span className="text-yellow-400 font-bold">{requiredCredits}</span></div>
                <button 
                    className={`w-full py-2 rounded-md font-semibold ${isLoading || !isLoggedIn || !activeModel || isLoadingWavespeedModels || !!wavespeedModelsError ? 'bg-gray-600 opacity-70' : 'bg-yellow-400 hover:bg-yellow-500 text-black'}`} 
                    onClick={handleGenerateImage} 
                    disabled={isLoading || !isLoggedIn || !activeModel || isLoadingWavespeedModels || !!wavespeedModelsError}
                >
                    {isLoading ? <span className="flex items-center justify-center gap-2"><Loader2 className="animate-spin h-4 w-4" /> Generating...</span> : (isLoggedIn ? 'Generate image' : 'Sign in to generate')}
                </button>
             </div>
          </div>
        </div>
      </div>

      {/* Right Side Image Display */}
      <div className="w-full min-w-0">
        <div className="flex h-full gap-4" style={{ backgroundColor: 'hsl(234 12% 16%)' }}>
          <div className="rounded-xl border bg-card text-card-foreground shadow flex h-full flex-1 flex-col" style={{ backgroundColor: 'hsl(234 12% 16%)' }}>
            
            {/* Header */}
            <div className="flex flex-col space-y-1.5 p-6 flex-shrink-0 border-b border-border/20">
              <div className="flex items-center justify-between">
                <div className="font-semibold flex items-center gap-2">
                  {showHistory ? <History className="h-5 w-5 text-yellow-400" /> : <Film className={`h-5 w-5 ${isLoading ? 'animate-pulse text-yellow-200' : 'text-yellow-400'}`} />}
                  <span className="text-yellow-400">{showHistory ? 'History' : (isLoading ? 'Generating...' : generatedImageUrls.length > 0 ? `Result (${currentImageIndex + 1}/${generatedImageUrls.length})` : 'Sample')}</span>
                  {showHistory && <span className="text-xs text-gray-500 font-normal ml-2 hidden sm:inline">(Media files are retained for 14 days)</span>}
                </div>
                {((generatedImageUrls.length > 0) || isLoading) && history.length > 0 && isLoggedIn && (
                  <button onClick={() => setShowHistory(!showHistory)} className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-full bg-black/40 hover:bg-black/60 text-gray-300 transition-colors">
                    {showHistory ? <ChevronLeft className="h-3 w-3" /> : <History className="h-3 w-3" />} {showHistory ? 'Back to Result' : 'History'}
                  </button>
                )}
              </div>
            </div>

            <div className="p-6 pt-4 flex-1 overflow-hidden relative">
              {/* 🔥🔥🔥 未登录状态：显示 1.png 图片 (纯净显示) 🔥🔥🔥 */}
              {!isLoggedIn ? (
                <div className="relative h-full w-full overflow-hidden rounded-lg bg-black/20">
                  <img
                    src="/images/1.png"
                    alt="AI Generation Preview"
                    className="h-full w-full object-cover opacity-80"
                  />
                </div>
              ) : (
                /* 登录后的正常显示逻辑 */
                <>
                  {/* Case 1: History (Grid-cols-1) */}
                  {showHistory || (generatedImageUrls.length === 0 && !isLoading && history.length > 0) ? (
                    <div className="h-full overflow-y-auto custom-scrollbar pr-2">
                      <div className="grid grid-cols-1 gap-4 pb-4">
                        {history.map((item) => {
                          const totalImages = item.images ? item.images.length : 1;
                          const coverImage = item.url || (item.images && item.images.length > 0 ? item.images[0] : null);

                          return (
                            <div key={item.id} className="relative group rounded-xl border border-border/30 bg-black/20 overflow-hidden hover:border-yellow-400/30 transition-all">
                              <div className="cursor-pointer" onClick={() => { 
                                  const urlsToLoad = item.images && item.images.length > 0 ? item.images : [item.url];
                                  setGeneratedImageUrls(urlsToLoad);
                                  setCurrentImageIndex(0); 
                                  setShowHistory(false); 
                              }}>
                                <div className="aspect-video w-full overflow-hidden bg-black/40 relative">
                                  {coverImage ? (
                                    <img src={coverImage} alt={item.prompt} className="w-full h-full object-contain" loading="lazy" />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-[11px] uppercase tracking-widest text-gray-500">
                                      No preview
                                    </div>
                                  )}
                                  
                                  {totalImages > 1 && (
                                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 backdrop-blur-sm border border-white/10 z-10 pointer-events-none">
                                      <Layers className="h-3 w-3 text-yellow-400" />
                                      <span>{totalImages}</span>
                                    </div>
                                  )}

                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors z-0 pointer-events-none" />
                                </div>
                                <div className="p-4 space-y-2">
                                  <div className="flex items-center justify-between text-xs text-gray-400"><span className="bg-white/10 px-2 py-0.5 rounded text-white">{item.type}</span><span>{item.createdAt}</span></div>
                                  <p className="text-sm text-gray-200 line-clamp-2">{item.prompt}</p>
                                  <div className="flex items-center justify-between pt-2 border-t border-white/5"><div className="text-xs text-gray-500">{item.model} • {item.size}</div><div className="text-xs text-yellow-400 hover:text-yellow-300 font-medium">View Detail</div></div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    /* Case 2: Result / Loading */
                    <div className="flex h-full w-full items-center justify-center relative flex-col">
                      <div className="w-full relative flex flex-col justify-center flex-1 min-h-0">
                        {isLoading ? (
                          <div className="flex flex-col items-center"><Sparkles className="h-16 w-16 text-yellow-400 animate-pulse" /><p className="mt-4 text-white animate-pulse">Creating...</p></div>
                        ) : generatedImageUrls.length > 0 ? (
                          <div className="relative h-full w-full group flex items-center justify-center bg-black/20 rounded-lg flex-col">
                            <img key={generatedImageUrls[currentImageIndex]} alt="Result" className="max-h-full max-w-full rounded-lg object-contain shadow-lg" src={generatedImageUrls[currentImageIndex]} />
                            {generatedImageUrls.length > 1 && (
                              <>
                                <button onClick={handlePrevImage} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/60 hover:bg-black/80 text-white rounded-full z-[100] transition-all shadow-lg cursor-pointer"><ChevronLeft className="h-6 w-6" /></button>
                                <button onClick={handleNextImage} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/60 hover:bg-black/80 text-white rounded-full z-[100] transition-all shadow-lg cursor-pointer"><ChevronRight className="h-6 w-6" /></button>
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/60 rounded-full text-xs text-white backdrop-blur-sm z-10">{currentImageIndex + 1} / {generatedImageUrls.length}</div>
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="text-center opacity-50"><p className="text-gray-400">Enter a prompt to start.</p></div>
                        )}
                      </div>
                      {!showHistory && generatedImageUrls.length > 1 && !isLoading && (
                        <div className="w-full flex justify-center gap-2 mt-4 overflow-x-auto pb-2 px-2 flex-shrink-0">
                            {generatedImageUrls.map((url, idx) => (
                                <button key={idx} onClick={() => setCurrentImageIndex(idx)} className={`relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden border-2 transition-all ${currentImageIndex === idx ? 'border-yellow-400 scale-105' : 'border-transparent opacity-60 hover:opacity-100'}`}><img src={url} className="w-full h-full object-cover" /></button>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
            
            {/* Download Actions */}
            {!showHistory && generatedImageUrls.length > 0 && !isLoading && isLoggedIn && (
              <div className="p-4 flex justify-center gap-3 border-t border-border/50">
                <button onClick={handleDownload} disabled={isDownloading} className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-md">{isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Download</button>
                {generatedImageUrls.length > 1 && <button onClick={handleBatchDownload} disabled={isDownloading} className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-green-600 hover:bg-green-500 text-white shadow-md"><Layers className="h-4 w-4" /> Batch</button>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIImageGenerator;
