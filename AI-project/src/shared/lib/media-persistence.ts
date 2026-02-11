import { getStorageService } from '@/shared/services/storage';

type PersistMediaType = 'image' | 'video';

type PersistOptions = {
  urls: string[];
  mediaType: PersistMediaType;
  taskId: string;
  provider?: string;
};

type PersistResult = {
  urls: string[];
  persistedCount: number;
  skippedCount: number;
  errors: string[];
};

function isLikelyWaveSpeedTemporaryUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname.toLowerCase();

    if (host.includes('wavespeed')) return true;
    if (host.includes('api.wavespeed.ai')) return true;
    if (path.includes('/predictions/')) return true;
    if (host.includes('cloudfront.net') && path.includes('/predictions/')) return true;

    return false;
  } catch {
    return false;
  }
}

function guessExtension(url: string, mediaType: PersistMediaType): string {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname || '';
    const last = pathname.split('/').pop() || '';
    const idx = last.lastIndexOf('.');
    if (idx > 0 && idx < last.length - 1) {
      const ext = last.slice(idx + 1).toLowerCase();
      if (/^[a-z0-9]{2,6}$/.test(ext)) return ext;
    }
  } catch {}

  return mediaType === 'video' ? 'mp4' : 'jpg';
}

function guessContentType(ext: string, mediaType: PersistMediaType): string {
  const lower = ext.toLowerCase();
  if (lower === 'jpg' || lower === 'jpeg') return 'image/jpeg';
  if (lower === 'png') return 'image/png';
  if (lower === 'webp') return 'image/webp';
  if (lower === 'gif') return 'image/gif';
  if (lower === 'bmp') return 'image/bmp';
  if (lower === 'svg') return 'image/svg+xml';
  if (lower === 'mp4') return 'video/mp4';
  if (lower === 'mov') return 'video/quicktime';
  if (lower === 'webm') return 'video/webm';
  if (lower === 'avi') return 'video/x-msvideo';
  if (lower === 'mkv') return 'video/x-matroska';
  return mediaType === 'video' ? 'video/mp4' : 'image/jpeg';
}

function buildStorageKey({
  taskId,
  mediaType,
  index,
  ext,
  provider,
}: {
  taskId: string;
  mediaType: PersistMediaType;
  index: number;
  ext: string;
  provider?: string;
}) {
  const date = new Date();
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const safeProvider = (provider || 'wavespeed').replace(/[^a-z0-9-_]/gi, '-');
  const random = Math.random().toString(36).slice(2, 10);
  return `ai-${mediaType}-${safeProvider}-${yyyy}${mm}${dd}-${taskId}-${index}-${random}.${ext}`;
}

export async function persistExternalMediaUrls(
  options: PersistOptions
): Promise<PersistResult> {
  const sourceUrls = Array.from(
    new Set((options.urls || []).filter((url) => typeof url === 'string' && url.startsWith('http')))
  );
  if (sourceUrls.length === 0) {
    return { urls: [], persistedCount: 0, skippedCount: 0, errors: [] };
  }

  let storage = null as Awaited<ReturnType<typeof getStorageService>> | null;
  try {
    storage = await getStorageService();
  } catch (error: any) {
    return {
      urls: sourceUrls,
      persistedCount: 0,
      skippedCount: sourceUrls.length,
      errors: [String(error?.message || error)],
    };
  }

  if (!storage || storage.getProviderNames().length === 0) {
    return {
      urls: sourceUrls,
      persistedCount: 0,
      skippedCount: sourceUrls.length,
      errors: ['No storage provider configured'],
    };
  }

  const resultUrls: string[] = [];
  const errors: string[] = [];
  let persistedCount = 0;
  let skippedCount = 0;

  for (let index = 0; index < sourceUrls.length; index += 1) {
    const sourceUrl = sourceUrls[index];
    if (!isLikelyWaveSpeedTemporaryUrl(sourceUrl)) {
      resultUrls.push(sourceUrl);
      skippedCount += 1;
      continue;
    }

    const ext = guessExtension(sourceUrl, options.mediaType);
    const key = buildStorageKey({
      taskId: options.taskId,
      mediaType: options.mediaType,
      index,
      ext,
      provider: options.provider,
    });

    try {
      const uploaded = await storage.downloadAndUpload({
        url: sourceUrl,
        key,
        contentType: guessContentType(ext, options.mediaType),
        disposition: 'inline',
      });

      if (uploaded.success && uploaded.url) {
        resultUrls.push(uploaded.url);
        persistedCount += 1;
      } else {
        resultUrls.push(sourceUrl);
        errors.push(uploaded.error || `Failed to persist url: ${sourceUrl}`);
      }
    } catch (error: any) {
      resultUrls.push(sourceUrl);
      errors.push(String(error?.message || error));
    }
  }

  return {
    urls: resultUrls,
    persistedCount,
    skippedCount,
    errors,
  };
}
