'use client';

import { useRef, useState, useEffect } from 'react';
import { 
  Maximize2,
  Minimize2,
  RotateCcw,
  Download,
  Share2,
  Copy
} from 'lucide-react';

interface CanvasElement {
  id: string;
  type: 'image' | 'text' | 'shape';
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  rotation: number;
}

interface MainCanvasProps {
  scale: number;
  currentImage: string | null;
}

export default function MainCanvas({ scale, currentImage }: MainCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 1024, height: 1024 });

  // 初始化画布元素
  useEffect(() => {
    const initialElements: CanvasElement[] = [
      {
        id: '1',
        type: 'shape',
        x: 100,
        y: 100,
        width: 200,
        height: 200,
        content: 'rectangle',
        rotation: 0
      },
      {
        id: '2',
        type: 'text',
        x: 400,
        y: 300,
        width: 300,
        height: 50,
        content: 'Edit this text...',
        rotation: 0
      }
    ];
    setElements(initialElements);
  }, []);

  // 处理拖放
  useEffect(() => {
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      if (!canvasRef.current) return;

      const resourceId = e.dataTransfer?.getData('resourceId');
      const resourceName = e.dataTransfer?.getData('resourceName');
      
      if (resourceId && resourceName) {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / scale;
        const y = (e.clientY - rect.top) / scale;

        const newElement: CanvasElement = {
          id: `element-${Date.now()}`,
          type: 'image',
          x,
          y,
          width: 200,
          height: 200,
          content: resourceName,
          rotation: 0
        };

        setElements(prev => [...prev, newElement]);
        setSelectedElement(newElement.id);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('drop', handleDrop);
      canvas.addEventListener('dragover', handleDragOver);
    }

    return () => {
      if (canvas) {
        canvas.removeEventListener('drop', handleDrop);
        canvas.removeEventListener('dragover', handleDragOver);
      }
    };
  }, [scale]);

  const handleElementClick = (elementId: string) => {
    setSelectedElement(elementId);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    // 点击画布空白处取消选择
    if (e.target === e.currentTarget) {
      setSelectedElement(null);
    }
  };

  const renderElement = (element: CanvasElement) => {
    const isSelected = selectedElement === element.id;
    
    const style = {
      left: `${element.x}px`,
      top: `${element.y}px`,
      width: `${element.width}px`,
      height: `${element.height}px`,
      transform: `rotate(${element.rotation}deg)`,
      transformOrigin: 'center center'
    };

    let content;
    switch(element.type) {
      case 'shape':
        content = (
          <div className={`w-full h-full border-2 ${
            element.content === 'rectangle' 
              ? 'border-blue-400 bg-blue-400/20' 
              : 'border-green-400 bg-green-400/20 rounded-full'
          } ${isSelected ? 'border-orange-500' : ''}`} />
        );
        break;
      case 'text':
        content = (
          <div className={`w-full h-full p-2 border ${
            isSelected ? 'border-orange-500 bg-orange-500/10' : 'border-gray-400 bg-gray-800/50'
          } rounded`}>
            <div className="text-white text-sm">{element.content}</div>
          </div>
        );
        break;
      case 'image':
        content = (
          <div className={`w-full h-full border-2 ${
            isSelected ? 'border-orange-500' : 'border-purple-400'
          } bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg overflow-hidden`}>
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl mb-2">🖼️</div>
                <div className="text-xs text-gray-300 truncate px-2">{element.content}</div>
              </div>
            </div>
          </div>
        );
        break;
    }

    return (
      <div
        key={element.id}
        className={`absolute cursor-move group ${isSelected ? 'z-10' : 'z-0'}`}
        style={style}
        onClick={() => handleElementClick(element.id)}
      >
        {content}
        
        {/* 选择控制点 */}
        {isSelected && (
          <>
            <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-orange-500 rounded-full cursor-nw-resize" />
            <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-orange-500 rounded-full cursor-ne-resize" />
            <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-orange-500 rounded-full cursor-sw-resize" />
            <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-orange-500 rounded-full cursor-se-resize" />
            
            {/* 旋转控制点 */}
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-orange-500 rounded-full cursor-grab flex items-center justify-center">
              <div className="text-white text-xs">↻</div>
            </div>
          </>
        )}
      </div>
    );
  };

  const handleFullscreenToggle = () => {
    if (!document.fullscreenElement) {
      canvasRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const canvasStyle = {
    transform: `scale(${scale})`,
    transformOrigin: 'center center',
    width: `${canvasSize.width}px`,
    height: `${canvasSize.height}px`,
    transition: 'transform 0.2s ease'
  };

  return (
    <div className="h-full flex flex-col">
      {/* 画布控制栏 */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-white">Canvas</span>
          <span className="text-xs text-gray-400">
            {canvasSize.width}×{canvasSize.height}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCanvasSize({ width: 1024, height: 1024 })}
            className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm"
          >
            1:1
          </button>
          <button
            onClick={() => setCanvasSize({ width: 1280, height: 720 })}
            className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm"
          >
            16:9
          </button>
          <button
            onClick={() => setCanvasSize({ width: 1080, height: 1350 })}
            className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm"
          >
            4:5
          </button>
          
          <div className="w-px h-6 bg-gray-700 mx-2" />
          
          <button
            onClick={handleFullscreenToggle}
            className="p-2 hover:bg-gray-800 rounded-lg"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* 主画布区域 */}
      <div className="flex-1 overflow-auto bg-gray-900/30 rounded-xl border border-gray-700/50">
        <div className="flex items-center justify-center h-full p-8">
          <div
            ref={canvasRef}
            className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg shadow-2xl overflow-hidden"
            style={canvasStyle}
            onClick={handleCanvasClick}
          >
            {/* 网格背景 */}
            <div className="absolute inset-0 opacity-10">
              <div 
                className="absolute inset-0"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, #4b5563 1px, transparent 1px),
                    linear-gradient(to bottom, #4b5563 1px, transparent 1px)
                  `,
                  backgroundSize: '40px 40px'
                }}
              />
            </div>

            {/* 画布元素 */}
            {elements.map(renderElement)}

            {/* 当前生成的图像 */}
            {currentImage && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative max-w-full max-h-full">
                  <div className="bg-gradient-to-br from-orange-500/20 to-yellow-500/20 p-8 rounded-2xl">
                    <div className="text-center">
                      <div className="text-6xl mb-4">🎨</div>
                      <div className="text-white text-lg font-medium mb-2">
                        Generated Image
                      </div>
                      <div className="text-gray-300 text-sm">
                        Ready for editing
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 画布中心标记 */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
            </div>

            {/* 尺寸标注 */}
            <div className="absolute top-2 left-2 text-xs text-gray-500">
              {canvasSize.width}px
            </div>
            <div className="absolute top-2 right-2 text-xs text-gray-500">
              {canvasSize.height}px
            </div>
          </div>
        </div>
      </div>

      {/* 画布操作栏 */}
      <div className="flex items-center justify-between mt-4 px-2">
        <div className="flex items-center space-x-2">
          <button className="p-2 hover:bg-gray-800 rounded-lg">
            <RotateCcw className="h-4 w-4" />
          </button>
          <button className="p-2 hover:bg-gray-800 rounded-lg">
            <Copy className="h-4 w-4" />
          </button>
          <button className="p-2 hover:bg-gray-800 rounded-lg">
            <Share2 className="h-4 w-4" />
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm">
            Clear Canvas
          </button>
          <button className="px-4 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 rounded-lg text-sm text-white font-medium flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>
    </div>
  );
}