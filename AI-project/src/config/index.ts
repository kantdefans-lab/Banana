import packageJson from '../../package.json';
import { getRuntimeEnv } from '@/shared/lib/env';

// Load .env files for scripts (tsx/ts-node) - but NOT in Edge Runtime or browser
// This ensures scripts can read DATABASE_URL and other env vars
// Check for real Node.js environment by looking at global 'process' properties
if (
  typeof process !== 'undefined' &&
  typeof process.cwd === 'function' &&
  !process.env.NEXT_RUNTIME // Skip if in Next.js runtime (already loaded)
) {
  try {
    const dotenv = require('dotenv');
    dotenv.config({ path: '.env.development' });
    dotenv.config({ path: '.env', override: false });
  } catch (e) {
    // Silently fail - dotenv might not be available in some environments
  }
}

export type ConfigMap = Record<string, string>;

function getEnvValue(...keys: string[]) {
  for (const key of keys) {
    const processValue = process.env[key];
    if (processValue) {
      return processValue;
    }

    const runtimeValue = getRuntimeEnv(key);
    if (runtimeValue) {
      return runtimeValue;
    }
  }

  return '';
}

function normalizeUrl(url: string) {
  return url.trim().replace(/\/+$/, '');
}

function isLocalhostUrl(url: string) {
  try {
    const host = new URL(url).hostname;
    return (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host === '[::1]'
    );
  } catch {
    return false;
  }
}

const appUrl = normalizeUrl(
  getEnvValue('NEXT_PUBLIC_APP_URL', 'APP_URL', 'AUTH_URL') ||
    'http://localhost:3000'
);
const configuredAuthUrl = normalizeUrl(
  getEnvValue('AUTH_URL', 'BETTER_AUTH_URL')
);
// Avoid production auth failures caused by accidentally deploying with localhost auth URL.
const authUrl =
  process.env.NODE_ENV === 'production' && isLocalhostUrl(configuredAuthUrl)
    ? ''
    : configuredAuthUrl;

export const envConfigs = {
  app_url: appUrl,
  app_name: getEnvValue('NEXT_PUBLIC_APP_NAME') || 'ShipAny App',
  theme: getEnvValue('NEXT_PUBLIC_THEME') || 'default',
  appearance: getEnvValue('NEXT_PUBLIC_APPEARANCE') || 'system',
  locale: getEnvValue('NEXT_PUBLIC_DEFAULT_LOCALE') || 'en',
  database_url: getEnvValue('DATABASE_URL'),
  database_provider: getEnvValue('DATABASE_PROVIDER') || 'postgresql',
  db_singleton_enabled: getEnvValue('DB_SINGLETON_ENABLED') || 'false',
  db_max_connections: getEnvValue('DB_MAX_CONNECTIONS') || '1',
  auth_url: authUrl,
  // better-auth error messages mention BETTER_AUTH_SECRET; accept both.
  auth_secret: getEnvValue('BETTER_AUTH_SECRET', 'AUTH_SECRET'), // openssl rand -base64 32
  version: packageJson.version,
};
