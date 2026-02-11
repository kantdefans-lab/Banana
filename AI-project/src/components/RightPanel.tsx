'use client';

import { useState } from 'react';
import {
  Sparkles,
  Settings,
  ChevronDown,
  Copy,
  RefreshCw,
  Zap,
  History,
  Crown,
  Star,
  Wand2,
  Image as ImageIcon,
  Video,
  Camera
} from 'lucide-react';

interface GenerationHistory {
  id: string;
  prompt: string;
  model: string;
  timestamp: string;
  preview: string;
}

interface GenerationPanelProps {
  onGenerate: (imageData: string) => void;
}

export default function GenerationPanel({ onGenerate }: GenerationPanelProps) {
  const [prompt, setPrompt] = useState('A beautiful anime girl in a cyberpunk city, detailed, 4k');
  const [negativePrompt, setNegativePrompt] = useState('blurry, low quality, deformed');
  const [selectedModel, setSelectedModel] = useState('nano-banana-pro');
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [showHistory, setShowHistory] = useState(true);
  const [creativity, setCreativity] = useState(75);
  const [details, setDetails] = useState(85);
  const [steps, setSteps] = useState(30);

  const models = [
    { id: 'nano-banana-pro', name: 'Nano Banana Pro', badge: 'new', credits: 4 },
    { id: 'flux-schnell', name: 'Flux Schnell', badge: 'free', credits: 1 },
    { id: 'dall-e-3', name: 'DALL-E 3', badge: 'hot', credits: 3 },
    { id: 'sd-xl', name: 'SD XL', badge: 'free', credits: 1 },
    { id: 'midjourney', name: 'Midjourney', badge: 'pro', credits: 5 },
  ];

  const history: GenerationHistory[] = [
    {
      id: '1',
      prompt: 'Cyberpunk city at night',
      model: 'Nano Banana Pro',
      timestamp: '10 min ago',
      preview: '🌃'
    },
    {
      id: '2',
      prompt: 'Fantasy forest with magic',
      model: 'Flux Schnell',
      timestamp: '1 hour ago',
      preview: '🌲'
    },
    {
      id: '3',
      prompt: 'Portrait of a warrior',
      model: 'DALL-E 3',
      timestamp: '3 hours ago',
      preview: '⚔️'
    }
  ];

  const renderBadge = (type: string) => {
    const styles = {
      new: 'bg-blue-500',
      hot: 'bg-gradient-to-r from-red-500 to-orange-500',
      free: 'bg-green-500',
      pro: 'bg-gradient-to-r from-orange-500 to-yellow-500',
    };
    
    const texts = {
      new: 'NEW',
      hot: 'HOT',
      free: 'FREE',
      pro: 'PRO',
    };

    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${(styles as any)[type]} text-white`}>
        {(texts as any)[type]}
      </span>
    );
  };

  const handleGenerate = () => {
    // 模拟生成图像
    const imageData = `generated-${Date.now()}`;
    onGenerate(imageData);
  };

  return (
    <div className="h-full flex flex-col bg-gray-900/50">
      {/* 面板标题 */}
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-lg font-bold text-white">AI Generation</h2>
        <p className="text-sm text-gray-400 mt-1">Generate images with AI</p>
      </div>

      {/* 模型选择 */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-white">Model</label>
          <button className="p-1 hover:bg-gray-800 rounded">
            <Settings className="h-4 w-4 text-gray-400" />
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {models.map(model => (
            <button
              key={model.id}
              onClick={() => setSelectedModel(model.id)}
              className={`p-3 rounded-lg transition-all ${
                selectedModel === model.id
                  ? 'bg-gradient-to-r from-orange-500/20 to-orange-500/10 border border-orange-500/30'
                  : 'bg-gray-800/50 hover:bg-gray-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg flex items-center justify-center mr-2">
                    <Sparkles className="h-4 w-4 text-gray-300" />
                  </div>
                  <div className="text-left">
                    <div className={`text-sm font-semibold ${
                      selectedModel === model.id ? 'text-white' : 'text-gray-300'
                    }`}>
                      {model.name}
                    </div>
                    <div className="text-xs text-gray-400">{model.credits} credit{model.credits !== 1 ? 's' : ''}</div>
                  </div>
                </div>
                {model.badge && (
                  <div className="scale-90">
                    {renderBadge(model.badge)}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 提示词输入 */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-white">Prompt</label>
          <button
            onClick={() => setIsAdvanced(!isAdvanced)}
            className="text-xs text-orange-400 hover:text-orange-300 flex items-center"
          >
            <Wand2 className="h-3 w-3 mr-1" />
            {isAdvanced ? 'Simple Mode' : 'Advanced Mode'}
          </button>
        </div>
        
        <div className="relative mb-3">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full h-32 bg-gray-800/50 border border-gray-700 rounded-xl p-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
            placeholder="Describe what you want to generate..."
          />
          <div className="absolute bottom-2 right-2 flex space-x-2">
            <button
              onClick={() => navigator.clipboard.writeText(prompt)}
              className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg"
              title="Copy"
            >
              <Copy className="h-3 w-3" />
            </button>
            <button
              onClick={() => setPrompt('')}
              className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg"
              title="Clear"
            >
              <RefreshCw className="h-3 w-3" />
            </button>
          </div>
        </div>

        {isAdvanced && (
          <div className="mt-3">
            <label className="text-sm font-medium text-white mb-2 block">
              Negative Prompt
            </label>
            <input
              type="text"
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="What to exclude from the image..."
            />
          </div>
        )}
      </div>

      {/* 参数调节 */}
      <div className="p-4 border-b border-gray-800">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm font-medium text-white">Creativity</label>
              <span className="text-sm text-gray-400">{creativity}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={creativity}
              onChange={(e) => setCreativity(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-500"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm font-medium text-white">Details</label>
              <span className="text-sm text-gray-400">{details}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={details}
              onChange={(e) => setDetails(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-500"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm font-medium text-white">Steps</label>
              <span className="text-sm text-gray-400">{steps}</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={steps}
              onChange={(e) => setSteps(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2">
            <button className="p-2 bg-gray-800/50 hover:bg-gray-800 rounded-lg text-sm">
              1:1
            </button>
            <button className="p-2 bg-gray-800/50 hover:bg-gray-800 rounded-lg text-sm">
              16:9
            </button>
            <button className="p-2 bg-gray-800/50 hover:bg-gray-800 rounded-lg text-sm">
              4:5
            </button>
          </div>
        </div>
      </div>

      {/* 历史记录 */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center">
              <History className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-sm font-medium text-white">History</span>
            </div>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${
              showHistory ? 'rotate-180' : ''
            }`} />
          </button>
        </div>

        {showHistory && (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-3">
              {history.map(item => (
                <div
                  key={item.id}
                  className="p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors group cursor-pointer"
                  onClick={() => setPrompt(item.prompt)}
                >
                  <div className="flex items-start">
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg flex items-center justify-center text-2xl mr-3">
                      {item.preview}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-300 truncate group-hover:text-white">
                        {item.prompt}
                      </p>
                      <div className="flex items-center mt-1">
                        <span className="text-xs text-gray-400">{item.model}</span>
                        <span className="text-xs text-gray-500 ml-2">{item.timestamp}</span>
                      </div>
                    </div>
                    <button className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-700 rounded">
                      <RefreshCw className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 底部操作区 */}
        <div className="p-4 border-t border-gray-800 space-y-3">
          <button
            onClick={handleGenerate}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 rounded-xl text-white font-bold flex items-center justify-center transition-all shadow-lg shadow-orange-500/20"
          >
            <Zap className="h-5 w-5 mr-2" />
            Generate Image
            <span className="ml-2 text-sm opacity-80">
              ({models.find(m => m.id === selectedModel)?.credits} credits)
            </span>
          </button>

          <div className="grid grid-cols-3 gap-2">
            <button className="p-2 bg-gray-800/50 hover:bg-gray-800 rounded-lg flex flex-col items-center">
              <ImageIcon className="h-4 w-4 mb-1" />
              <span className="text-xs">Image</span>
            </button>
            <button className="p-2 bg-gray-800/50 hover:bg-gray-800 rounded-lg flex flex-col items-center">
              <Video className="h-4 w-4 mb-1" />
              <span className="text-xs">Video</span>
            </button>
            <button className="p-2 bg-gray-800/50 hover:bg-gray-800 rounded-lg flex flex-col items-center">
              <Camera className="h-4 w-4 mb-1" />
              <span className="text-xs">Edit</span>
            </button>
          </div>

          <div className="p-3 bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg flex items-center justify-between">
            <div className="flex items-center">
              <Crown className="h-5 w-5 text-yellow-400 mr-2" />
              <div>
                <div className="text-sm text-white">12 credits left</div>
                <div className="text-xs text-gray-400">Free Plan</div>
              </div>
            </div>
            <button className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 rounded-lg text-sm text-white">
              Upgrade
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}