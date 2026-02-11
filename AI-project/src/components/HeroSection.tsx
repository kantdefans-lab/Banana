'use client';

import { useState, useRef, ChangeEvent, MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import VideoBackground from './VideoBackground';

// 接口定义
interface HeroSectionProps {
  onGenerate?: (prompt: string, mode: string, file?: File | null) => void;
}

export default function HeroSection({ onGenerate }: HeroSectionProps) {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [activeMode, setActiveMode] = useState('nano-banana');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedSubMode, setSelectedSubMode] = useState('veo-3-basic');

  // 文件相关状态
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedSubModeLabel = selectedSubMode === 'veo-3-basic'
    ? 'Veo 3.1 Fast'
    : 'Veo 3 Quality';

  // 辅助函数：将文件转换为 Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleGenerate = async () => {
    // 校验：必须有提示词或者有文件
    if (!prompt.trim() && !selectedFile) return;

    // 1. --- Nano Banana (默认) ---
    if (activeMode === 'nano-banana') {
      const queryParams = new URLSearchParams();
      if (prompt) queryParams.set('prompt', prompt);
      queryParams.set('model', 'nano-banana'); 

      if (selectedFile) {
        queryParams.set('tab', 'image-to-image');
        try {
          const base64Image = await fileToBase64(selectedFile);
          sessionStorage.setItem('pending_upload_image', base64Image);
          sessionStorage.setItem('pending_upload_filename', selectedFile.name);
        } catch (error) {
          console.error("Failed to process image", error);
        }
      } else {
        queryParams.set('tab', 'text-to-image');
      }

      router.push(`/image?${queryParams.toString()}`);
      return; 
    }

    // 2. --- Text to Image ---
    else if (activeMode === 'text-to-image') {
      const queryParams = new URLSearchParams();
      if (prompt) queryParams.set('prompt', prompt);
      
      queryParams.set('tab', 'text-to-image'); 
      queryParams.set('model', 'nano-banana');

      router.push(`/image?${queryParams.toString()}`);
      return;
    }

    // 3. --- Image to Image ---
    else if (activeMode === 'image-to-image') {
      const queryParams = new URLSearchParams();
      if (prompt) queryParams.set('prompt', prompt);

      queryParams.set('model', 'nano-banana');
      queryParams.set('tab', 'image-to-image');

      if (selectedFile) {
        try {
          const base64Image = await fileToBase64(selectedFile);
          sessionStorage.setItem('pending_upload_image', base64Image);
          sessionStorage.setItem('pending_upload_filename', selectedFile.name);
        } catch (error) {
          console.error("Failed to process image", error);
        }
      }

      router.push(`/image?${queryParams.toString()}`);
      return;
    }

    // 4. --- Veo 3 Video (首页下拉选择模式) ---
    else if (activeMode === 'veo-3-video') {
      const queryParams = new URLSearchParams();
      if (prompt) queryParams.set('prompt', prompt);
      
      queryParams.set('tab', 'text'); 

      if (selectedSubMode === 'veo-3-basic') {
        queryParams.set('model', 'veo-3-1-fast');
      } else {
        queryParams.set('model', 'veo-3-1-quality');
      }

      router.push(`/video?${queryParams.toString()}`);
      return;
    }

    // 5. --- Text to Video ---
    else if (activeMode === 'text-to-video') {
      const queryParams = new URLSearchParams();
      if (prompt) queryParams.set('prompt', prompt);
      
      queryParams.set('tab', 'text');
      queryParams.set('model', 'veo-3-1-quality');

      router.push(`/video?${queryParams.toString()}`);
      return;
    }

    // 6. --- Image to Video (🔥 修改的核心位置) ---
    else if (activeMode === 'image-to-video') {
      const queryParams = new URLSearchParams();
      if (prompt) queryParams.set('prompt', prompt);

      queryParams.set('tab', 'image'); 
      queryParams.set('model', 'veo-3-1-quality');

      if (selectedFile) {
        try {
          // 1. 保留 sessionStorage 逻辑作为备份
          const base64Image = await fileToBase64(selectedFile);
          sessionStorage.setItem('pending_upload_image', base64Image);
          sessionStorage.setItem('pending_upload_filename', selectedFile.name);

          // 🔥 2. 新增：创建 Blob URL 并添加到查询参数中
          // 这是 VideoGenerator 能够直接获取图片的关键
          const objectUrl = URL.createObjectURL(selectedFile);
          queryParams.set('image', objectUrl);

        } catch (error) {
          console.error("Failed to process image", error);
        }
      }

      router.push(`/video?${queryParams.toString()}`);
      return;
    }

    // 7. --- 其他模式 (通用 fallback) ---
    if (onGenerate) {
      onGenerate(prompt, activeMode, selectedFile);
    } else {
      const queryParams = new URLSearchParams({
        prompt: prompt,
        mode: activeMode,
      });
      if (selectedFile) {
         try {
          const base64Image = await fileToBase64(selectedFile);
          sessionStorage.setItem('pending_upload_image', base64Image);
          sessionStorage.setItem('pending_upload_filename', selectedFile.name);
        } catch (error) {
          console.error("Failed to process image", error);
        }
      }
      router.push(`/generate?${queryParams.toString()}`);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const clearSelectedFile = (e: MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetSelectionState = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getModeConfig = () => {
    const configs = {
      'nano-banana': {
        placeholder: "Type your idea, click 'Generate' to get a image",
        showUploadButton: true,
        buttonText: "Generate for free",
        hints: [
          { 
            label: "PVC Figure", 
            prompt: "Please turn this photo into a figure. Behind it, there should be a Model packaging box with the character from this photo printed on it. In front of the box, on a round plastic base, place the figure version of the photo I gave you. I’d like the PVC material to be clearly represented. It would be even better if the background is indoors.4k，high quality" 
          },
          { 
            label: "Detailed Armor", 
            prompt: "Action figure of a mecha musume, detailed armor, dynamic pose, standing on a diorama of a ruined city, macro photo, studio lighting, shallow depth of field, bokeh, ultra detailed, photorealistic" 
          },
          { 
            label: "Blender Modeling", 
            prompt: "Turn this photo into a characterfigure. Behind it, place a box withthe character's image printed on it,and a computer showing the Blendermodeling process on its screen. In frontof the box, add a round plastic basewith the character figure standing on it .set the scene" 
          }
        ]
      },
      'veo-3-video': {
        placeholder: "Type your idea, click 'Generate' to get a video",
        showUploadButton: false,
        buttonText: "Generate for free",
        hints: [
          { 
            label: "Moonlit garden", 
            prompt: "A cinematic scene in a mystical Japanese garden at midnight: cherry blossom petals falling gently around a stone lantern glowing softly. The camera performs a slow circular dolly movement around the lantern. A woman in a flowing white kimono walks gracefully across a wooden bridge over a koi pond. The background features traditional pagoda silhouettes against a star-filled sky. Lighting is ethereal and soft, with moonbeams filtering through bamboo leaves creating intricate shadow patterns. The audio includes gentle wind chimes and distant temple bells. The color palette consists of deep midnight blue, silver moonlight, and soft pink cherry blossoms. No dialogue. No subtitles." 
          },
          { 
            label: "Desert forge", 
            prompt: "A dramatic scene in an ancient blacksmith's forge in the middle of a vast desert: sparks flying as a master craftsman hammers glowing metal on an anvil. The camera starts with a wide establishing shot then slowly pushes in to a close-up of the craftsman's focused eyes. A hooded figure works intensely, sweat glistening in the firelight. The background shows endless sand dunes under a blazing sunset sky. Lighting is harsh and dramatic with flickering forge flames casting dancing shadows. The audio features rhythmic hammer strikes, crackling fire, and desert wind. The color palette includes deep orange flames, golden sand, and rich bronze tones. The craftsman whispers 'Tonight, we forge destiny.' No subtitles." 
          },
          { 
            label: "Underwater ballet", 
            prompt: "A surreal underwater scene in crystal-clear tropical waters: a graceful dancer in flowing fabric performs an elegant ballet routine while completely submerged. The camera executes a smooth tracking shot following the dancer's movements from multiple angles. Schools of colorful fish swim around the performer creating natural choreography. The background features vibrant coral reefs and filtered sunlight beams penetrating the water surface. Lighting is soft and dreamlike with caustic light patterns dancing across everything. The audio includes muffled classical piano music and gentle bubble sounds. The color palette consists of turquoise blue, coral pink, and golden sunlight rays. No dialogue. No subtitles." 
          },
          { 
            label: "Mountain monastery", 
            prompt: "A cinematic scene at a remote mountain monastery during dawn: monks in burgundy robes walking in single file along narrow stone pathways carved into the cliff face. The camera performs a sweeping aerial shot that gradually descends to eye level with the monks. An elderly monk leads the procession, prayer beads in hand. The background shows misty mountain peaks emerging from clouds with ancient temple buildings perched impossibly on rocky outcrops. Lighting is soft and golden with morning mist creating atmospheric depth. The audio features Tibetan throat singing, distant temple horns, and mountain wind. The color palette includes warm golden sunrise, deep burgundy robes, and cool gray stone. The lead monk chants 'The path to enlightenment begins with a single step.' Include English subtitles." 
          },
          { 
            label: "Cosmic library", 
            prompt: "A fantastical scene inside an infinite cosmic library floating in space: towering bookshelves stretching endlessly upward filled with glowing books, while constellations and nebulae swirl outside massive crystal windows. The camera performs a slow vertical crane shot rising between the shelves. A mysterious librarian in star-patterned robes floats gracefully between the shelves, books orbiting around them like planets. The background features swirling galaxies and distant supernovas visible through the transparent walls. Lighting is ethereal and magical with books emitting soft bioluminescent glows in various colors. The audio includes cosmic ambient sounds, gentle page-turning, and celestial harmonies. The color palette consists of deep space purple, electric blue nebulae, and warm golden book light. The librarian whispers 'Every story ever told lives here among the stars.' No subtitles." 
          },
          { 
            label: "Venetian masquerade", 
            prompt: "An opulent scene at a grand Venetian masquerade ball in an 18th-century palazzo: elegantly dressed figures in elaborate masks dancing in a candlelit ballroom with ornate frescoed ceilings. The camera executes a smooth steadicam shot weaving through the dancing couples. A mysterious woman in a silver mask and midnight blue gown glides across the marble floor, her eyes meeting the camera through her mask. The background features gilt mirrors, crystal chandeliers, and tall windows overlooking moonlit canals. Lighting is warm and romantic with flickering candlelight creating dramatic shadows and highlights. The audio includes a live string quartet playing baroque music and the rustle of silk gowns. The color palette includes rich burgundy, gold leaf, and deep midnight blue. The woman says 'Behind every mask lies a secret worth discovering.' No subtitles." 
          }
        ]
      },
      'text-to-image': {
        placeholder: "Type your idea, click 'Generate' to get a image",
        showUploadButton: false,
        buttonText: "Generate for free",
        hints: [
          { label: "Fantasy creature", prompt: "A Chinese dragon in ink wash painting style swirling through clouds, with golden sunrise in the background" },
          { label: "Floating castle", prompt: "A tall crystal castle built on a floating island, surrounded by pink clouds, with dragons flying in the distance" },
          { label: "Food photography", prompt: "Overhead view of a Japanese ramen bowl with perfect soft-boiled egg, char siu and green onions, steam rising, warm lighting" },
          { label: "Artist studio", prompt: "An artist painting in a sunlit studio, walls covered with half-finished artworks, van Gogh inspired style" },
          { label: "Sci-fi cityscape", prompt: "Futuristic city at night with neon reflections in wet streets, flying cars between towering buildings, cyberpunk aesthetic" }
        ]
      },
      'image-to-image': {
        placeholder: "Type your idea, click 'Generate' to get a image",
        showUploadButton: true,
        buttonText: "Generate for free",
        hints: [
          { label: "Art style transfer", prompt: "Transform this image into the style of Van Gogh's Starry Night" },
          { label: "Day to night", prompt: "Convert this daytime scene to dusk or night, adding stars and moonlight" },
          { label: "Fantasy transformation", prompt: "Transform this ordinary scene into a fantasy world with magical elements and mythical creatures" },
          { label: "Season change", prompt: "Change the current season to a different one, such as summer to winter with snow" },
          { label: "Age transformation", prompt: "Show how this same person would look both younger and older" }
        ]
      },
      'text-to-video': {
        placeholder: "Type your idea, click 'Generate' to get a video",
        showUploadButton: false,
        buttonText: "Generate for free",
        hints: [
          { label: "Coastal sunset", prompt: "Gentle waves washing onto a golden beach as the sun slowly sets, painting the sky with vibrant orange and red gradients" },
          { label: "Space adventure", prompt: "An astronaut floating outside a space station, performing maintenance with Earth slowly rotating in the background, stars twinkling" },
          { label: "Forest path", prompt: "Sunlight filtering through dense forest canopy onto a winding path, leaves gently rustling in the breeze, creating dappled light patterns" },
          { label: "City timelapse", prompt: "Nighttime city timelapse with flowing car lights creating light trails, skyscrapers with twinkling windows, and a shooting star crossing the sky" },
          { label: "Autumn scene", prompt: "A park in autumn with red and golden leaves falling gently, a person walking slowly along a tree-lined path" }
        ]
      },
      'image-to-video': {
        placeholder: "Type your idea, click 'Generate' to get a video",
        showUploadButton: true,
        buttonText: "Generate for free",
        hints: [
          { label: "Add rain effect", prompt: "Add gentle rainfall to this image, with droplets creating small splashes on surfaces" },
          { label: "Animate portrait", prompt: "Make the person in this photo smile or blink subtly while keeping the background static" },
          { label: "Add wind motion", prompt: "Add a breeze effect causing leaves, hair or clothing in the image to gently sway" },
          { label: "3D rotate object", prompt: "Convert the main object in this image to 3D and slowly rotate it to show all sides" },
          { label: "Magic particles", prompt: "Convert the main object in this image to 3D and slowly rotate it to show all sides" }
        ]
      }
    };

    return configs[activeMode as keyof typeof configs] || configs['nano-banana'];
  };

  const currentMode = getModeConfig();

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center">
      <VideoBackground />

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/jpg, image/webp"
      />

      <div className="relative z-10 mx-auto w-full max-w-7xl flex flex-col items-center justify-center px-4 sm:px-6">
        <div className="mx-auto mb-6 max-w-6xl text-center md:mb-8">
          <h1 className="text-3xl font-bold lg:text-5xl 2xl:text-5xl">
            <span className="block leading-tight text-white">
              Free <span className="text-[#f8d24b]">Nano Banana AI Image Generator</span>
            </span>
            <span className="text-[#f8d24b] mt-4 block text-sm font-bold md:text-2xl">
              Create & Edit Images Instantly with Simple Prompts
            </span>
          </h1>
          <p className="md:text-md mx-auto mt-3 hidden max-w-6xl text-xs text-gray-300 md:block">
            Unlock your creative power with our leading Nano Banana AI platform. Effortlessly craft exceptional artwork, illustrations, and visual content through advanced Nano Banana AI technology powered by our Nano Banana AI Image Generator.
          </p>
        </div>

        <div className="z-10 w-full max-w-6xl rounded-xl border border-gray-400/30 bg-[#111111]/40 shadow-lg backdrop-blur-md">
          {/* Mode Tabs */}
          <div className="scrollbar-hide hidden border-b border-gray-400/30 px-3 pt-5 sm:px-5 md:flex">
            {[
              { id: 'nano-banana', label: 'Nano Banana', icon: 'palette', badge: 'new', defaultActive: true },
              { id: 'veo-3-video', label: 'Veo 3 Video', icon: 'play', badge: 'hot' },
              { id: 'text-to-image', label: 'Text to Image', icon: 'wand-sparkles' },
              { id: 'image-to-image', label: 'Image to Image', icon: 'camera' },
              { id: 'text-to-video', label: 'Text to Video', icon: 'video' },
              { id: 'image-to-video', label: 'Image to Video', icon: 'film' }
            ].map((mode) => (
              <button
                key={mode.id}
                className={`group relative flex flex-1 flex-col items-center justify-center whitespace-nowrap pb-3 text-center text-sm transition-all duration-200 sm:text-base ${activeMode === mode.id || (mode.defaultActive && activeMode === 'nano-banana')
                  ? 'border-b-2 border-[#f8d24b] font-medium text-white'
                  : 'text-gray-300 hover:text-white'
                  }`}
                onClick={() => {
                  setActiveMode(mode.id);
                  resetSelectionState();
                  if (mode.id === 'veo-3-video') {
                    setSelectedSubMode('veo-3-basic');
                  }
                }}
              >
                <div className="flex items-center justify-center">
                  <span className={`transition-colors duration-200 ${activeMode === mode.id || (mode.defaultActive && activeMode === 'nano-banana')
                    ? 'text-[#f8d24b]'
                    : 'text-gray-400 group-hover:text-gray-300'
                    }`}>
                    <ModeIcon icon={mode.icon} />
                  </span>
                  <span className="ml-2">{mode.label}</span>
                  {mode.badge && (
                    <div className="ml-2 mr-3 flex gap-1.5">
                      <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${mode.badge === 'new'
                        ? 'bg-gradient-to-r from-[#FF6B35] to-[#FFA726]'
                        : 'bg-gradient-to-r from-red-500 to-orange-500'
                        } text-white`}>
                        {mode.badge}
                      </span>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Mobile Selector */}
          <div className="border-b border-gray-400/30 p-3 md:hidden">
            <div className="relative">
              <button className="flex w-full items-center justify-between rounded-md border border-gray-400/30 bg-[#222]/90 px-4 py-3 text-white">
                <span className="flex items-center">
                  <span className="text-gray-400">
                    <ModeIcon icon="palette" />
                  </span>
                  <span className="ml-2">Nano Banana</span>
                  <div className="ml-2 mr-3 flex gap-1.5">
                    <span className="rounded-md px-1.5 py-0.5 text-[9px] font-semibold bg-gradient-to-r from-[#FF6B35] to-[#FFA726] text-white">
                      new
                    </span>
                  </div>
                </span>
                <svg className="lucide lucide-chevron-down h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"></path></svg>
              </button>
            </div>
          </div>

          {/* Veo 3 Video Mode */}
          {activeMode === 'veo-3-video' && (
            <div className="border-b border-gray-400/30 p-4">
              <div className="flex flex-col">
                <div className="w-full">
                  <div className="px-4 pb-0 pt-6 sm:px-6">
                    <div className="">
                      <textarea
                        id="prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={currentMode.placeholder}
                        className="h-full min-h-[100px] w-full resize-none text-base text-white outline-none focus:outline-none focus:ring-0 sm:text-lg rounded-lg px-4 py-3 placeholder:text-gray-400"
                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                            handleGenerate();
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-auto p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-auto">
                        <div className="w-full relative">
                          <button
                            className="justify-center whitespace-nowrap rounded-md font-medium transition-colors border shadow-sm h-9 flex w-full items-center gap-1 border-gray-700 bg-[#1a1a1a] hover:bg-[#222] py-2 px-3 text-sm"
                            type="button"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                          >
                            <span className="text-[#f8d24b] truncate">{selectedSubModeLabel}</span>
                            <svg className={`lucide lucide-chevron-down h-4 w-4 text-white transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"></path></svg>
                          </button>

                          {/* ✅ 新的复杂下拉菜单 */}
                          {isDropdownOpen && (
                            <div className="absolute bottom-full left-0 mb-2 z-50 w-80 md:w-96 rounded-md border border-gray-700 bg-[#111] p-0 shadow-2xl origin-bottom animate-in fade-in zoom-in-95 slide-in-from-bottom-2">
                              <div className="custom-scrollbar flex max-h-[60vh] flex-col overflow-auto">
                                
                                {/* Option 1: Veo 3.1 Fast */}
                                <button
                                  className={`flex w-full flex-col border-b border-gray-700 p-4 pr-2 text-left transition-all duration-200 hover:bg-[#222] ${selectedSubMode === 'veo-3-basic' ? 'border-l-2 border-l-[#f8d24b] bg-[#1a1a1a]' : ''}`}
                                  onClick={() => { setSelectedSubMode('veo-3-basic'); setIsDropdownOpen(false); }}
                                >
                                  <div className="relative z-10 mb-2 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className={`text-lg font-medium ${selectedSubMode === 'veo-3-basic' ? 'text-[#f8d24b] font-semibold' : 'text-white'}`}>Veo 3.1 Fast</span>
                                      <span className="rounded-full px-2 py-1 text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">HOT</span>
                                      {selectedSubMode === 'veo-3-basic' && (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check ml-auto h-5 w-5 text-[#f8d24b]">
                                          <path d="M20 6 9 17l-5-5"></path>
                                        </svg>
                                      )}
                                    </div>
                                  </div>
                                  <p className="text-sm relative z-10 mb-3 text-gray-400">Stable and reliable video generation model for most scenarios</p>
                                </button>

                                {/* Option 2: Veo 3 Quality */}
                                <button
                                  className={`flex w-full flex-col border-b border-gray-700 p-4 pr-2 text-left transition-all duration-200 hover:bg-[#222] relative ${selectedSubMode === 'veo-3-premium' ? 'border-l-2 border-l-[#f8d24b] bg-[#1a1a1a]' : ''}`}
                                  onClick={() => { setSelectedSubMode('veo-3-premium'); setIsDropdownOpen(false); }}
                                >
                                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#f8d24b]/5 to-transparent"></div>
                                  <div className="relative z-10 mb-2 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className={`text-lg font-medium ${selectedSubMode === 'veo-3-premium' ? 'text-[#f8d24b] font-semibold' : 'text-white'}`}>Veo 3 Quality</span>
                                      <span className="rounded-full px-2 py-1 text-xs font-medium border border-[#f8d24b]/30 bg-[#f8d24b]/20 text-[#f8d24b]">PREMIUM</span>
                                      {selectedSubMode === 'veo-3-premium' && (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check ml-auto h-5 w-5 text-[#f8d24b]">
                                          <path d="M20 6 9 17l-5-5"></path>
                                        </svg>
                                      )}
                                    </div>
                                  </div>
                                  <p className="text-sm relative z-10 mb-3 text-gray-400">Immersive sound & ultra-realistic visuals</p>
                                  <div className="relative z-10 mb-3">
                                    <div className="inline-block rounded bg-[#f8d24b] px-2 py-1 text-xs font-medium text-black">Premium feature with enhanced audio capabilities</div>
                                  </div>
                                  <div className="relative z-10 mb-3 space-y-1.5">
                                    <div className="flex items-start gap-2">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-green-400">
                                        <path d="M20 6 9 17l-5-5"></path>
                                      </svg>
                                      <span className="text-xs leading-relaxed text-gray-300">🎵 Native audio generation (dialogue, SFX, music)</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-green-400">
                                        <path d="M20 6 9 17l-5-5"></path>
                                      </svg>
                                      <span className="text-xs leading-relaxed text-gray-300">🎯 Ultra-realistic 4K quality output</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-green-400">
                                        <path d="M20 6 9 17l-5-5"></path>
                                      </svg>
                                      <span className="text-xs leading-relaxed text-gray-300">🎭 Perfect lip-sync & character animation</span>
                                    </div>
                                  </div>
                                  <div className="relative z-10 flex items-center justify-end">
                                    <span className="flex items-center gap-1 rounded bg-[#f8d24b]/10 px-2 py-1 text-xs font-medium text-[#f8d24b]">⭐ Recommended</span>
                                  </div>
                                </button>
                              </div>
                              
                              {/* Bottom Info Bar */}
                              <div className="border-t border-gray-700 bg-[#1a1a1a] px-4 py-3 rounded-b-md">
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                  <span className="text-[#f8d24b]">💡</span>
                                  <span>Premium models include advanced AI capabilities</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleGenerate}
                      disabled={!prompt.trim()}
                      className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-all bg-[#f8d24b] text-black shadow-lg hover:bg-[#f8d24b]/90 h-10 px-6 py-2 font-bold disabled:opacity-50"
                    >
                      <svg className="lucide lucide-sparkles mr-1 h-3 w-3 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path><path d="M20 3v4"></path><path d="M22 5h-4"></path><path d="M4 17v2"></path><path d="M5 18H3"></path></svg>
                      {currentMode.buttonText}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Standard Mode (Nano Banana etc.) */}
          {activeMode !== 'veo-3-video' && (
            <div className="flex flex-col">
              <div className="w-full">
                <div className="px-4 pb-0 pt-6 sm:px-6">
                  <div className="relative">
                    {/* ✅ 已移除 Textarea 内的图片预览 Overlay */}
                    <textarea
                      id="prompt"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder={currentMode.placeholder}
                      className="h-full min-h-[100px] w-full resize-none text-base text-white outline-none focus:outline-none focus:ring-0 sm:text-lg rounded-lg px-4 py-3 placeholder:text-gray-400 pr-10"
                      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                          handleGenerate();
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-auto p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {currentMode.showUploadButton && (
                      <div className="ml-2 mt-1 min-h-[36px] flex items-center">
                        {/* ✅ 底部工具栏：无文件显示上传图标，有文件显示缩略图+删除 */}
                        {!selectedFile ? (
                          <button
                            className="text-gray-300 hover:text-white disabled:opacity-50 transition-colors p-1 hover:bg-white/10 rounded-md"
                            aria-label="Upload image"
                            title="Upload image"
                            onClick={handleUploadClick}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-image-up h-6 w-6 sm:h-7 sm:w-7">
                              <path d="M10.3 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10l-3.1-3.1a2 2 0 0 0-2.814.014L6 21"></path>
                              <path d="m14 19.5 3-3 3 3"></path>
                              <path d="M17 22v-5.5"></path>
                              <circle cx="9" cy="9" r="2"></circle>
                            </svg>
                          </button>
                        ) : (
                          <div className="relative inline-block animate-in fade-in zoom-in duration-200">
                            <div 
                              className="h-9 w-9 rounded-md border border-[#f8d24b] overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={handleUploadClick}
                              title="Click to replace image"
                            >
                              {previewUrl && <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />}
                            </div>
                            <button
                              onClick={clearSelectedFile}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:bg-red-600 transition-colors z-10"
                              title="Remove image"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x">
                                <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={handleGenerate}
                    disabled={!prompt.trim() && !selectedFile}
                    className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-all bg-[#f8d24b] text-black shadow-lg hover:bg-[#f8d24b]/90 h-10 px-6 py-2 font-bold disabled:opacity-50"
                  >
                    <svg className="lucide lucide-sparkles mr-1 h-3 w-3 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path><path d="M20 3v4"></path><path d="M22 5h-4"></path><path d="M4 17v2"></path><path d="M5 18H3"></path></svg>
                    {currentMode.buttonText}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Hints */}
        <div className="relative z-10 mt-4 flex flex-col items-center justify-center text-xs text-gray-300 sm:flex-row sm:text-sm">
           <span className="mb-2 sm:mb-0 sm:mr-4 text-white">Hints:</span>
           <div className="flex flex-wrap justify-center gap-2">
             {'hints' in currentMode && currentMode.hints.map((hint: any, index: number) => (
               <button key={index} onClick={() => setPrompt(hint.prompt)} className="items-center rounded-md border border-gray-400/30 bg-[#222]/60 px-2 py-1 text-xs">{hint.label}</button>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
}

// ModeIcon Helper
function ModeIcon({ icon }: { icon: string }) {
  switch (icon) {
    case 'palette': return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"></circle><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"></circle><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"></circle><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"></circle><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path></svg>;
    case 'play': return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>;
    case 'wand-sparkles': return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72"></path><path d="m14 7 3 3"></path><path d="M5 6v4"></path><path d="M19 14v4"></path><path d="M10 2v2"></path><path d="M7 8H3"></path><path d="M21 16h-4"></path><path d="M11 3H9"></path></svg>;
    case 'camera': return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2 2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path><circle cx="12" cy="13" r="3"></circle></svg>;
    case 'video': return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"></path><rect x="2" y="6" width="14" height="12" rx="2"></rect></svg>;
    case 'film': return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><rect width="18" height="18" x="3" y="3" rx="2"></rect><path d="M7 3v18"></path><path d="M3 7.5h4"></path><path d="M3 12h18"></path><path d="M3 16.5h4"></path><path d="M17 3v18"></path><path d="M17 7.5h4"></path><path d="M17 16.5h4"></path></svg>;
    default: return null;
  }
}