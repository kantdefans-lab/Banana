import { NextRequest, NextResponse } from 'next/server';
import { getUserInfo } from '@/shared/models/user';
import { getAITasks } from '@/shared/models/ai_task'; 

export const dynamic = 'force-dynamic';

// --- 🔥 核心工具函数：安全解析 JSON ---
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

// --- 🔥 核心工具函数：正则暴力提取所有图片链接 (后端版) ---
const regexExtractImages = (text: string): string[] => {
  const urlRegex = /https?:\/\/[^"'\s\\]+(?:\.(?:jpg|jpeg|png|webp|gif)|tempfile|output|mj-images)[^"'\s\\]*/gi;
  const matches = text.match(urlRegex) || [];
  return Array.from(new Set(matches.filter(url => 
    !url.includes('api.kie.ai') && 
    !url.includes('api.wavespeed.ai') &&
    !url.includes('discord.com') &&
    !url.includes('google')
  )));
};

// --- 🔥 核心工具函数：递归提取图片 ---
const extractImagesFromData = (task: any): string[] => {
  const images = new Set<string>();

  // 1. 准备所有可能包含数据的字段
  const sources = [
    task,
    safeParse(task.taskResult),
    safeParse(task.task_result),
    safeParse(task.taskInfo),
    safeParse(task.task_info),
    safeParse(task.rawData),
    safeParse(task.options)
  ];

  // 辅助遍历函数
  const traverse = (current: any) => {
    if (!current) return;
    
    if (Array.isArray(current)) {
      current.forEach(item => traverse(item));
      return;
    }

    if (typeof current === 'object') {
      // 🎯 Grok/MJ 专用：resultUrls 数组
      if (Array.isArray(current.resultUrls)) {
          current.resultUrls.forEach((url: any) => {
              if (
                typeof url === 'string' &&
                url.startsWith('http') &&
                !url.includes('api.wavespeed.ai')
              ) images.add(url);
          });
      }

      // 🎯 通用字段
      if (
        current.resultUrl &&
        typeof current.resultUrl === 'string' &&
        current.resultUrl.startsWith('http') &&
        !current.resultUrl.includes('api.wavespeed.ai')
      ) {
        images.add(current.resultUrl);
      }
      const genericUrl = current.url || current.image_url || current.image || current.output_url;
      if (
        typeof genericUrl === 'string' &&
        genericUrl.startsWith('http') &&
        !genericUrl.includes('api.wavespeed.ai')
      ) {
        images.add(genericUrl);
      }

      Object.keys(current).forEach(key => traverse(current[key]));
    }

    // 字符串尝试解析
    if (typeof current === 'string') {
        const trimmed = current.trim();
        if (
          trimmed.startsWith('http') &&
          !trimmed.includes('api.kie.ai') &&
          !trimmed.includes('api.wavespeed.ai')
        ) {
            images.add(trimmed);
        } else if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            try { traverse(JSON.parse(current)); } catch(e) {}
        }
    }
  };

  // 执行提取
  sources.forEach(source => traverse(source));

  // 🔥 兜底：如果遍历对象没找到，把整个 task 转成字符串用正则扫一遍
  if (images.size <= 1) {
     const fullString = JSON.stringify(task);
     const regexFound = regexExtractImages(fullString);
     regexFound.forEach(url => images.add(url));
  }

  return Array.from(images);
};


export async function GET(request: NextRequest) {
  try {
    // 1. 验证用户
    const user = await getUserInfo();
    if (!user) {
      return NextResponse.json({ code: 401, message: 'Unauthorized' }, { status: 401 });
    }

    // 2. 查询数据库
    // 🔥 修正：传入对象参数 { userId, page, limit }
    const tasks = await getAITasks({ 
      userId: user.id, 
      page: 1, 
      limit: 50 
    }); 
    
    // 兼容返回格式 (直接数组 或 {list: []})
    const taskList = Array.isArray(tasks) ? tasks : (tasks as any).list || [];

    // 3. 格式化数据并提取所有图片
    const formattedData = taskList.map((task: any) => {
      // 🔥 核心：在这里执行深度提取 🔥
      const allImages = extractImagesFromData(task);
      
      // 确保至少有一张图
      const mainUrl = allImages.length > 0 ? allImages[0] : "";

      // 解析 options 以获取尺寸信息
      let size = "1:1";
      try {
        const opts = safeParse(task.options);
        if (opts && opts.size) size = opts.size;
        else if (opts && opts.aspect_ratio) size = opts.aspect_ratio;
      } catch (e) {}

      return {
        id: task.id,
        url: mainUrl,       // 主图
        images: allImages,  // 🔥 新增：包含所有 6 张图的数组
        prompt: task.prompt,
        model: task.model,
        createdAt: new Date(task.createdAt || task.create_time).toLocaleDateString(), 
        type: task.scene === 'image-to-image' ? 'Image to Image' : 'Text to Image',
        size: size,
        // 保留 rawData 以便前端备用 (可选)
        rawData: safeParse(task.rawData) || safeParse(task.task_result)
      };
    });

    return NextResponse.json({
      code: 0,
      data: formattedData
    });

  } catch (error: any) {
    console.error('History API Error:', error);
    return NextResponse.json({ code: 500, message: error.message }, { status: 500 });
  }
}
