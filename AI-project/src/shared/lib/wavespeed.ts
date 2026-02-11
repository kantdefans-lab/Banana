type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

export type WaveSpeedModel = {
  model_id?: string;
  id?: string;
  api_schema?: {
    api_schemas?: Array<{
      request_schema?: {
        properties?: Record<string, any>;
        required?: string[];
      };
      requestSchema?: {
        properties?: Record<string, any>;
        required?: string[];
      };
    }>;
    apiSchemas?: Array<{
      request_schema?: {
        properties?: Record<string, any>;
        required?: string[];
      };
      requestSchema?: {
        properties?: Record<string, any>;
        required?: string[];
      };
    }>;
    request_schema?: {
      properties?: Record<string, any>;
      required?: string[];
    };
    requestSchema?: {
      properties?: Record<string, any>;
      required?: string[];
    };
  };
  apiSchema?: {
    api_schemas?: Array<{
      request_schema?: {
        properties?: Record<string, any>;
        required?: string[];
      };
      requestSchema?: {
        properties?: Record<string, any>;
        required?: string[];
      };
    }>;
    apiSchemas?: Array<{
      request_schema?: {
        properties?: Record<string, any>;
        required?: string[];
      };
      requestSchema?: {
        properties?: Record<string, any>;
        required?: string[];
      };
    }>;
    request_schema?: {
      properties?: Record<string, any>;
      required?: string[];
    };
    requestSchema?: {
      properties?: Record<string, any>;
      required?: string[];
    };
  };
  [key: string]: any;
};

export type WaveSpeedTask = {
  task_id?: string;
  id?: string;
  status?: string;
  state?: string;
  outputs?: any[];
  [key: string]: any;
};

const WAVESPEED_BASE_URL =
  process.env.WAVESPEED_BASE_URL || 'https://api.wavespeed.ai/api/v3';

const MODELS_CACHE_TTL_MS = 60 * 60 * 1000;
let cachedModels: { expiresAt: number; models: WaveSpeedModel[] } | null = null;

function getAuthHeaders(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
}

async function fetchJson(url: string, init: RequestInit) {
  const resp = await fetch(url, init);
  const text = await resp.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!resp.ok) {
    const msg =
      (json && (json.message || json.msg || json.error)) ||
      text ||
      `HTTP ${resp.status}`;
    const err = new Error(msg);
    (err as any).status = resp.status;
    (err as any).body = json ?? text;
    throw err;
  }

  return json as any;
}

function normalizeToken(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function tokenize(s: string): string[] {
  const norm = normalizeToken(s);
  return norm ? norm.split(/\s+/g) : [];
}

function getModelId(m: WaveSpeedModel): string | null {
  return (m.model_id || m.id || null) as string | null;
}

export function getWaveSpeedRequestSchemaProperties(
  model?: WaveSpeedModel | null
): Record<string, any> | null {
  if (!model || typeof model !== 'object') return null;

  const direct =
    model?.api_schema?.request_schema?.properties ||
    model?.api_schema?.requestSchema?.properties ||
    model?.apiSchema?.request_schema?.properties ||
    model?.apiSchema?.requestSchema?.properties ||
    null;
  if (direct && typeof direct === 'object') return direct;

  const apiSchemas =
    model?.api_schema?.api_schemas ||
    model?.api_schema?.apiSchemas ||
    model?.apiSchema?.api_schemas ||
    model?.apiSchema?.apiSchemas ||
    null;

  if (Array.isArray(apiSchemas)) {
    for (const schema of apiSchemas) {
      const props =
        schema?.request_schema?.properties ||
        schema?.requestSchema?.properties ||
        null;
      if (props && typeof props === 'object') {
        return props;
      }
    }
  }

  return null;
}

export async function listModels({
  apiKey,
  signal,
}: {
  apiKey: string;
  signal?: AbortSignal;
}): Promise<WaveSpeedModel[]> {
  const now = Date.now();
  if (cachedModels && cachedModels.expiresAt > now) {
    return cachedModels.models;
  }

  const url = `${WAVESPEED_BASE_URL}/models`;
  const data = await fetchJson(url, {
    method: 'GET',
    headers: getAuthHeaders(apiKey),
    signal,
  });

  const models: WaveSpeedModel[] = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.models)
        ? data.models
        : [];

  cachedModels = { expiresAt: now + MODELS_CACHE_TTL_MS, models };
  return models;
}

export async function resolveModelId({
  apiKey,
  requestedModelId,
  signal,
}: {
  apiKey: string;
  requestedModelId: string;
  signal?: AbortSignal;
}): Promise<{ modelId: string; model?: WaveSpeedModel }> {
  if (!requestedModelId) {
    throw new Error('WaveSpeed: modelId is required');
  }

  const models = await listModels({ apiKey, signal });
  const byId = new Map<string, WaveSpeedModel>();
  models.forEach((m) => {
    const id = getModelId(m);
    if (id) byId.set(id, m);
  });

  if (byId.has(requestedModelId)) {
    return { modelId: requestedModelId, model: byId.get(requestedModelId) };
  }

  const alias: Record<string, string> = {
    'nano-banana-pro': 'google/nano-banana-pro',
    'nano-banana': 'google/nano-banana',
  };
  const aliased = alias[requestedModelId];
  if (aliased && byId.has(aliased)) {
    return { modelId: aliased, model: byId.get(aliased) };
  }

  // Fuzzy match: token overlap on model ids
  const queryTokens = new Set(tokenize(requestedModelId));
  let best: { id: string; score: number } | null = null;
  let secondBestScore = 0;

  for (const id of byId.keys()) {
    const candTokens = tokenize(id);
    if (candTokens.length === 0) continue;
    let score = 0;
    candTokens.forEach((t) => {
      if (queryTokens.has(t)) score += 1;
    });
    if (score > 0 && (!best || score > best.score)) {
      secondBestScore = best?.score ?? 0;
      best = { id, score };
    } else if (score > 0 && best && score > secondBestScore) {
      secondBestScore = score;
    }
  }

  // Accept only if clearly better than alternatives.
  if (best && best.score >= 2 && best.score > secondBestScore) {
    return { modelId: best.id, model: byId.get(best.id) };
  }

  throw new Error(`WaveSpeed: unsupported modelId: ${requestedModelId}`);
}

function parseRatio(ratio: string | undefined): { w: number; h: number } | null {
  if (!ratio) return null;
  const m = ratio.trim().match(/^(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)$/);
  if (!m) return null;
  const w = Number(m[1]);
  const h = Number(m[2]);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null;
  return { w, h };
}

function guessLongEdgeFromResolution(resolution: any): number | null {
  if (!resolution) return null;
  if (typeof resolution === 'number' && Number.isFinite(resolution)) {
    return resolution;
  }
  if (typeof resolution !== 'string') return null;
  const r = resolution.trim().toLowerCase();
  if (r === '1k') return 1024;
  if (r === '2k') return 2048;
  if (r === '4k') return 4096;
  if (r.endsWith('p')) {
    const n = Number(r.replace('p', ''));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function alignTo(value: number, step: number) {
  return Math.max(step, Math.round(value / step) * step);
}

function parseSizeToken(sizeLike: any): { w: number; h: number; sep: 'x' | '*' } | null {
  if (typeof sizeLike !== 'string') return null;
  const m = sizeLike.trim().match(/^(\d+)\s*([x\*])\s*(\d+)$/i);
  if (!m) return null;
  const w = Number(m[1]);
  const h = Number(m[3]);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null;
  return { w, h, sep: (m[2] as 'x' | '*') || 'x' };
}

function buildSizeFromRatio({
  ratio,
  longEdgeHint,
  defaultSize,
}: {
  ratio: { w: number; h: number } | null;
  longEdgeHint: number | null;
  defaultSize?: string;
}): string | null {
  const defaultParsed = parseSizeToken(defaultSize);
  const sep: 'x' | '*' = defaultParsed?.sep || 'x';

  if (!ratio) {
    if (defaultParsed) {
      return `${defaultParsed.w}${sep}${defaultParsed.h}`;
    }
    return null;
  }

  const defaultLongEdge = Math.max(defaultParsed?.w || 0, defaultParsed?.h || 0);
  const inferredLongEdge = (longEdgeHint ?? defaultLongEdge) || 1024;
  let width = inferredLongEdge;
  let height = inferredLongEdge;

  if (ratio.w >= ratio.h) {
    width = alignTo(inferredLongEdge, 64);
    height = alignTo(inferredLongEdge / (ratio.w / ratio.h), 64);
  } else {
    height = alignTo(inferredLongEdge, 64);
    width = alignTo(inferredLongEdge * (ratio.w / ratio.h), 64);
  }

  return `${width}${sep}${height}`;
}

function selectClosestSizeEnum(
  sizeEnum: string[],
  ratio: { w: number; h: number } | null,
  longEdgeHint: number | null
): string | null {
  if (!sizeEnum || sizeEnum.length === 0) return null;
  if (!ratio && !longEdgeHint) return null;

  const candidates = sizeEnum
    .map((s) => {
      const m = String(s).match(/^(\d+)\s*[x\*]\s*(\d+)$/i);
      if (!m) return null;
      const w = Number(m[1]);
      const h = Number(m[2]);
      if (!w || !h) return null;
      return { raw: s, w, h, r: w / h, longEdge: Math.max(w, h) };
    })
    .filter(Boolean) as Array<{ raw: string; w: number; h: number; r: number; longEdge: number }>;

  if (candidates.length === 0) return null;

  const targetR = ratio ? ratio.w / ratio.h : null;
  const targetLong = longEdgeHint ?? null;

  let best: { raw: string; score: number } | null = null;
  for (const c of candidates) {
    let score = 0;
    if (targetR !== null) {
      score -= Math.abs(c.r - targetR) * 10;
    }
    if (targetLong !== null) {
      score -= Math.abs(c.longEdge - targetLong) / 50;
    }
    if (!best || score > best.score) best = { raw: c.raw, score };
  }

  return best?.raw ?? null;
}

export async function buildParams({
  apiKey,
  requestedModelId,
  prompt,
  mediaType,
  scene,
  options,
  imageUrls,
  signal,
}: {
  apiKey: string;
  requestedModelId: string;
  prompt?: string;
  mediaType?: 'image' | 'video' | 'music' | 'text';
  scene?: string;
  options?: any;
  imageUrls?: string[];
  signal?: AbortSignal;
}): Promise<{ modelId: string; params: Record<string, any>; model?: WaveSpeedModel }> {
  const resolved = await resolveModelId({
    apiKey,
    requestedModelId,
    signal,
  });

  const model = resolved.model;
  const properties = getWaveSpeedRequestSchemaProperties(model);
  const allowedKeys = properties ? new Set(Object.keys(properties)) : null;

  const ratio =
    parseRatio(options?.size) ||
    parseRatio(options?.aspectRatio) ||
    parseRatio(options?.aspect_ratio);
  const longEdgeHint =
    guessLongEdgeFromResolution(options?.resolution) ||
    guessLongEdgeFromResolution(options?.res) ||
    null;

  const params: Record<string, any> = {};
  if (prompt !== undefined) params.prompt = prompt;

  const maybeAspectRatio = options?.size || options?.aspectRatio || options?.aspect_ratio;
  if (maybeAspectRatio) {
    params.aspect_ratio = maybeAspectRatio;
  }

  if (typeof options?.duration !== 'undefined') params.duration = options.duration;
  if (typeof options?.resolution !== 'undefined') params.resolution = options.resolution;
  if (typeof options?.quality !== 'undefined') params.quality = options.quality;
  if (typeof options?.mode !== 'undefined') params.mode = options.mode;
  if (typeof options?.removeWatermark !== 'undefined')
    params.remove_watermark = !!options.removeWatermark;
  if (typeof options?.sound !== 'undefined') params.sound = !!options.sound;
  if (typeof options?.cameraFixed !== 'undefined')
    params.camera_fixed = !!options.cameraFixed;

  const numImages = options?.numImages ?? options?.num_images ?? options?.n;
  if (typeof numImages !== 'undefined') {
    params.num_images = numImages;
    params.n = numImages;
  }

  const shouldAttachImages =
    (scene && scene.includes('image')) ||
    mediaType === 'image' ||
    mediaType === 'video';

  if (shouldAttachImages && imageUrls && imageUrls.length > 0) {
    params.image_urls = imageUrls;
    params.image_url = imageUrls[0];
    params.image = imageUrls[0];
  }

  // Schema-driven adjustments
  if (properties && allowedKeys) {
    if (allowedKeys.has('size') && !allowedKeys.has('aspect_ratio')) {
      const sizeEnum: string[] | undefined = properties.size?.enum;
      const selected = sizeEnum
        ? selectClosestSizeEnum(sizeEnum, ratio, longEdgeHint)
        : null;
      if (selected) {
        params.size = selected;
      } else {
        const directSize = parseSizeToken(options?.size);
        if (directSize) {
          params.size = `${directSize.w}${directSize.sep}${directSize.h}`;
        } else {
          const builtSize = buildSizeFromRatio({
            ratio,
            longEdgeHint,
            defaultSize: properties?.size?.default,
          });
          if (builtSize) params.size = builtSize;
        }
      }
    }

    if (allowedKeys.has('width') && allowedKeys.has('height') && ratio) {
      const longEdge = longEdgeHint ?? 1024;
      if (ratio.w >= ratio.h) {
        params.width = alignTo(longEdge, 64);
        params.height = alignTo(longEdge / (ratio.w / ratio.h), 64);
      } else {
        params.height = alignTo(longEdge, 64);
        params.width = alignTo(longEdge * (ratio.w / ratio.h), 64);
      }
    }

    // Prefer keys that actually exist in schema
    if (!allowedKeys.has('aspect_ratio')) delete params.aspect_ratio;
    if (!allowedKeys.has('num_images')) delete params.num_images;
    if (!allowedKeys.has('n')) delete params.n;
    if (!allowedKeys.has('image_urls')) delete params.image_urls;
    if (!allowedKeys.has('image_url')) delete params.image_url;
    if (!allowedKeys.has('image')) delete params.image;
    if (!allowedKeys.has('camera_fixed')) delete params.camera_fixed;
    if (!allowedKeys.has('remove_watermark')) delete params.remove_watermark;
  }

  const finalParams =
    allowedKeys && allowedKeys.size > 0
      ? Object.fromEntries(
          Object.entries(params).filter(([k, v]) => allowedKeys.has(k) && v !== undefined)
        )
      : Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined));

  // If schema filtering removed everything, fall back to unfiltered.
  const paramsToSend =
    Object.keys(finalParams).length > 0
      ? finalParams
      : Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined));

  // Avoid sending empty prompt for models that don't accept it.
  if (!paramsToSend.prompt) {
    delete (paramsToSend as any).prompt;
  }

  return { modelId: resolved.modelId, params: paramsToSend, model };
}

export async function submitTask({
  apiKey,
  requestedModelId,
  params,
  signal,
}: {
  apiKey: string;
  requestedModelId: string;
  params: Record<string, any>;
  signal?: AbortSignal;
}): Promise<{ taskId: string; raw: any; modelId: string }> {
  const resolved = await resolveModelId({
    apiKey,
    requestedModelId,
    signal,
  });
  const encodedModelPath = resolved.modelId
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/');
  const url = `${WAVESPEED_BASE_URL}/${encodedModelPath}`;
  const raw = await fetchJson(url, {
    method: 'POST',
    headers: getAuthHeaders(apiKey),
    body: JSON.stringify(params ?? {}),
    signal,
  });

  const taskId =
    raw?.data?.task_id ||
    raw?.data?.taskId ||
    raw?.task_id ||
    raw?.taskId ||
    raw?.id ||
    raw?.data?.id;

  if (!taskId || typeof taskId !== 'string') {
    throw new Error('WaveSpeed: no task_id returned from submit');
  }

  return { taskId, raw, modelId: resolved.modelId };
}

export async function getTask({
  apiKey,
  taskId,
  signal,
}: {
  apiKey: string;
  taskId: string;
  signal?: AbortSignal;
}): Promise<{ task: WaveSpeedTask; raw: any }> {
  const encodedTaskId = encodeURIComponent(taskId);
  const urls = [
    `${WAVESPEED_BASE_URL}/predictions/${encodedTaskId}/result`,
    `${WAVESPEED_BASE_URL}/task/${encodedTaskId}`,
    `${WAVESPEED_BASE_URL}/predictions/${encodedTaskId}`,
  ];

  let lastError: any = null;
  for (const url of urls) {
    try {
      const raw = await fetchJson(url, {
        method: 'GET',
        headers: getAuthHeaders(apiKey),
        signal,
      });
      const task: WaveSpeedTask =
        raw?.data && typeof raw.data === 'object' ? raw.data : raw;
      return { task, raw };
    } catch (error: any) {
      lastError = error;
      if (error?.status === 404) {
        continue;
      }
      throw error;
    }
  }

  throw lastError || new Error(`WaveSpeed: failed to query task ${taskId}`);
}

export function mapStatus(statusLike: any): 'pending' | 'processing' | 'success' | 'failed' {
  const s = String(statusLike || '').toLowerCase();
  if (!s) return 'processing';
  if (s.includes('success') || s.includes('succeed') || s.includes('complete') || s === 'done')
    return 'success';
  if (s.includes('fail') || s.includes('error') || s.includes('canceled') || s.includes('cancel'))
    return 'failed';
  if (s.includes('pending') || s.includes('queue') || s.includes('wait')) return 'pending';
  return 'processing';
}

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function moderateTextContent({
  apiKey,
  text,
  signal,
  maxAttempts = 15,
  pollIntervalMs = 1000,
}: {
  apiKey: string;
  text: string;
  signal?: AbortSignal;
  maxAttempts?: number;
  pollIntervalMs?: number;
}): Promise<{ flaggedLabels: string[]; raw?: any }> {
  if (!text || !text.trim()) {
    return { flaggedLabels: [] };
  }

  const moderatorModelId = 'wavespeed-ai/molmo2/text-content-moderator';
  const submission = await submitTask({
    apiKey,
    requestedModelId: moderatorModelId,
    params: { text },
    signal,
  });

  let latestResult = submission.raw;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const polled = await getTask({
      apiKey,
      taskId: submission.taskId,
      signal,
    });
    latestResult = polled.raw;
    const status = mapStatus(
      polled.task?.status ||
        polled.raw?.status ||
        polled.task?.state ||
        polled.raw?.state
    );
    if (status !== 'processing') {
      break;
    }
    await wait(pollIntervalMs);
  }

  const outputs =
    latestResult?.data?.outputs ??
    latestResult?.outputs ??
    latestResult?.task?.outputs ??
    [];

  const flaggedSet = new Set<string>();
  if (Array.isArray(outputs)) {
    for (const output of outputs) {
      if (!output || typeof output !== 'object') continue;
      for (const [key, value] of Object.entries(output)) {
        if (typeof value === 'boolean' && value) {
          flaggedSet.add(key);
        } else if (typeof value === 'number' && value > 0.5) {
          flaggedSet.add(key);
        }
      }
    }
  }

  return { flaggedLabels: Array.from(flaggedSet), raw: latestResult };
}

function looksLikeVideoUrl(url: string) {
  return /\.(mp4|mov|webm|mkv|avi)(\?|$)/i.test(url);
}
function looksLikeImageUrl(url: string) {
  return /\.(png|jpg|jpeg|webp|gif|bmp|svg)(\?|$)/i.test(url);
}

function isLikelyApiEndpointUrl(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname.toLowerCase();
    if (host.startsWith('api.') && path.startsWith('/api/')) return true;
    if (host.includes('api.wavespeed.ai') && path.includes('/predictions/'))
      return true;
    return false;
  } catch {
    return false;
  }
}

function hasMediaHint(text: string) {
  const t = text.toLowerCase();
  return (
    t.includes('image') ||
    t.includes('video') ||
    t.includes('output') ||
    t.includes('result') ||
    t.includes('media') ||
    t.includes('file') ||
    t.includes('download') ||
    t.includes('source') ||
    t.includes('src') ||
    t.includes('uri')
  );
}

export function extractMediaUrls(
  raw: any,
  preferredType?: 'image' | 'video'
): { imageUrls: string[]; videoUrls: string[] } {
  const imageUrls = new Set<string>();
  const videoUrls = new Set<string>();

  const add = (url: any, type?: any, hintKey?: string) => {
    if (typeof url !== 'string') return;
    if (!url.startsWith('http')) return;

    const t = typeof type === 'string' ? type.toLowerCase() : '';
    const hint = typeof hintKey === 'string' ? hintKey.toLowerCase() : '';

    // Exclude API polling endpoints (e.g. .../predictions/{id}/result)
    if (
      isLikelyApiEndpointUrl(url) &&
      !looksLikeImageUrl(url) &&
      !looksLikeVideoUrl(url) &&
      !t.includes('image') &&
      !t.includes('video')
    ) {
      return;
    }

    if (t.includes('video') || looksLikeVideoUrl(url)) {
      videoUrls.add(url);
      return;
    }
    if (t.includes('image') || looksLikeImageUrl(url)) {
      imageUrls.add(url);
      return;
    }

    // Only apply preferred media type fallback when key semantics suggest media payload.
    const fallbackAllowed = hasMediaHint(`${t} ${hint}`);
    if (preferredType === 'video' && fallbackAllowed) {
      videoUrls.add(url);
      return;
    }
    if (preferredType === 'image' && fallbackAllowed) {
      imageUrls.add(url);
      return;
    }
  };

  const seen = new Set<any>();
  const walk = (node: any, hintKey?: string) => {
    if (!node) return;
    if (typeof node === 'object') {
      if (seen.has(node)) return;
      seen.add(node);
    }

    if (Array.isArray(node)) {
      node.forEach((item) => walk(item, hintKey));
      return;
    }

    if (typeof node === 'object') {
      if (typeof (node as any).url === 'string') add((node as any).url, (node as any).type || hintKey, hintKey);
      if (typeof (node as any).video_url === 'string') add((node as any).video_url, 'video', hintKey);
      if (typeof (node as any).image_url === 'string') add((node as any).image_url, 'image', hintKey);
      if (Array.isArray((node as any).media)) walk((node as any).media, 'media');
      if (Array.isArray((node as any).outputs)) walk((node as any).outputs, 'outputs');
      if (typeof (node as any).result === 'string') add((node as any).result, hintKey || 'result', hintKey);
      if (Array.isArray((node as any).resultUrls)) walk((node as any).resultUrls, 'resultUrls');

      Object.entries(node).forEach(([key, value]) => {
        walk(value, key);
      });
      return;
    }

    if (typeof node === 'string') {
      if (node.startsWith('http')) add(node, hintKey, hintKey);
      return;
    }
  };

  walk(raw);

  return {
    imageUrls: Array.from(imageUrls),
    videoUrls: Array.from(videoUrls),
  };
}

