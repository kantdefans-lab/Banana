// src/shared/lib/ai-providers.ts

// ==============================================================================
// 1. 服务商配置 (Provider Configuration)
// ==============================================================================

// 建议：生产环境请务必在 .env 文件中配置 KIE_API_TOKEN
// 修改：优先从环境变量读取 DEFAULT_KIE_TOKEN
const DEFAULT_KIE_TOKEN = process.env.DEFAULT_KIE_TOKEN || '2fb519b05acb67ed109d92c1a01bdce6';

// 导出 Key：优先读取特定名称的环境变量，最后使用默认值
export const KIE_API_KEY = process.env.KIE_API_TOKEN || process.env.KIE_AI_API_TOKEN || DEFAULT_KIE_TOKEN;

export const PROVIDER_CONFIGS = {
  kie: {
    baseURL: 'https://api.kie.ai/api/v1',
    token: KIE_API_KEY,
    endpoints: {
      // --- GPT-4o 绘图 ---
      'gpt4o-image': '/gpt4o-image/generate',       
      'gpt4o_record': '/gpt4o-image/record-info',   
      
      // --- Flux Kontext ---
      'flux-kontext-pro': '/flux/kontext/generate',
      'flux-kontext-max': '/flux/kontext/generate',
      'flux_record': '/flux/kontext/record-info',

      // --- 通用 Jobs API (聚合模型) ---
      // 包含: Nano Banana, Z-Image, Seedream, Flux 2, Grok, Qwen, Wan, Kling, Hailuo, Sora, Seedance
      'jobs': '/jobs/createTask',
      'jobs_record': '/jobs/recordInfo',
      
      // --- Midjourney (独立接口) ---
      'mj-generate': '/mj/generate',
      'mj_record': '/mj/record-info',
      
      // --- 其他单点接口 ---
      'flux-dev': '/flux/generate',
    }
  },
  // 其他服务商占位
  openai: { baseURL: 'https://api.openai.com/v1', token: process.env.OPENAI_API_KEY || '', endpoints: {} },
  stability: { baseURL: '', token: '', endpoints: {} },
  replicate: { baseURL: '', token: '', endpoints: {} },
  gemini: { baseURL: '', token: '', endpoints: {} },
};

// ==============================================================================
// 2. 模型分类判断 (Model Classifiers)
// ==============================================================================

/**
 * 判断是否属于通用 Jobs API 模型
 * 核心逻辑：凡是在此处返回 true 的模型，查询状态时都会走 /jobs/recordInfo
 */
export function isJobsApiModel(model: string = ''): boolean {
  if (!model) return false;
  
  // 转换为小写以进行更宽松的匹配
  const m = model.toLowerCase();

  return (
    m === 'google/nano-banana' ||
    m === 'nano-banana-pro' ||
    m === 'z-image' || 
    m === 'z-image-turbo' ||
    m.startsWith('z-image') ||
    m.includes('seedream') ||
    // Flux 2 系列
    m.startsWith('flux-2') ||
    // Grok Imagine
    m.startsWith('grok-imagine') ||
    // Qwen Image
    m.startsWith('qwen/') || 
    // Ideogram v3
    m === 'ideogram/v3-text-to-image' ||
    // Wan 2.6 Video
    m.startsWith('wan/') ||
    // Kling AI
    m.startsWith('kling') ||
    // Hailuo Video
    m.startsWith('hailuo/') ||
    // Sora 2 Pro
    m.startsWith('sora-') ||
    // ✅ 新增: Seedance (ByteDance) Video
    m.startsWith('bytedance/')
  );
}

// 定义 Midjourney 模型
export function isMidjourneyModel(model: string = ''): boolean {
  if (!model) return false;
  return model === 'mj/imagine' || model.startsWith('mj/');
}

// 定义哪些模型属于 Flux Kontext API
export function isFluxKontextModel(model: string = ''): boolean {
  if (!model) return false;
  return (
    model.includes('flux-kontext') || 
    model === 'flux-kontext-pro' || 
    model === 'flux-kontext-max'
  );
}

// 定义哪些模型属于 GPT-4o Image API
export function isGPT4oImageModel(model: string = ''): boolean {
  if (!model) return false;
  return model.includes('gpt4o-image');
}

// 判断是否是 API 自身的 Endpoint URL (非图片)
export function isApiEndpointUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const lower = url.toLowerCase();
  return (
    lower.includes('api.kie.ai') ||
    lower.includes('api.wavespeed.ai') ||
    (lower.includes('/api/') && lower.includes('/predictions/'))
  );
}

// ==============================================================================
// 3. URL 格式校验 (URL Utilities)
// ==============================================================================

/**
 * 判断字符串是否为有效的媒体资源 URL (图片或视频)
 */
export function isImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  
  // 排除 API 接口地址
  if (isApiEndpointUrl(url)) return false;

  // 🌟 信任域白名单
  if (url.includes('aiquickdraw.com') || url.includes('tempfile') || url.includes('kie.ai')) {
    return true;
  }

  const lowerUrl = url.toLowerCase();
  
  // 1. 图片扩展名
  const isImg = /\.(jpg|jpeg|png|gif|webp|bmp|svg)/.test(lowerUrl);
  // 2. 视频扩展名 (适配 Wan/Kling/Sora/Seedance 生成的视频)
  const isVideo = /\.(mp4|mov|webm|avi)/.test(lowerUrl);

  return isImg || isVideo;
}

// ==============================================================================
// 4. [核弹级] 资源提取逻辑 (Extraction Logic)
// ==============================================================================

/**
 * 从复杂的 API 响应中暴力提取图片/视频 URL
 * 兼容各种嵌套结构，自动处理转义字符
 */
export async function extractImageUrlsFromTask(task: any, apiData: any = null): Promise<string[]> {
  const foundUrls: Set<string> = new Set();
  
  // 辅助：添加 URL 到集合
  const addUrl = (u: string) => {
    if (u && typeof u === 'string' && u.startsWith('http')) {
      // 去除可能存在的反斜杠转义
      const clean = u.replace(/\\/g, ''); 
      // 再次校验是否为 API 端点，防止误判
      if (!isApiEndpointUrl(clean)) {
         foundUrls.add(clean);
      }
    }
  };

  try {
    // 策略 A: 转换为超大字符串进行正则匹配 (最快，覆盖率高)
    // ---------------------------------------------------
    const hugeString = JSON.stringify({ t: task, a: apiData });
    
    // 正则：匹配所有 aiquickdraw.com (Kie 常用存储) 的链接
    const regex = /https?:\/\/[^"'\s\\]*aiquickdraw\.com[^"'\s\\]*/g;
    
    const matches = hugeString.match(regex);
    if (matches && matches.length > 0) {
      matches.forEach(url => addUrl(url));
    }
  } catch (e) {
    console.error("❌ [Extract-Error] Regex strategy failed", e);
  }

  // 策略 B: 深度递归解析 (兜底方案)
  // ---------------------------------------------------
  if (foundUrls.size === 0) {
    const deepSearch = (obj: any, depth = 0) => {
      // 限制深度防止栈溢出
      if (!obj || typeof obj !== 'object' || depth > 10) return;
      
      // 遍历数组
      if (Array.isArray(obj)) {
        obj.forEach(item => deepSearch(item, depth + 1));
        return;
      }

      // 遍历对象属性
      for (const val of Object.values(obj)) {
        if (typeof val === 'string') {
          // 检查特定域名
          if (val.includes('aiquickdraw.com') && val.startsWith('http')) {
            addUrl(val);
          }
          // 检查是否是 JSON 字符串 (有些 API 会把结果 stringify 后返回)
          else if ((val.startsWith('{') || val.startsWith('[')) && val.includes('http')) {
            try { 
              const parsed = JSON.parse(val);
              deepSearch(parsed, depth + 1); 
            } catch (e) {
              // 忽略解析错误
            }
          }
        } else if (typeof val === 'object') {
          deepSearch(val, depth + 1);
        }
      }
    };
    
    // 开始递归
    deepSearch({ ...task, ...apiData });
  }

  const finalUrls = Array.from(foundUrls);
  // 过滤掉非媒体链接
  return finalUrls.filter(url => isImageUrl(url));
}
