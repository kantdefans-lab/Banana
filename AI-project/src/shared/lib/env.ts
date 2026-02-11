export const isProduction = process.env.NODE_ENV === 'production';

export const isCloudflareWorker =
  typeof globalThis !== 'undefined' && 'Cloudflare' in globalThis;

/**
 * Read environment variables across runtimes:
 * - Node.js: `process.env.NAME`
 * - Cloudflare Workers (OpenNext): bindings are commonly exposed on `globalThis.env`
 */
export function getRuntimeEnv(name: string): string | undefined {
  try {
    const v = (globalThis as any)?.env?.[name];
    if (typeof v === 'string') return v;
    if (v != null) return String(v);
  } catch {
    // ignore
  }

  try {
    if (typeof process !== 'undefined' && process?.env) {
      const v = process.env[name];
      if (typeof v === 'string') return v;
    }
  } catch {
    // ignore
  }

  return undefined;
}
