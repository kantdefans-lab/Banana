import { NextRequest, NextResponse } from 'next/server';
import { 
  findAITaskByTaskId, 
  updateAITaskById   
} from '@/shared/models/ai_task'; 
import { PROVIDER_CONFIGS } from '@/shared/lib/ai-providers';
import { getAllConfigs } from '@/shared/models/config';
import { extractMediaUrls, getTask, mapStatus } from '@/shared/lib/wavespeed';
import { persistExternalMediaUrls } from '@/shared/lib/media-persistence';
import { getRuntimeEnv } from '@/shared/lib/env';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId } = body; 

    if (!taskId) {
        return NextResponse.json({ code: 1, message: "Missing taskId" }, { status: 400 });
    }

    // 1. 优先查本地数据库
    const localTask = await findAITaskByTaskId(taskId); 

    if (!localTask) {
        return NextResponse.json({ code: 1, message: "Task not found" }, { status: 404 });
    }

    // 本地缓存命中 (如果数据库里已经是 success 且有链接，直接返回)
    if (localTask.status === 'success') {
        let videoUrl = '';
        try {
            if (localTask.taskResult) {
                const resObj = JSON.parse(localTask.taskResult);
                // 兼容所有已知的 key
                videoUrl = resObj.video_url || resObj.url || resObj.video || resObj.result_url || resObj.output_video_url;
                
                // ✅ 兼容 resultUrls 数组结构
                if (!videoUrl && Array.isArray(resObj.resultUrls) && resObj.resultUrls.length > 0) {
                    videoUrl = resObj.resultUrls[0];
                }
                // ✅ 兼容 image_urls 数组结构
                if (!videoUrl && Array.isArray(resObj.image_urls) && resObj.image_urls.length > 0) {
                    videoUrl = resObj.image_urls[0];
                }
            }
        } catch(e) {}

        if (videoUrl) {
            let responseTaskResult = localTask.taskResult;
            if (localTask.provider === 'wavespeed') {
                const persisted = await persistExternalMediaUrls({
                    urls: [videoUrl],
                    mediaType: 'video',
                    taskId: localTask.id,
                    provider: localTask.provider,
                });
                if (persisted.persistedCount > 0 && persisted.urls[0]) {
                    videoUrl = persisted.urls[0];
                    const sourceVideoUrl = (() => {
                        try {
                            if (!localTask.taskResult) return '';
                            const parsed = JSON.parse(localTask.taskResult);
                            return parsed?.video_url || parsed?.url || '';
                        } catch {
                            return '';
                        }
                    })();
                    const newTaskResult = JSON.stringify({
                        video_url: videoUrl,
                        sourceVideoUrl,
                        persistedAt: new Date().toISOString(),
                    });
                    await updateAITaskById(localTask.id, {
                        taskResult: newTaskResult,
                    });
                    responseTaskResult = newTaskResult;
                }
            }

            return NextResponse.json({
                code: 0,
                msg: "success (local)",
                data: { status: 'success', successFlag: 1, videoUrl: videoUrl, taskResult: responseTaskResult }
            });
        }
    }

    // 2. 决定查询 Endpoint
    if (localTask.provider === 'wavespeed') {
      const configs = await getAllConfigs();
      const apiKey =
        (configs.wavespeed_api_key || getRuntimeEnv('WAVESPEED_API_KEY') || '').toString();
      if (!apiKey) {
        return NextResponse.json(
          { code: 1, message: 'WaveSpeed API key missing (wavespeed_api_key / WAVESPEED_API_KEY)' },
          { status: 500 }
        );
      }

      const ws = await getTask({ apiKey, taskId });
      const taskData = ws.task || ws.raw || {};
      const status = mapStatus(taskData.status || taskData.state || ws.raw?.status || ws.raw?.state);
      const media = extractMediaUrls(ws.raw, 'video');
      let videoUrl = media.videoUrls[0] || '';

      if (status === 'success' && videoUrl) {
        const persisted = await persistExternalMediaUrls({
          urls: [videoUrl],
          mediaType: 'video',
          taskId: localTask.id,
          provider: localTask.provider,
        });
        if (persisted.persistedCount > 0 && persisted.urls[0]) {
          videoUrl = persisted.urls[0];
        }

        const standardizedResult = JSON.stringify({ video_url: videoUrl });
        await updateAITaskById(localTask.id, {
          status: 'success',
          taskResult: standardizedResult,
          taskInfo: JSON.stringify(ws.raw),
        });

        return NextResponse.json({
          code: 0,
          data: {
            status: 'success',
            successFlag: 1,
            videoUrl,
            taskResult: standardizedResult,
          },
        });
      }

      if (status === 'failed') {
        await updateAITaskById(localTask.id, {
          status: 'failed',
          ...(localTask.creditId ? { creditId: localTask.creditId } : {}),
          taskInfo: JSON.stringify(ws.raw),
        });
      }

      return NextResponse.json({
        code: 0,
        data: {
          status,
          successFlag: 0,
          taskInfo: ws.raw,
        },
      });
    }

    // 2. 决定查询 Endpoint (KIE compatibility)
    const config = PROVIDER_CONFIGS.kie;
    let baseUrl = config.baseURL;
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);

    let endpoint = '';
    
    // 🔥 根据模型判断接口 🔥
    const model = localTask.model || '';

    // ✅ 修复：Seedance, Sora, Hailuo, Grok, Wan, Kling 都走通用的 Jobs API
    if (
        model.startsWith('wan/') || 
        model.startsWith('kling') || 
        model.startsWith('grok') ||
        model.startsWith('hailuo/') ||
        model.startsWith('sora-') || 
        model.startsWith('bytedance/') // ✅ 新增: Seedance 支持
    ) {
        endpoint = '/jobs/recordInfo'; 
    } 
    // Midjourney
    else if (model.startsWith('mj/') || model === 'mj/imagine') {
        endpoint = '/mj/record-info';  
    } 
    // Veo (默认兜底)
    else {
        endpoint = '/veo/record-info'; 
    }

    if (!baseUrl.includes('/api/v1')) endpoint = `/api/v1${endpoint}`;
    
    const url = `${baseUrl}${endpoint}?taskId=${taskId}`;
    console.log(`🔍 [Video Query] GET ${url} (Model: ${model})`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Content-Type': 'application/json'
      }
    });

    const apiRes = await response.json();

    // 3. 处理返回结果
    if (localTask.status !== 'success' && localTask.status !== 'failed') {
        const taskData = apiRes.data || apiRes;
        
        // 统一状态字段 (status, state)
        const rawStatus = (taskData.status || taskData.state || '').toString().toUpperCase();
        
        let isSuccess = false;
        let isFailed = false;
        let videoUrl = '';

        // --- 判定成功 ---
        if (rawStatus === 'SUCCESS' || rawStatus === 'SUCCEEDED' || taskData.successFlag === 1) {
            isSuccess = true;

            // 🔥 解析视频 URL 逻辑 🔥
            
            // 1. 检查 resultJson (Jobs API 如 Grok/Wan/Kling/Hailuo/Sora/Seedance 特有)
            if (taskData.resultJson) {
                try {
                    const r = typeof taskData.resultJson === 'string' ? JSON.parse(taskData.resultJson) : taskData.resultJson;
                    
                    // 常见: resultUrls[]
                    if (Array.isArray(r.resultUrls) && r.resultUrls.length > 0) {
                        videoUrl = r.resultUrls[0];
                    }
                    // 部分模型: image_urls[]
                    else if (Array.isArray(r.image_urls) && r.image_urls.length > 0) {
                        videoUrl = r.image_urls[0];
                    }
                    // 单字段
                    else {
                        videoUrl = r.video_url || r.url || r.video || r.result_url || r.output_video_url;
                    }
                } catch (e) {
                    console.error("Error parsing resultJson:", e);
                }
            }

            // 2. 检查 result 字段 (可能是字符串或对象)
            if (!videoUrl && taskData.result) {
                if (typeof taskData.result === 'string' && taskData.result.startsWith('http')) {
                    videoUrl = taskData.result;
                } else if (typeof taskData.result === 'object') {
                    videoUrl = taskData.result.video_url || taskData.result.url || taskData.result.video;
                }
            }

            // 3. 检查 Veo 风格
            if (!videoUrl && taskData.response?.resultUrls?.[0]) {
                videoUrl = taskData.response.resultUrls[0];
            }
        }
        
        // --- 判定失败 ---
        else if (
            rawStatus === 'FAILED' || 
            rawStatus === 'ERROR' || 
            rawStatus === 'FAILURE' ||
            (taskData.errorCode !== null && taskData.errorCode !== undefined)
        ) {
            isFailed = true;
        }

        // --- 更新数据库 ---
        if (isSuccess && videoUrl) {
            console.log(`✅ [Video Query] Success: ${videoUrl}`);
            
            // 构造标准化的 result，方便前端统一解析
            const standardizedResult = JSON.stringify({ video_url: videoUrl });

            await updateAITaskById(localTask.id, {
                status: 'success',
                taskResult: standardizedResult, 
                taskInfo: JSON.stringify(apiRes) 
            });
            
            return NextResponse.json({
                code: 0,
                data: {
                    status: 'success',
                    successFlag: 1,
                    videoUrl: videoUrl,
                    taskResult: standardizedResult
                }
            });
        } 
        else if (isFailed) {
            console.log(`❌ [Video Query] Failed:`, apiRes);
            await updateAITaskById(localTask.id, {
                status: 'failed',
                ...(localTask.creditId ? { creditId: localTask.creditId } : {}),
                taskInfo: JSON.stringify(apiRes)
            });
        }
    }

    return NextResponse.json(apiRes);

  } catch (error: any) {
    console.error("❌ [Video Query] Error:", error);
    return NextResponse.json({ code: 1, message: error.message }, { status: 500 });
  }
}
