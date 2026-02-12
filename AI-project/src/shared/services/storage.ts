import { R2Provider, S3Provider, StorageManager } from '@/extensions/storage';
import { getRuntimeEnv } from '@/shared/lib/env';
import { Configs, getAllConfigs } from '@/shared/models/config';

function getEnv(...keys: string[]) {
  for (const key of keys) {
    const processValue = process.env[key];
    if (processValue) {
      return processValue.trim();
    }

    const runtimeValue = getRuntimeEnv(key);
    if (runtimeValue) {
      return runtimeValue.trim();
    }
  }

  return '';
}

/**
 * get storage service with configs
 */
export function getStorageServiceWithConfigs(configs: Configs) {
  const storageManager = new StorageManager();

  const r2AccessKey =
    getEnv('R2_ACCESS_KEY', 'R2_ACCESS_KEY_ID') || configs.r2_access_key || '';
  const r2SecretKey =
    getEnv('R2_SECRET_KEY', 'R2_SECRET_ACCESS_KEY') ||
    configs.r2_secret_key ||
    '';
  const r2BucketName = getEnv('R2_BUCKET_NAME') || configs.r2_bucket_name || '';
  // Keep uploads at bucket root unless explicitly overridden by env.
  const r2UploadPath = getEnv('R2_UPLOAD_PATH');
  const r2AccountId = getEnv('R2_ACCOUNT_ID') || configs.r2_account_id || '';
  const r2Endpoint =
    getEnv('R2_ENDPOINT') ||
    configs.r2_endpoint ||
    (r2AccountId ? `https://${r2AccountId}.r2.cloudflarestorage.com` : '');
  const r2PublicDomain =
    getEnv('R2_DOMAIN', 'R2_PUBLIC_DOMAIN') ||
    configs.r2_domain ||
    '';

  // Add R2 provider if configured
  if (r2AccessKey && r2SecretKey && r2BucketName) {
    // r2_region in settings stores the Cloudflare Account ID
    // For R2, region is typically "auto" but can be customized
    storageManager.addProvider(
      new R2Provider({
        accountId: r2AccountId,
        accessKeyId: r2AccessKey,
        secretAccessKey: r2SecretKey,
        bucket: r2BucketName,
        uploadPath: r2UploadPath,
        region: 'auto', // R2 uses "auto" as region
        endpoint: r2Endpoint, // Optional custom endpoint
        publicDomain: r2PublicDomain,
      }),
      true // Set R2 as default
    );
  }

  // Add S3 provider if configured (future support)
  if (configs.s3_access_key && configs.s3_secret_key && configs.s3_bucket) {
    storageManager.addProvider(
      new S3Provider({
        endpoint: configs.s3_endpoint,
        region: configs.s3_region,
        accessKeyId: configs.s3_access_key,
        secretAccessKey: configs.s3_secret_key,
        bucket: configs.s3_bucket,
        publicDomain: configs.s3_domain,
      })
    );
  }

  return storageManager;
}

/**
 * global storage service
 */
let storageService: StorageManager | null = null;

/**
 * get storage service instance
 */
export async function getStorageService(): Promise<StorageManager> {
  if (true) {
    const configs = await getAllConfigs();
    storageService = getStorageServiceWithConfigs(configs);
  }
  return storageService;
}
