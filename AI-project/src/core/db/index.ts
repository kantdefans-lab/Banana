import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { envConfigs } from '@/config';
import { getRuntimeEnv, isCloudflareWorker } from '@/shared/lib/env';

// Global database connection instance (singleton pattern)
let dbInstance: ReturnType<typeof drizzle> | null = null;
let client: ReturnType<typeof postgres> | null = null;
let hasLoggedWorkerSingletonWarning = false;

function shouldUseSsl(databaseUrl: string) {
  try {
    const { hostname } = new URL(databaseUrl);
    const isLocalHost =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname === '[::1]';

    return !isLocalHost;
  } catch {
    return true;
  }
}

function getSslConfig(databaseUrl: string) {
  if (!shouldUseSsl(databaseUrl)) {
    return undefined;
  }

  // Supabase/managed Postgres often requires SSL; in edge runtimes,
  // rejecting unauthorized can fail due to missing CA chain.
  return { rejectUnauthorized: false } as const;
}

export function db() {
  let databaseUrl = envConfigs.database_url;

  let isHyperdrive = false;
  let allowDirectDbInWorkers = false;

  if (isCloudflareWorker) {
    // OpenNext exposes bindings on Cloudflare context: globalThis[Symbol.for("__cloudflare-context__")].env
    const symbol = Symbol.for('__cloudflare-context__');
    const ctx: any = (globalThis as any)?.[symbol];
    const env: any =
      ctx?.env || ((typeof globalThis !== 'undefined' && (globalThis as any).env) || {});
    // Detect if set Hyperdrive
    isHyperdrive = 'HYPERDRIVE' in env;
    allowDirectDbInWorkers = getRuntimeEnv('ALLOW_DIRECT_DB_IN_WORKERS') === 'true';

    if (isHyperdrive) {
      const hyperdrive = env.HYPERDRIVE;
      databaseUrl = hyperdrive.connectionString;
      console.log('using Hyperdrive connection');
    } else if (!allowDirectDbInWorkers) {
      // Direct TCP connections to Postgres are unreliable/not supported in Workers without Hyperdrive.
      // Fail fast with a clear message so deploys don't silently 500 on auth/session queries.
      throw new Error(
        'Cloudflare Workers requires a Hyperdrive binding (HYPERDRIVE) for Postgres access. ' +
          'Create a Hyperdrive instance and bind it to this Worker, or set ALLOW_DIRECT_DB_IN_WORKERS=true (not recommended for production).'
      );
    }
  }

  if (!databaseUrl) {
    if (isCloudflareWorker) {
      throw new Error(
        'DATABASE_URL is not set. In Cloudflare Workers you should configure a Hyperdrive binding (HYPERDRIVE) for Postgres access.'
      );
    }

    throw new Error('DATABASE_URL is not set');
  }

  // In Cloudflare Workers, prefer singleton if enabled
  if (isCloudflareWorker) {
    const requestedSingleton = envConfigs.db_singleton_enabled === 'true';
    if (requestedSingleton && !hasLoggedWorkerSingletonWarning) {
      hasLoggedWorkerSingletonWarning = true;
      console.warn(
        '[db] DB_SINGLETON_ENABLED=true is ignored in Cloudflare Workers to avoid hanging requests.'
      );
    }

    const maxConnections = Math.max(
      1,
      Math.min(Number(envConfigs.db_max_connections) || 1, 5)
    );

    // Create short-lived clients per request in Workers.
    // Reusing singleton clients across fetch events can lead to hung requests.
    const workerClient = postgres(databaseUrl, {
      prepare: false,
      max: maxConnections,
      idle_timeout: 5,
      max_lifetime: 30,
      // Fail fast in Workers to avoid hung fetch events.
      connect_timeout: 5,
      ssl: getSslConfig(databaseUrl),
    });

    return drizzle({ client: workerClient });
  }

  // Singleton mode: reuse existing connection (good for traditional servers and serverless warm starts)
  if (envConfigs.db_singleton_enabled === 'true') {
    // Return existing instance if already initialized
    if (dbInstance) {
      return dbInstance;
    }

    // Create connection pool only once
    client = postgres(databaseUrl, {
      prepare: false,
      max: Number(envConfigs.db_max_connections) || 1, // Maximum connections in pool (default 1)
      idle_timeout: 30, // Idle connection timeout (seconds)
      connect_timeout: 10, // Connection timeout (seconds)
      ssl: getSslConfig(databaseUrl),
    });

    dbInstance = drizzle({ client });
    return dbInstance;
  }

  // Non-singleton mode: create new connection each time (good for serverless)
  // In serverless, the connection will be cleaned up when the function instance is destroyed
  const serverlessClient = postgres(databaseUrl, {
    prepare: false,
    max: 1, // Use single connection in serverless
    idle_timeout: 20,
    connect_timeout: 10,
    ssl: getSslConfig(databaseUrl),
  });

  return drizzle({ client: serverlessClient });
}

// Optional: Function to close database connection (useful for testing or graceful shutdown)
// Note: Only works in singleton mode
export async function closeDb() {
  if (envConfigs.db_singleton_enabled === 'true' && client) {
    await client.end();
    client = null;
    dbInstance = null;
  }
}
