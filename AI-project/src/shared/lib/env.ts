export const isProduction = process.env.NODE_ENV === 'production';

export const isCloudflareWorker =
  typeof globalThis !== 'undefined' && 'Cloudflare' in globalThis;

/**
 * Read environment variables across runtimes:
 * - Node.js: `process.env.NAME`
 * - Cloudflare Workers (OpenNext): bindings are available via Cloudflare context `globalThis[Symbol.for("__cloudflare-context__")].env`
 *   (some setups may also expose them on `globalThis.env`)
 */
export function getRuntimeEnv(name: string): string | undefined {
  // OpenNext Cloudflare context (preferred)
  try {
    const symbol = Symbol.for('__cloudflare-context__');
    const ctx = (globalThis as any)?.[symbol];
    const v = ctx?.env?.[name];
    if (typeof v === 'string') return v;
    if (v != null) return String(v);
  } catch {
    // ignore
  }

  // Legacy/global binding
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
