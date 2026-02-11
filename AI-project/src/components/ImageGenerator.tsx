// @ts-nocheck
'use client'

import { useState } from 'react'
import { Sparkles, Loader2, Download, RefreshCw } from 'lucide-react'
import { Button } from '@/app/components/ui/Button'
import { Textarea } from '@/app/components/ui/Textarea'
import { Select } from '@/app/components/ui/Select'

interface ImageGeneratorProps {
  onGenerate?: (prompt: string, options?: any) => void;
  isGenerating?: boolean;
  srOnlyTitle?: string;
  [key: string]: any;
}

const STYLES = [
  { value: 'realistic', label: 'Realistic Photo' },
  { value: 'artistic', label: 'Artistic' },
  { value: 'anime', label: 'Anime Style' },
  { value: 'digital-art', label: 'Digital Art' },
  { value: '3d-render', label: '3D Render' },
]

const ASPECT_RATIOS = [
  { value: '1:1', label: 'Square (1:1)' },
  { value: '16:9', label: 'Widescreen (16:9)' },
  { value: '4:3', label: 'Standard (4:3)' },
  { value: '9:16', label: 'Portrait (9:16)' },
]

export default function ImageGenerator(props: any) {
  const { onGenerate, isGenerating, srOnlyTitle } = props || {};
  const isLoading = isGenerating;
  const [prompt, setPrompt] = useState('')
  const [config, setConfig] = useState({
    style: 'realistic',
    aspectRatio: '1:1',
    numImages: 1,
    resolution: '1024x1024'
  })

  const handleGenerate = () => {
    if (prompt.trim()) {
      onGenerate?.(prompt, config)
    }
  }

  const generateRandomPrompt = () => {
    const prompts = [
      'A majestic dragon flying over a medieval castle at sunset',
      'Cyberpunk cityscape with neon lights and flying cars',
      'Cute anime girl in a magical forest with glowing mushrooms',
      'Futuristic spaceship landing on an alien planet',
      'Steampunk robot in a Victorian era workshop',
    ]
    setPrompt(prompts[Math.floor(Math.random() * prompts.length)])
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">
          Describe your image
        </label>
        <div className="relative">
          <Textarea
            value={prompt}
            onChange={(e: any) => setPrompt(e.target.value)}
            placeholder="Describe what you want to create... (e.g., 'A majestic dragon flying over a medieval castle at sunset')"
            className="min-h-[120px]"
            disabled={isLoading}
          />
          <div className="absolute bottom-2 right-2">
            <button
              onClick={generateRandomPrompt}
              className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
              type="button"
            >
              <Sparkles className="w-4 h-4" />
              Random prompt
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Style
          </label>
          <Select
            value={config.style}
            onValueChange={(value: any) => setConfig({ ...config, style: value })}
            options={STYLES}
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Aspect Ratio
          </label>
          <Select
            value={config.aspectRatio}
            onValueChange={(value: any) => setConfig({ ...config, aspectRatio: value })}
            options={ASPECT_RATIOS}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Number of images
            </label>
            <div className="flex gap-2">
              {[1, 2, 4].map((num) => (
                <button
                  key={num}
                  onClick={() => setConfig({ ...config, numImages: num })}
                  className={`px-3 py-1 rounded-md text-sm ${
                    config.numImages === num
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                  disabled={isLoading}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm text-gray-400 mb-2">
            Estimated cost: <span className="text-purple-400 font-bold">4 credits</span>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={isLoading || !prompt.trim()}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Image
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}