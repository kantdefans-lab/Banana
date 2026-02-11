import { AwsClient } from 'aws4fetch';
import { config as loadDotenv } from 'dotenv';

loadDotenv({ path: '.env.local', override: false });
loadDotenv({ path: '.env', override: false });

type CheckResult = {
  ok: boolean;
  missing: string[];
  details: Record<string, string>;
};

function resolveEnv() {
  const accountId = (process.env.R2_ACCOUNT_ID || '').trim();
  const accessKeyId = (
    process.env.R2_ACCESS_KEY_ID ||
    process.env.R2_ACCESS_KEY ||
    ''
  ).trim();
  const secretAccessKey = (
    process.env.R2_SECRET_ACCESS_KEY ||
    process.env.R2_SECRET_KEY ||
    ''
  ).trim();
  const bucketName = (process.env.R2_BUCKET_NAME || '').trim();
  const publicDomain = (
    process.env.R2_PUBLIC_DOMAIN ||
    process.env.R2_DOMAIN ||
    ''
  )
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '');

  return { accountId, accessKeyId, secretAccessKey, bucketName, publicDomain };
}

function validateEnv(): CheckResult {
  const env = resolveEnv();
  const checks: Record<string, string> = {
    R2_ACCOUNT_ID: env.accountId ? 'SET' : 'MISSING',
    R2_ACCESS_KEY_ID_or_R2_ACCESS_KEY: env.accessKeyId ? 'SET' : 'MISSING',
    R2_SECRET_ACCESS_KEY_or_R2_SECRET_KEY: env.secretAccessKey ? 'SET' : 'MISSING',
    R2_BUCKET_NAME: env.bucketName ? 'SET' : 'MISSING',
    R2_PUBLIC_DOMAIN_or_R2_DOMAIN: env.publicDomain ? 'SET' : 'MISSING',
  };

  const missing = Object.entries(checks)
    .filter(([, state]) => state !== 'SET')
    .map(([key]) => key);

  return {
    ok: missing.length === 0,
    missing,
    details: checks,
  };
}

async function verifyUpload() {
  const env = resolveEnv();
  const key = `uploads/debug/verify-${Date.now()}.txt`;
  const endpoint = `https://${env.accountId}.r2.cloudflarestorage.com/${env.bucketName}/${key}`;
  const publicUrl = `https://${env.publicDomain}/${key}`;

  const client = new AwsClient({
    accessKeyId: env.accessKeyId,
    secretAccessKey: env.secretAccessKey,
    service: 's3',
    region: 'auto',
  });

  const put = await client.fetch(endpoint, {
    method: 'PUT',
    headers: { 'Content-Type': 'text/plain' },
    body: `verify-r2 ${new Date().toISOString()}`,
  });

  const head = await fetch(publicUrl, { method: 'HEAD' });

  return {
    key,
    endpoint,
    publicUrl,
    putStatus: put.status,
    publicHeadStatus: head.status,
  };
}

async function main() {
  const check = validateEnv();
  console.log('R2 env check:', check.details);
  if (!check.ok) {
    console.error('Missing required R2 env vars:', check.missing.join(', '));
    process.exit(1);
  }

  const result = await verifyUpload();
  console.log('R2 probe result:', result);

  if (result.putStatus !== 200) {
    console.error('R2 PUT failed, expected status 200');
    process.exit(1);
  }

  if (result.publicHeadStatus >= 400) {
    console.error('R2 public URL not reachable');
    process.exit(1);
  }

  console.log('R2 verification passed.');
}

main().catch((error) => {
  console.error('R2 verification failed:', error?.message || error);
  process.exit(1);
});
