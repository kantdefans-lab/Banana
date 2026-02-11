import { NextRequest, NextResponse } from 'next/server';
import { getUuid } from '@/shared/lib/hash';
import { createAITask, updateAITaskById, NewAITask } from '@/shared/models/ai_task';
import { getRemainingCredits } from '@/shared/models/credit';
import { getUserInfo } from '@/shared/models/user';
import { PROVIDER_CONFIGS } from '@/shared/lib/ai-providers';
import { getAllConfigs } from '@/shared/models/config';
import { buildParams, submitTask } from '@/shared/lib/wavespeed';
import { getRuntimeEnv } from '@/shared/lib/env';

export const maxDuration = 60; 

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: "API 存活 (GET)" });
}

export async function POST(request: NextRequest) {
  console.log("🔥 [Video Generate] 1. Start Request");

  // 1. 解析 Body
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ code: 1, message: "Invalid JSON" }, { status: 400 });
  }

  // 2. 身份验证
  const user = await getUserInfo();
  if (!user) {
    return NextResponse.json({ code: 1, message: 'no auth' }, { status: 401 });
  }
  let createdTask: any = null;

  try {
    const configs = await getAllConfigs();
    const {
      prompt,
      model,
      provider: providerFromBody,
      media_type = 'video',
      imageUrls: imageUrlsFromBody = [],
      options: optionsFromBody = {},
      seed,
      aspectRatio = '16:9',
      duration,
      resolution,
      sound, // boolean
      mode, // Grok mode
      soraSize, // Sora parameter
      removeWatermark, // Sora parameter
      cameraFixed, // Seedance parameter
    } = body;
    const defaultProvider = (configs.ai_default_provider || process.env.AI_DEFAULT_PROVIDER || 'wavespeed').toString();
    const provider = (providerFromBody || defaultProvider).toString();

    const options = optionsFromBody || {};
    let imageUrls: string[] = Array.isArray(imageUrlsFromBody)
      ? imageUrlsFromBody
      : [];

    // Compatibility: accept legacy `options.image_input` as image inputs
    const legacyInput = (options as any)?.image_input;
    if (imageUrls.length === 0 && Array.isArray(legacyInput)) {
      imageUrls = legacyInput.filter(
        (u: any) => typeof u === 'string' && u.startsWith('http')
      );
    }

    // 必填项检查 (图生视频除外)
    if (!prompt && !model.includes('image-to-video') && imageUrls.length === 0) {
        return NextResponse.json({ code: 1, message: 'Prompt or Image required' }, { status: 400 });
    }

    // 3. 检查积分 (🔥 核心修改：使用配置表管理价格)
    console.log("💰 [Video Generate] 3. Checking Credits...");

    // 定义每个模型具体的扣分配置 (Text / Image)
    // 格式: '模型ID': { text: 文生视频价格, image: 图生视频价格 }
    const MODEL_CREDITS_MAP: Record<string, { text: number; image: number }> = {
        // --- Google Veo ---
        'veo3':            { text: 15, image: 15 }, // Quality
        'veo-3-1-quality': { text: 15, image: 15 },
        'veo3_fast':       { text: 10, image: 10 }, // Fast
        'veo-3-1-fast':    { text: 10, image: 10 },

        // --- OpenAI Sora ---
        'sora-2-pro':                 { text: 20, image: 20 },
        'sora-2-pro-text-to-video':   { text: 20, image: 20 },
        'sora-2-pro-image-to-video':  { text: 20, image: 20 },

        // --- ByteDance Seedance ---
        'bytedance/v1-pro-text-to-video':  { text: 15, image: 15 },
        'bytedance/v1-pro-image-to-video': { text: 15, image: 15 },
        'seedance-v1':                     { text: 15, image: 15 },

        // --- Kling (可灵) ---
        'kling-2.6':                  { text: 12, image: 12 },
        'kling-2.6/text-to-video':    { text: 12, image: 12 },
        'kling-2.6/image-to-video':   { text: 12, image: 12 },

        // --- Wan (万相) ---
        'wan-2.6':                { text: 12, image: 12 },
        'wan/2-6-text-to-video':  { text: 12, image: 12 },
        'wan/2-6-image-to-video': { text: 12, image: 12 },

        // --- Hailuo (海螺) ---
        'hailuo-2.3':                  { text: 15, image: 15 },
        'hailuo/2-3-image-to-video-pro': { text: 15, image: 15 }, // Hailuo 主要是 I2V

        // --- Grok ---
        'grok-imagine': { text: 12, image: 12 },
    };

    // 默认兜底价格 (视频通常较贵)
    const DEFAULT_COST = { text: 15, image: 15 };

    // 获取配置
    const pricing = MODEL_CREDITS_MAP[model] || DEFAULT_COST;

    // 自动判断场景 (有图则是 image 模式)
    const isImageMode = imageUrls && imageUrls.length > 0;
    const currentScene = isImageMode ? 'image-to-video' : 'text-to-video';
    
    // 计算最终扣费
    const costCredits = isImageMode ? pricing.image : pricing.text;

    // 4. 检查余额
    const remainingCredits = await getRemainingCredits(user.id);
    console.log(`💰 [Video Generate] Model: ${model}, Mode: ${currentScene}, Cost: ${costCredits}, Balance: ${remainingCredits}`);

    if (remainingCredits < costCredits) {
      return NextResponse.json({ code: 1, message: '积分不足' }, { status: 403 });
    }

    // 5. 写入数据库 (Pending 状态)
    const taskId = getUuid();
    const newAITask: NewAITask = {
      id: taskId,
      userId: user.id,
      mediaType: media_type,
      provider,
      model,
      prompt,
      scene: currentScene,
      // 将所有相关参数存入 options
      options: JSON.stringify({ seed, aspectRatio, imageUrls, duration, resolution, sound, mode, soraSize, removeWatermark, cameraFixed }),
      status: 'pending',
      costCredits,
      taskId: '',
      taskInfo: null,
      taskResult: null,
    };

    createdTask = await createAITask(newAITask);

    if (provider === 'wavespeed') {
      const apiKey =
        (configs.wavespeed_api_key || getRuntimeEnv('WAVESPEED_API_KEY') || '').toString();
      if (!apiKey) {
        throw new Error('WaveSpeed API key missing (wavespeed_api_key / WAVESPEED_API_KEY)');
      }

      const built = await buildParams({
        apiKey,
        requestedModelId: model,
        prompt,
        mediaType: 'video',
        scene: currentScene,
        options: {
          aspectRatio,
          duration,
          resolution,
          sound,
          mode,
          soraSize,
          removeWatermark,
          cameraFixed,
          seed,
          size: aspectRatio,
        },
        imageUrls,
      });

      const sub = await submitTask({
        apiKey,
        requestedModelId: built.modelId,
        params: built.params,
      });

      await updateAITaskById(createdTask.id, {
        taskId: sub.taskId,
        taskInfo: JSON.stringify(sub.raw || {}),
      });

      return NextResponse.json({
        code: 0,
        message: 'success',
        data: {
          id: taskId,
          taskId: sub.taskId,
          status: 'pending',
          costCredits,
        },
      });
    }

    // 6. 调用 Kie Video API (分支逻辑)
    const config = PROVIDER_CONFIGS.kie;
    let apiEndpoint = '';
    let payload: any = {};

    // 🛠️ 路由分发
    
    // === 分支: Seedance V1 (ByteDance) ===
    if (model.startsWith('bytedance/') || model.includes('seedance')) {
        apiEndpoint = '/jobs/createTask';
        
        const inputPayload: any = {
            prompt: prompt || " ",
            resolution: resolution || "720p",
            duration: duration ? String(duration).replace('s', '') + 's' : "5s", 
            camera_fixed: !!cameraFixed,
            seed: seed ? parseInt(seed) : -1
        };

        if (model.includes('image-to-video') || isImageMode) {
            if (!imageUrls || imageUrls.length === 0) throw new Error("Image is required for Seedance Image-to-Video");
            inputPayload.image_url = imageUrls[0]; 
        } else {
            inputPayload.aspect_ratio = aspectRatio || "16:9";
        }

        payload = { model: model, callBackUrl: "", input: inputPayload };
    }
    // === 分支: Sora 2 Pro ===
    else if (model.startsWith('sora-')) {
        apiEndpoint = '/jobs/createTask';
        
        let finalAspectRatio = (aspectRatio || 'landscape').toLowerCase();
        if (finalAspectRatio === '16:9') finalAspectRatio = 'landscape';
        if (finalAspectRatio === '9:16') finalAspectRatio = 'portrait';

        const inputPayload: any = {
            prompt: prompt || " ",
            aspect_ratio: finalAspectRatio,
            n_frames: duration ? String(duration).replace('s', '') : "10", 
            size: (soraSize || "Standard").toLowerCase(), 
            remove_watermark: !!removeWatermark
        };

        if (model.includes('image-to-video') || isImageMode) {
            if (!imageUrls || imageUrls.length === 0) throw new Error("Image is required for Sora Image-to-Video");
            inputPayload.image_urls = imageUrls; 
        }

        payload = { model: model, callBackUrl: "", input: inputPayload };
    }
    // === 分支: Hailuo 2.3 ===
    else if (model.startsWith('hailuo/')) {
        apiEndpoint = '/jobs/createTask';
        
        if (!imageUrls || imageUrls.length === 0) throw new Error("Image is required for Hailuo Image-to-Video");
        if (duration === '10' && resolution === '1080p') throw new Error("Hailuo 2.3: 10s videos are not supported for 1080p resolution.");

        const inputPayload: any = {
            prompt: prompt || " ",
            image_url: imageUrls[0], 
            duration: duration || "6",
            resolution: resolution || "768p"
        };
        payload = { model: model, callBackUrl: "", input: inputPayload };
    }
    // === 分支: Grok Imagine === 
    else if (model.startsWith('grok-imagine')) {
        apiEndpoint = '/jobs/createTask';
        let finalMode = mode || 'normal';
        if (model.includes('image-to-video') && finalMode === 'spicy') finalMode = 'normal';

        const inputPayload: any = { prompt: prompt || " ", mode: finalMode };
        if (model.includes('image-to-video') || isImageMode) {
            if (!imageUrls || imageUrls.length === 0) throw new Error("Image is required");
            inputPayload.image_urls = [imageUrls[0]]; 
        } else {
            inputPayload.aspect_ratio = aspectRatio || "16:9";
        }
        payload = { model, callBackUrl: "", input: inputPayload };
    }
    // === 分支: Kling 2.6 ===
    else if (model.startsWith('kling')) {
        apiEndpoint = '/jobs/createTask';
        const inputPayload: any = { prompt: prompt || " ", duration: duration || "5", sound: !!sound };
        if (model.includes('image-to-video') || isImageMode) {
            if (!imageUrls || imageUrls.length === 0) throw new Error("Image is required");
            inputPayload.image_urls = imageUrls; 
        } else {
            inputPayload.aspect_ratio = aspectRatio || "16:9";
        }
        payload = { model, callBackUrl: "", input: inputPayload };
    }
    // === 分支: Wan 2.6 ===
    else if (model.startsWith('wan/')) {
        apiEndpoint = '/jobs/createTask';
        const inputPayload: any = { prompt: prompt || " ", duration: duration || "5", resolution: resolution || "1080p", multi_shots: false };
        if (model.includes('image-to-video') || isImageMode) {
            inputPayload.image_url = imageUrls[0]; 
        }
        payload = { model, callBackUrl: "", input: inputPayload };
    } 
    // === 分支: Veo (Default) ===
    else {
        apiEndpoint = '/veo/generate';
        const generationType = (imageUrls && imageUrls.length > 0) ? "REFERENCE_2_VIDEO" : "TEXT_2_VIDEO";
        payload = { prompt, model, aspectRatio, enableFallback: false, enableTranslation: true, generationType };
        if (generationType === "REFERENCE_2_VIDEO") payload.imageUrls = imageUrls;
        if (seed) {
            const numSeed = parseInt(seed);
            if (!isNaN(numSeed)) payload.seeds = numSeed;
        }
    }

    // 构造完整 URL
    let baseUrl = config.baseURL;
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
    
    // 如果是 jobs 接口通常需要 api/v1 前缀，如果是 veo 可能不需要，视具体 provider 而定
    // 假设所有 endpoint 都需要拼接在 baseUrl 后
    const url = `${baseUrl}${apiEndpoint.startsWith('/') ? apiEndpoint : '/' + apiEndpoint}`;

    console.log(`🚀 [Video Generate] Calling: ${url}`);
    console.log("📦 Payload:", JSON.stringify(payload, null, 2));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 120秒超时

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${config.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    const apiRes = await response.json();
    console.log("🔥 [Video Generate] Provider Response:", JSON.stringify(apiRes));

    if (!response.ok || (apiRes.code !== undefined && apiRes.code !== 0 && apiRes.code !== 200)) {
        const errorMsg = apiRes.msg || apiRes.message || apiRes.error || "Video generation failed (Upstream)";
        throw new Error(`API Error: ${errorMsg}`);
    }

    // 7. 更新数据库
    const externalTaskId = apiRes.data?.taskId || apiRes.data?.id || apiRes.taskId || apiRes.result;

    if (!externalTaskId) {
        throw new Error("No Task ID returned from provider");
    }

    await updateAITaskById(createdTask.id, {
      taskId: externalTaskId,
      taskInfo: JSON.stringify(apiRes)
    });

    return NextResponse.json({
      code: 0,
      message: 'success',
      data: {
        id: taskId, 
        taskId: externalTaskId, 
        status: 'pending',
        costCredits
      }
    });

  } catch (error: any) {
    console.error('❌ [Video Generate] Error:', error);
    if (createdTask?.id) {
      try {
        await updateAITaskById(createdTask.id, {
          status: 'failed',
          ...(createdTask.creditId ? { creditId: createdTask.creditId } : {}),
          taskInfo: JSON.stringify({
            error: error?.message || String(error),
            at: new Date().toISOString(),
          }),
        });
      } catch (e) {
        console.error('❌ [Video Generate] 更新失败任务状态失败:', e);
      }
    }
    return NextResponse.json({ code: 1, message: error.message }, { status: 500 });
  }
}
