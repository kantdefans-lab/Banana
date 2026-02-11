import { NextRequest, NextResponse } from 'next/server';
import { getUuid } from '@/shared/lib/hash';
import { createAITask, updateAITaskById, NewAITask } from '@/shared/models/ai_task';
import { getRemainingCredits } from '@/shared/models/credit';
import { getUserInfo } from '@/shared/models/user';
import { getAllConfigs } from '@/shared/models/config';
import { 
  PROVIDER_CONFIGS, 
  isJobsApiModel, 
  isFluxKontextModel 
} from '@/shared/lib/ai-providers';
import { buildParams, submitTask, moderateTextContent } from '@/shared/lib/wavespeed';
import { getRuntimeEnv } from '@/shared/lib/env';

export const maxDuration = 60; 

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: "API 存活 (GET)" });
}

export async function POST(request: NextRequest) {
  console.log("🔥 [Generate] 1. 收到 POST 请求");

  // 1. 解析 Body
  let body;
  try {
    body = await request.json();
    console.log("📦 [Generate] 2. Body 解析成功:", { provider: body.provider, model: body.model });
  } catch (e) {
    console.error("❌ [Generate] Body 解析失败:", e);
    return NextResponse.json({ code: 1, message: "Invalid JSON" }, { status: 400 });
  }

  // 2. 身份验证
  console.log("👤 [Generate] 3. 开始获取用户信息...");
  const user = await getUserInfo();
  
  if (!user) {
    console.log("❌ [Generate] 用户未登录");
    return NextResponse.json({ code: 1, message: 'no auth' }, { status: 401 });
  }
  console.log(`✅ [Generate] 4. 用户验证通过: ${user.id}`);
  let createdTask: any = null;

  try {
    const configs = await getAllConfigs();
    const wavespeedApiKey = String(
      configs.wavespeed_api_key || getRuntimeEnv('WAVESPEED_API_KEY') || ''
    );
    const {
      prompt,
      provider: providerFromBody,
      model = 'gpt4o-image',
      media_type = 'image',
      scene = 'text-to-image',
      options: optionsFromBody = {},
      filesUrl: filesUrlFromBody,
      imageUrl: imageUrlFromBody,
    } = body;
    const defaultProvider = (configs.ai_default_provider || process.env.AI_DEFAULT_PROVIDER || 'wavespeed').toString();
    const provider = (providerFromBody || defaultProvider).toString();

    const options = optionsFromBody || {};
    let filesUrl: string[] | undefined = filesUrlFromBody;
    let imageUrl: string | undefined = imageUrlFromBody;

    // Compatibility: accept legacy `options.image_input` as image inputs for WaveSpeed I2I
    if (provider === 'wavespeed' && scene === 'image-to-image') {
      const legacyInput = (options as any)?.image_input;
      if ((!filesUrl || filesUrl.length === 0) && Array.isArray(legacyInput)) {
        const normalized = legacyInput
          .filter((u: any) => typeof u === 'string' && u.startsWith('http'));
        if (normalized.length > 0) {
          filesUrl = normalized;
          if (!imageUrl) imageUrl = normalized[0];
        }
      }
    }

    if (!prompt) return NextResponse.json({ code: 1, message: 'Prompt required' }, { status: 400 });

    // 3. 检查积分
    console.log("💰 [Generate] 5. 检查积分...");

    // 🔥 MODEL_CREDITS_MAP: 定义每个模型具体的扣分配置 (Text / Image)
    const MODEL_CREDITS_MAP: Record<string, { text: number; image: number }> = {
      // --- 基础模型 (Basic) ---
      'google/nano-banana': { text: 5, image: 10 },
      'nano-banana':        { text: 1, image: 2 },
      'z-image':            { text: 1, image: 2 },
      'z-image-turbo':      { text: 1, image: 2 },
      
      // --- 高级模型 (Advanced) ---
      'nano-banana-pro':            { text: 3, image: 6 },
      'qwen/text-to-image':         { text: 3, image: 6 },
      'qwen-image':                 { text: 3, image: 6 },
      'flux-2/pro-text-to-image':   { text: 3, image: 6 },
      'flux-2-pro':                 { text: 3, image: 6 },
      'seedream/4.5-text-to-image': { text: 3, image: 6 },
      'seedream':                   { text: 3, image: 6 },
      
      // --- 特殊模型 (Special) ---
      'grok-imagine/text-to-image': { text: 3, image: 3 }, 
      'grok-imagine':               { text: 3, image: 3 },
      'gpt4o-image':                { text: 8, image: 12 },
    };

    // 默认价格 (如果模型不在列表里，使用此价格)
    const DEFAULT_COST = { text: 2, image: 4 };

    // 获取配置
    const pricing = MODEL_CREDITS_MAP[model] || DEFAULT_COST;

    // 计算基础扣费
    let costCredits = 0;
    if (scene === 'image-to-image') {
        costCredits = pricing.image;
    } else {
        costCredits = pricing.text;
    }

    // 🔥 已移除：视频模型的 15 分兜底逻辑
    // 现在完全依赖 MODEL_CREDITS_MAP 或 DEFAULT_COST

    const remainingCredits = await getRemainingCredits(user.id);
    console.log(`💰 [Generate] Model: ${model}, Mode: ${scene}, Cost: ${costCredits}, Balance: ${remainingCredits}`);
    
    if (remainingCredits < costCredits) {
      return NextResponse.json({ code: 1, message: '积分不足' }, { status: 403 });
    }

    if (provider === 'wavespeed') {
      const safetyController = new AbortController();
      const safetyTimeout = setTimeout(() => safetyController.abort(), 15000);
      try {
        const safetyResult = await moderateTextContent({
          apiKey: wavespeedApiKey,
          text: prompt,
          signal: safetyController.signal,
        });
        if (safetyResult.flaggedLabels.length > 0) {
          console.log('WaveSpeed prompt blocked by safety', {
            labels: safetyResult.flaggedLabels,
          });
          return NextResponse.json(
            {
              code: 1,
              message: `Prompt blocked by safety (${safetyResult.flaggedLabels.join(', ')})`,
            },
            { status: 403 }
          );
        }
      } catch (error) {
        console.error('WaveSpeed safety check failed', error);
      } finally {
        clearTimeout(safetyTimeout);
      }
    }

    // 4. 数据库写入
    console.log("💾 [Generate] 6. 写入数据库...");
    const taskId = getUuid();
    const newAITask: NewAITask = {
      id: taskId,
      userId: user.id,
      mediaType: media_type,
      provider,
      model,
      prompt,
      scene,
      options: JSON.stringify(options),
      status: 'pending',
      costCredits,
      taskId: '',
      taskInfo: null,
      taskResult: null,
    };

    createdTask = await createAITask(newAITask);
    console.log(`✅ [Generate] 7. DB 写入成功, LocalID: ${taskId}`);

    // 5. 调用外部 API
    console.log(`🚀 [Generate] 8. 调用 AI Provider: ${provider}, Model: ${model}...`);
    
    const controller = new AbortController();
    // 视频生成可能比较慢，延长超时时间
    const timeoutSeconds = model.includes('video') ? 120 : 45;
    const timeoutId = setTimeout(() => controller.abort(), timeoutSeconds * 1000); 

    let result: any;
    let externalTaskId: string;
    let apiStatus = 'processing';

    try {
      if (provider === 'wavespeed') {
        const apiKey = wavespeedApiKey;
        if (!apiKey) {
          throw new Error('WaveSpeed API key missing (wavespeed_api_key / WAVESPEED_API_KEY)');
        }

        const effectiveImageUrl = (filesUrl && filesUrl.length > 0) ? filesUrl[0] : imageUrl;
        const built = await buildParams({
          apiKey,
          requestedModelId: model,
          prompt,
          mediaType: 'image',
          scene,
          options,
          imageUrls:
            scene === 'image-to-image'
              ? (filesUrl && filesUrl.length > 0 ? filesUrl : effectiveImageUrl ? [effectiveImageUrl] : [])
              : [],
          signal: controller.signal,
        });

        const sub = await submitTask({
          apiKey,
          requestedModelId: built.modelId,
          params: built.params,
          signal: controller.signal,
        });
        result = { taskInfo: sub.raw };
        externalTaskId = sub.taskId;
      } else if (provider === 'kie') {
        // ✅ 分发逻辑：包含所有走 Jobs API 的模型
        if (
          isJobsApiModel(model) || 
          model.startsWith('flux-2') || 
          model.startsWith('grok-imagine') || 
          model.startsWith('qwen') || 
          model.startsWith('bytedance') || 
          model.includes('seedance')
        ) {
          
          const effectiveImageUrl = (filesUrl && filesUrl.length > 0) ? filesUrl[0] : imageUrl;
          
          const callOptions = { 
            ...options, 
            imageUrl: effectiveImageUrl, 
            filesUrl: filesUrl || (imageUrl ? [imageUrl] : []) 
          };

          result = await callKieJobsAPI(prompt, model, scene, callOptions, controller.signal);
          externalTaskId = result.taskId;
        } 
        // Flux Kontext
        else if (isFluxKontextModel(model) || model.startsWith('flux-kontext')) {
          // 🔥🔥🔥 核心修复：正确传递图片 URL 🔥🔥🔥
          const effectiveImageUrl = (filesUrl && filesUrl.length > 0) ? filesUrl[0] : imageUrl;
          result = await callFluxKontextAPI(
              prompt, 
              model, 
              scene, 
              options, 
              { imageUrl: effectiveImageUrl }, // 👈 传入 extraData
              controller.signal
          );
          externalTaskId = result.record_id || result.task_id;
        } else {
          // 默认 GPT-4o Image (兜底)
          result = await callKieAPI(prompt, model, scene, options, { filesUrl, imageUrl }, controller.signal);
          externalTaskId = result.taskId;
        }
      } else if (provider === 'gemini') {
         // ... Gemini 逻辑保持不变 ...
         if (model === 'google/nano-banana') {
            const effectiveImageUrl = (filesUrl && filesUrl.length > 0) ? filesUrl[0] : imageUrl;
            const callOptions = { 
                ...options, 
                imageUrl: effectiveImageUrl,
                filesUrl: filesUrl || (imageUrl ? [imageUrl] : [])
            };
            result = await callKieJobsAPI(prompt, model, scene, callOptions, controller.signal);
            externalTaskId = result.taskId;
         } else {
            result = { status: 'success' };
            externalTaskId = `gemini-${Date.now()}`;
            apiStatus = 'success';
         }
      } else {
        throw new Error(`Provider not supported: ${provider}`);
      }
    } finally {
      clearTimeout(timeoutId);
    }

    console.log(`✅ [Generate] 9. API 调用成功, ExternalID: ${externalTaskId}`);

    // 6. 更新数据库
    await updateAITaskById(createdTask.id, {
      taskId: externalTaskId,
      status: apiStatus,
      taskInfo: JSON.stringify(result.taskInfo || result.raw || {}),
      taskResult: result.taskResult ? JSON.stringify(result.taskResult) : null
    });

    return NextResponse.json({
      code: 0,
      message: 'success',
      data: {
        id: taskId,
        taskId: externalTaskId,
        status: apiStatus,
        costCredits
      }
    });

  } catch (error: any) {
    console.error('❌ [Generate] 处理失败:', error);
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
        console.error('❌ [Generate] 更新失败任务状态失败:', e);
      }
    }
    return NextResponse.json({ code: 1, message: error.message }, { status: 500 });
  }
}

// === API 调用工具函数 ===

function getQwenImageSize(ratio: string): string {
  const map: Record<string, string> = {
    '1:1': 'square_hd', 
    '16:9': 'landscape_16_9', 
    '4:3': 'landscape_4_3',
    '3:2': 'landscape_4_3',   
    '21:9': 'landscape_16_9', 
    '5:4': 'landscape_4_3',
    '9:16': 'portrait_16_9',  
    '3:4': 'portrait_4_3',
    '2:3': 'portrait_4_3',
    '4:5': 'portrait_4_3',
  };
  return map[ratio] || 'square_hd';
}

// KIE Jobs API 调用函数
async function callKieJobsAPI(prompt: string, model: string, scene: string, options: any, signal?: AbortSignal) {
  const config = PROVIDER_CONFIGS.kie;
  
  let url = `${config.baseURL}${config.endpoints['jobs']}`; 
  let inputPayload: any = { prompt: prompt.trim() };
  
  console.log(`🌐 POST Request Prep, Model: ${model}`);

  // 图片输入处理
  let finalImageInput: string | string[] = options.imageUrl;
  if (options.filesUrl && Array.isArray(options.filesUrl) && options.filesUrl.length > 0) {
      if (options.filesUrl.length > 1) {
          finalImageInput = options.filesUrl;
      } else {
          finalImageInput = options.filesUrl[0];
      }
  }

  // --- 🌟 关键参数分支处理 ---
  
  // ✅ 场景: ByteDance Seedance (Video)
  if (model.startsWith('bytedance/') || model.includes('seedance')) {
      console.log("⚙️ [Generate] Seedance Video 模式");
      inputPayload = {
          prompt: prompt.trim(),
          resolution: options?.resolution || '720p',
          ratio: options?.size || '16:9',
          camera_fixed: options?.cameraFixed ?? false
      };
      if (model.includes('image-to-video') || scene === 'image-to-image') {
          if (!finalImageInput) throw new Error("Image-to-Video requires an input image.");
          inputPayload.image = finalImageInput; 
      }
  }

  // ✅ 场景: Qwen Image
  else if (model.startsWith('qwen')) {
    console.log("⚙️ [Generate] Qwen Image 模式");
    inputPayload = {
      ...inputPayload,
      image_size: getQwenImageSize(options?.size || '1:1'), 
      num_inference_steps: 30,
      guidance_scale: 2.5,
      enable_safety_checker: true,
      output_format: "png",
      acceleration: "none"
    };
    if (scene === 'image-to-image') {
        inputPayload.image_url = finalImageInput; 
        inputPayload.strength = 0.75; 
    }
  }
  // 场景: Z-Image
  else if (model === 'z-image' || model === 'z-image-turbo') {
    inputPayload = { ...inputPayload, aspect_ratio: options?.size || '1:1' };
    if (scene === 'image-to-image') {
        inputPayload.image_url = finalImageInput;
        inputPayload.strength = 0.75;
    }
  } 
  // 场景: Nano Banana Pro
  else if (model === 'nano-banana-pro' || model.includes('nano-banana')) {
    inputPayload = { ...inputPayload, aspect_ratio: options?.size || '1:1', resolution: options?.resolution || '1K', output_format: 'png' };
    if (scene === 'image-to-image') {
        inputPayload.image_url = finalImageInput;
        inputPayload.strength = 0.55; 
    }
  }
  // 场景: Seedream
  else if (model.includes('seedream')) {
    inputPayload = { ...inputPayload, aspect_ratio: options?.size || '1:1', quality: options?.quality || 'basic' };
    if (scene === 'image-to-image') {
        inputPayload.image_url = finalImageInput;
    }
  }
  // 场景: Flux 2 Pro
  else if (model.startsWith('flux-2')) {
    inputPayload = { ...inputPayload, aspect_ratio: options?.size || '1:1', resolution: options?.resolution || '1K' };
    if (scene === 'image-to-image' || model.includes('image-to-image')) {
        if (options.filesUrl && options.filesUrl.length > 0) inputPayload.input_urls = options.filesUrl;
        else if (options.imageUrl) inputPayload.input_urls = [options.imageUrl];
    }
  }
  // 场景: Grok Imagine
  else if (model.startsWith('grok-imagine')) {
    if (model.includes('video')) {
       inputPayload = {
          prompt: prompt.trim(),
          mode: options?.mode || 'normal', 
       };
       if (model.includes('image-to-video')) {
          if (options.filesUrl && options.filesUrl.length > 0) inputPayload.image_urls = options.filesUrl;
          else if (options.imageUrl) inputPayload.image_urls = [options.imageUrl];
          inputPayload.index = 0; 
       } else {
          inputPayload.aspect_ratio = options?.size || '16:9';
       }
    } else {
       inputPayload = { ...inputPayload, aspect_ratio: options?.size || '1:1', mode: options?.mode || 'normal' };
    }
  }
  // 场景: 旧版模型 / 兜底
  else {
    inputPayload = { ...inputPayload, image_size: options?.size || '1:1', num_images: options?.numImages || 1, output_format: 'png' };
    if (scene === 'image-to-image') {
        inputPayload.image_url = finalImageInput;
        inputPayload.strength = 0.55;
    }
  }

  // 构造最终请求体
  let requestBody: any;
  requestBody = {
    model: model, 
    callBackUrl: "",
    input: inputPayload,
  };

  console.log(`🌐 POST ${url}`);
  console.log("📦 Request Body Sample:", JSON.stringify(requestBody).substring(0, 200) + "..."); 

  const response = await fetch(url, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${config.token}`, 
      'Content-Type': 'application/json' 
    },
    body: JSON.stringify(requestBody),
    signal,
  });

  const data = await response.json();
  
  if (!response.ok || (data.code !== 200 && data.code !== 0 && !data.result)) {
    console.error("Kie API Error Details:", data);
    const errorMsg = data.msg || data.message || JSON.stringify(data);
    throw new Error(`Kie API Error (${model}): ${errorMsg}`);
  }

  const taskId = data.result || data.data?.taskId || data.data?.id || data.taskId;
  
  if (!taskId) {
    throw new Error('No taskId received from Kie API');
  }

  return { taskId, status: 'pending', taskInfo: data };
}

// 🔥🔥🔥 Flux Kontext API 修复 🔥🔥🔥
// 1. 修改函数签名，增加 extraData
async function callFluxKontextAPI(prompt: string, model: string, scene: string, options: any, extraData: any, signal?: AbortSignal) {
  const config = PROVIDER_CONFIGS.kie;
  // @ts-ignore
  const endpoint = config.endpoints[model] || config.endpoints['flux-kontext-pro'];
  const url = `${config.baseURL}${endpoint}`;
  
  console.log(`🌐 POST ${url}, Model: ${model}`);

  const payload: any = {
    model: model, 
    prompt: prompt.trim(),
    aspectRatio: options?.size || "1:1", 
    enableTranslation: true,
    outputFormat: "jpeg",
    promptUpsampling: false,
    safetyTolerance: 2
  };

  // 2. 修改此处，从 extraData 中获取 imageUrl
  if (scene === 'image-to-image' && extraData?.imageUrl) {
      console.log("🖼️ Flux Kontext: Adding image to payload:", extraData.imageUrl);
      payload.image = extraData.imageUrl; 
  }

  console.log("📦 Flux Kontext Payload:", JSON.stringify(payload));

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${config.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  });
  
  const data = await response.json();
  if (!response.ok || (data.code !== 200 && data.code !== 0)) {
      console.error("Flux API Error Details:", data);
      throw new Error(`Flux API Error: ${data.msg || data.message}`);
  }
  
  return { 
      record_id: data.data?.record_id || data.data?.taskId || data.data?.id, 
      status: 'pending', 
      taskInfo: data 
  };
}

// GPT-4o Image (保持不变)
async function callKieAPI(prompt: string, model: string, scene: string, options: any, extraData: any, signal?: AbortSignal) {
  const config = PROVIDER_CONFIGS.kie;
  // @ts-ignore
  const endpoint = config.endpoints[model] || config.endpoints['gpt4o-image'];
  const url = `${config.baseURL}${endpoint}`;
  console.log(`🌐 POST ${url}, Model: GPT-4o Image`);

  const payload: any = {
    prompt: prompt.trim(),
    size: options?.size || "1:1",
    nVariants: options?.numImages || 1, 
    isEnhance: false,
    uploadCn: false,
    enableFallback: false,
    fallbackModel: "FLUX_MAX",
    callBackUrl: ""
  };

  if (scene === 'image-to-image') {
    if (extraData?.filesUrl && Array.isArray(extraData.filesUrl)) {
      payload.filesUrl = extraData.filesUrl;
    } else if (extraData?.imageUrl) {
      payload.filesUrl = [extraData.imageUrl];
    }
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${config.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  });

  const data = await response.json();
  
  if (!response.ok || (data.code !== 200 && data.code !== 0)) {
    console.error("GPT-4o API Error:", data);
    throw new Error(`GPT-4o API Error: ${data.msg || data.message || 'Unknown error'}`);
  }

  const taskId = data.data?.taskId || data.data?.id || data.taskId;
  
  if (!taskId) {
    throw new Error('No Task ID returned from GPT-4o API');
  }

  return { taskId: taskId, status: 'pending', taskInfo: data };
}
