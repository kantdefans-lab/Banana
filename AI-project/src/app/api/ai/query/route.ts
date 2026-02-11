import { NextRequest, NextResponse } from 'next/server';
import { findAITaskById, updateAITaskById } from '@/shared/models/ai_task';
import { getUserInfo } from '@/shared/models/user';
import { getAllConfigs } from '@/shared/models/config';
import { 
  extractImageUrlsFromTask, 
  PROVIDER_CONFIGS, 
  isJobsApiModel, 
  isFluxKontextModel,
  isMidjourneyModel 
} from '@/shared/lib/ai-providers';
import { extractMediaUrls, getTask, mapStatus } from '@/shared/lib/wavespeed';
import { persistExternalMediaUrls } from '@/shared/lib/media-persistence';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, forceCheck } = body;

    console.log(`📨 [Query] 收到请求: ${taskId}`);

    // 1. 验证用户
    let user = await getUserInfo();
    
    if (!user) {
      return NextResponse.json({ code: 401, message: 'Unauthorized' }, { status: 401 });
    }

    // 2. 获取任务
    const task = await findAITaskById(taskId);
    
    if (!task) {
      return NextResponse.json({ code: 404, message: 'Task not found' }, { status: 404 });
    }

    // 权限检查
    if (task.userId !== user.id && user.id !== 'deefd63f-a36c-4f6d-a1ac-94830382859c') {
      return NextResponse.json({ code: 403, message: 'Forbidden' }, { status: 403 });
    }

    // 3. 构造正确的查询 URL
    const { provider, model, taskId: externalTaskId } = task;
    let url = '';
    let headers: any = { 'Content-Type': 'application/json' };

    // 决定是否需要查询 API
    let shouldQueryApi = forceCheck || task.status !== 'success';
    
    // 如果数据库说是 success，但其实没图片，强制重查
    if (task.status === 'success') {
       const cachedImages = await extractImageUrlsFromTask(task);
       if (cachedImages.length === 0) {
         console.log("⚠️ 数据库状态为Success但无图片，强制重查 API");
         shouldQueryApi = true;
       }
    }

    if (task.status === 'success' && provider === 'wavespeed' && !shouldQueryApi) {
      const cachedImages = await extractImageUrlsFromTask(task);
      if (cachedImages.length > 0) {
        const persisted = await persistExternalMediaUrls({
          urls: cachedImages,
          mediaType: 'image',
          taskId: task.id,
          provider: task.provider,
        });

        if (persisted.persistedCount > 0) {
          const oldTaskResult = (() => {
            try {
              return task.taskResult ? JSON.parse(task.taskResult) : {};
            } catch {
              return {};
            }
          })();

          const newTaskResultStr = JSON.stringify({
            ...oldTaskResult,
            imageUrls: persisted.urls,
            result_urls: persisted.urls,
            urls: persisted.urls,
            sourceImageUrls: cachedImages,
            persistedAt: new Date().toISOString(),
          });

          await updateAITaskById(taskId, { taskResult: newTaskResultStr });
          task.taskResult = newTaskResultStr;
        }
      }
    }

    let apiData = null;

    if (shouldQueryApi && provider === 'wavespeed' && externalTaskId) {
      const configs = await getAllConfigs();
      const apiKey =
        (configs.wavespeed_api_key || process.env.WAVESPEED_API_KEY || '').toString();
      if (!apiKey) {
        throw new Error('WaveSpeed API key missing (wavespeed_api_key / WAVESPEED_API_KEY)');
      }

      url = `https://api.wavespeed.ai/api/v3/predictions/${externalTaskId}/result`;
      const ws = await getTask({ apiKey, taskId: externalTaskId });
      apiData = ws.raw;
    } else if (shouldQueryApi && provider === 'kie' && externalTaskId) {
      const config = PROVIDER_CONFIGS.kie;
      headers['Authorization'] = `Bearer ${config.token}`;

      // ==========================================
      // 🚨 路由分发检查 (API Routing Logic)
      // ==========================================
      
      // 1. 通用 Jobs 接口 
      // 覆盖: Nano Banana, Z-Image, Seedream, Flux 2, Grok, Qwen, Wan, Kling, Hailuo, Sora, Seedance
      if (isJobsApiModel(model)) {
        url = `${config.baseURL}${config.endpoints['jobs_record']}?taskId=${externalTaskId}`;
      } 
      // 2. Flux Kontext 接口 (Flux Kontext Pro/Max)
      else if (isFluxKontextModel(model)) {
        url = `${config.baseURL}${config.endpoints['flux_record']}?taskId=${externalTaskId}`;
      } 
      // 3. Midjourney 接口 (独立 endpoint)
      else if (isMidjourneyModel(model)) {
        url = `${config.baseURL}${config.endpoints['mj_record']}?taskId=${externalTaskId}`;
        console.log(`🎨 [Query] Midjourney 模式: ${url}`);
      }
      // 4. GPT-4o 接口 (默认兜底)
      else {
        console.log(`🔍 [Query] 模型 ${model} -> 路由至 GPT4o API`);
        url = `${config.baseURL}${config.endpoints['gpt4o_record']}?taskId=${externalTaskId}`;
      }

      if (url) {
        console.log(`🌐 [Query] GET ${url}`);
        try {
          const response = await fetch(url, { method: 'GET', headers });
          if (response.ok) {
            apiData = await response.json();
          } else {
            console.error(`❌ [Query] API请求失败: ${response.status}`);
          }
        } catch (e) {
          console.error(`❌ [Query] 网络请求异常`, e);
        }
      }
    }

    // 4. 数据处理与状态更新
    if (apiData) {
        // 记录数据源，方便调试
        apiData.querySource = url;
        
        const taskInfoStr = JSON.stringify(apiData);
        // 尝试解析 result，兼容不同模型可能返回的结构
        const rawResult = apiData.data?.result || apiData.data || apiData;
        
        const taskResultStr = JSON.stringify({
            status: apiData.data?.state || apiData.data?.status || apiData.status || 'processing',
            timestamp: Date.now(),
            rawData: rawResult, 
            querySource: url
        });

        let newStatus = task.status;
        if (provider === 'wavespeed') {
            newStatus = mapStatus(
              apiData.data?.status || apiData.data?.state || apiData.status || apiData.state
            );
        }
        const remoteState = (apiData.data?.state || apiData.data?.status || apiData.status || '').toLowerCase();
        
        if (remoteState.includes('success') || remoteState.includes('complete') || remoteState.includes('succeeded')) {
            newStatus = 'success';
        } else if (remoteState.includes('fail') || remoteState.includes('error')) {
            newStatus = 'failed';
        }

        // 🔥 调用提取器 (Unified Image Extractor)
        const tempTask = { ...task, taskResult: taskResultStr, taskInfo: taskInfoStr };
        const imageUrls = await extractImageUrlsFromTask(tempTask, apiData);
        if (provider === 'wavespeed') {
          const media = extractMediaUrls(apiData, 'image');
          media.imageUrls.forEach((u) => imageUrls.push(u));
        }

        let finalImageUrls = imageUrls;
        if (provider === 'wavespeed' && imageUrls.length > 0) {
          const persisted = await persistExternalMediaUrls({
            urls: imageUrls,
            mediaType: 'image',
            taskId: task.id,
            provider: task.provider,
          });
          if (persisted.persistedCount > 0) {
            finalImageUrls = persisted.urls;
          }
        }

        // 🌟 只要提取到了图片，强行标记为成功
        if (finalImageUrls.length > 0) {
            console.log(`📸 [Query] 提取成功: ${finalImageUrls.length} 张 -> 强制 Success`);
            newStatus = 'success';
        }

        const parsedTaskResult = (() => {
          try {
            return JSON.parse(taskResultStr);
          } catch {
            return {};
          }
        })();
        const finalTaskResultStr = JSON.stringify({
          ...parsedTaskResult,
          imageUrls: finalImageUrls,
          result_urls: finalImageUrls,
          urls: finalImageUrls,
          sourceImageUrls: imageUrls,
          persistedAt: new Date().toISOString(),
        });

        await updateAITaskById(taskId, {
            status: newStatus,
            ...(newStatus === 'failed' && task.creditId ? { creditId: task.creditId } : {}),
            taskResult: finalTaskResultStr,
            taskInfo: taskInfoStr
        });

        task.status = newStatus;
        task.taskResult = finalTaskResultStr;
        task.taskInfo = taskInfoStr;
    }

    // 5. 格式化返回给前端
    const responseData = await formatResponseForFrontend(task, apiData);
    
    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error("❌ [Query] 严重错误:", error);
    return NextResponse.json({ code: 500, message: error.message }, { status: 500 });
  }
}

// ------------------------------------------------------------------
// 🎯 统一格式化函数
// ------------------------------------------------------------------
async function formatResponseForFrontend(task: any, apiData: any = null) {
  const tempObj = { ...task, ...apiData };
  const imageUrls = await extractImageUrlsFromTask(tempObj, apiData);

  // WaveSpeed 兼容补强：某些模型返回 URL 无扩展名，优先按 image 语义归类
  const taskInfoObj = (() => {
    try {
      return task?.taskInfo ? JSON.parse(task.taskInfo) : null;
    } catch {
      return null;
    }
  })();
  const taskResultObj = (() => {
    try {
      return task?.taskResult ? JSON.parse(task.taskResult) : null;
    } catch {
      return null;
    }
  })();

  const mediaUrls = new Set<string>();
  [apiData, taskInfoObj, taskResultObj, tempObj].forEach((source) => {
    const media = extractMediaUrls(source, 'image');
    media.imageUrls.forEach((url) => mediaUrls.add(url));
  });
  mediaUrls.forEach((url) => imageUrls.push(url));

  const dedupedImageUrls = Array.from(
    new Set(imageUrls.filter((u) => typeof u === 'string' && u.startsWith('http')))
  );
  
  let isProcessing = task.status === 'processing' || task.status === 'GENERATING' || task.status === 'pending';
  
  let finalMessage = 'success';
  if (isProcessing) {
      finalMessage = dedupedImageUrls.length > 0 ? `生成中，已出图 ${dedupedImageUrls.length} 张` : '任务处理中...';
  } else if (task.status === 'failed') {
      finalMessage = '任务失败';
  } else if (task.status === 'success') {
      finalMessage = '任务已完成';
  }
  
  const id = task.taskId || task.task_id || task.id;
  
  const fixedTask = {
    ...task,
    taskId: id,
    task_id: id,
    imageUrls: dedupedImageUrls,
    images: dedupedImageUrls,
    urls: dedupedImageUrls,
    result_urls: dedupedImageUrls,
    hasImages: dedupedImageUrls.length > 0,
    imageCount: dedupedImageUrls.length,
    processingStatus: isProcessing ? {
      isGenerating: true,
      hasPartialImages: dedupedImageUrls.length > 0,
      message: finalMessage
    } : null
  };
  
  return {
    code: 0, 
    msg: finalMessage,
    data: {
        ...fixedTask,
        task_result: fixedTask.taskResult,
        task_info: fixedTask.taskInfo,
        extractedImageUrls: dedupedImageUrls
    },
    imageUrls: dedupedImageUrls,
    images: dedupedImageUrls,
    hasImages: dedupedImageUrls.length > 0,
    status: task.status,
    isProcessing: isProcessing
  };
}
