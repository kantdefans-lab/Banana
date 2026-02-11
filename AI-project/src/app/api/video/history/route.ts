import { NextRequest, NextResponse } from 'next/server';
import { getUserInfo } from '@/shared/models/user';
import { getAITasks } from '@/shared/models/ai_task'; // 🔥 统一使用这个经过验证的方法

// 强制动态模式
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

// --- 🔥 核心工具函数：深度提取视频链接 ---
const extractVideoFromData = (task: any): string | null => {
  let foundUrl: string | null = null;
  const visited = new Set<any>();

  // 准备所有可能包含数据的字段
  const sources = [
    task,
    safeParse(task.taskResult),
    safeParse(task.task_result),
    safeParse(task.taskInfo),
    safeParse(task.task_info),
    safeParse(task.rawData),
    safeParse(task.options)
  ];

  const traverse = (current: any) => {
    if (foundUrl) return; // 找到后立即停止
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
      // 1. 优先找明确的视频字段
      const candidate = current.video_url || current.videoUrl || current.url || current.result_url || current.output_video_url;
      if (typeof candidate === 'string' && candidate.match(/\.(mp4|mov|webm|mkv)/i)) {
        foundUrl = candidate;
        return;
      }

      // 2. 找 resultUrls 数组
      if (Array.isArray(current.resultUrls)) {
         const vid = current.resultUrls.find((u: any) => typeof u === 'string' && u.match(/\.(mp4|mov|webm)/i));
         if (vid) { foundUrl = vid; return; }
      }

      Object.keys(current).forEach(key => {
        if (key !== 'prompt' && key !== 'input') traverse(current[key]);
      });
      return;
    }

    // 3. 字符串暴力匹配
    if (typeof current === 'string') {
        if (current.match(/^https?:\/\/.*\.(mp4|mov|webm)/i)) {
            foundUrl = current;
        } else if (current.startsWith('{') || current.startsWith('[')) {
            try { traverse(JSON.parse(current)); } catch(e) {}
        }
    }
  };

  sources.forEach(source => traverse(source));
  return foundUrl;
};

export async function GET(request: NextRequest) {
  try {
    // 1. 验证用户
    const user = await getUserInfo();
    if (!user) {
      return NextResponse.json({ code: 401, message: 'Unauthorized' }, { status: 401 });
    }

    // 2. 查询数据库 (使用与图片页面相同的通用方法)
    // 注意：这里获取的是混合数据，包含图片和视频
    const tasks = await getAITasks({ 
      userId: user.id, 
      page: 1, 
      limit: 100 //稍微取多一点，以免过滤后所剩无几
    }); 
    
    const taskList = Array.isArray(tasks) ? tasks : (tasks as any).list || [];

    // 3. 定义视频白名单模型
    const videoModelKeywords = [
      'veo', 'sora', 'kling', 'hailuo', 'seedance', 
      'runway', 'pika', 'wan', 'minimax', 'video'
    ];

    // 4. 格式化数据并 **只保留视频**
    const formattedData = taskList
      .filter((task: any) => {
        // 🔥🔥🔥 过滤逻辑：只保留视频任务 🔥🔥🔥
        const mType = (task.mediaType || task.media_type || '').toLowerCase();
        const scene = (task.scene || '').toLowerCase();
        const model = (task.model || '').toLowerCase();
        const typeStr = (task.type || '').toLowerCase(); // 有时候存在 options 或者 prompt 里

        // 只要满足任意一个条件，就认为是视频
        if (mType === 'video') return true;
        if (scene.includes('video') || scene === 'i2v') return true;
        if (typeStr.includes('video')) return true;
        if (videoModelKeywords.some(k => model.includes(k))) return true;

        // 最后检查：如果任务结果里包含 .mp4 链接，那肯定是视频
        const deepCheck = extractVideoFromData(task);
        if (deepCheck) return true;

        return false;
      })
      .map((task: any) => {
        // 提取视频 URL
        const videoUrl = extractVideoFromData(task);
        
        // 解析时长
        let duration = '5s';
        try {
          const opts = safeParse(task.options);
          if (opts && opts.duration) duration = `${opts.duration}s`;
        } catch (e) {}

        // 判断类型 (文生视 vs 图生视)
        let typeLabel = 'Text to Video';
        if (task.scene === 'i2v' || task.scene?.includes('image')) typeLabel = 'Image to Video';
        else if (task.prompt && task.prompt.startsWith('http')) typeLabel = 'Image to Video';

        return {
          id: task.id,
          url: videoUrl,
          prompt: task.prompt,
          model: task.model,
          createdAt: new Date(task.createdAt || task.create_time).toLocaleDateString(),
          type: typeLabel,
          duration: duration,
          mediaType: 'video'
        };
      })
      // 再次过滤：确保提取到了有效的视频链接
      .filter((item: any) => item.url !== null && item.url !== "");

    return NextResponse.json({
      code: 0,
      data: formattedData
    });

  } catch (error: any) {
    console.error('Video History API Error:', error);
    // 返回空数组而不是报错，防止前端白屏
    return NextResponse.json({ code: 0, data: [], message: 'Error handled' });
  }
}