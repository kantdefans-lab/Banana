import { NextResponse } from 'next/server';
import { toNextJsHandler } from 'better-auth/next-js';

import { sql } from 'drizzle-orm';
import { getRuntimeEnv } from '@/shared/lib/env';
import { db } from '@/core/db';
import { getAuth } from '@/core/auth';

async function logErrorResponse(
  label: string,
  response: Response,
  errorId?: string
) {
  if (response.status < 400) return response;
  try {
    const cloned = response.clone();
    const bodyText = await cloned.text();
    const tag = errorId ? `[Auth ${label}][${errorId}]` : `[Auth ${label}]`;
    console.error(`${tag} ${response.status} ${response.statusText} body:`, bodyText);
  } catch (e) {
    const tag = errorId ? `[Auth ${label}][${errorId}]` : `[Auth ${label}]`;
    console.error(
      `${tag} ${response.status} ${response.statusText} (failed to read body)`,
      e
    );
  }
  return response;
}

function logAuthEnvHints(request: Request, errorId?: string) {
  try {
    const hasSecret = !!(getRuntimeEnv('AUTH_SECRET') || getRuntimeEnv('BETTER_AUTH_SECRET') || process.env.AUTH_SECRET || process.env.BETTER_AUTH_SECRET);
    const hasDbUrl = !!(getRuntimeEnv('DATABASE_URL') || process.env.DATABASE_URL);
    const authUrl = getRuntimeEnv('AUTH_URL') || process.env.AUTH_URL || '';
    const appUrl = getRuntimeEnv('NEXT_PUBLIC_APP_URL') || process.env.NEXT_PUBLIC_APP_URL || '';
    const tag = errorId ? '[Auth env][' + errorId + ']' : '[Auth env]';
    console.error(tag, {
      path: new URL(request.url).pathname,
      hasSecret,
      hasDbUrl,
      authUrl,
      appUrl,
    });
  } catch {
    // ignore
  }
}

async function logDbDiagnostics(errorId?: string) {
  // Only run when explicitly enabled (can be noisy and may add latency).
  if (getRuntimeEnv('AUTH_DEBUG') !== 'true') {
    return;
  }

  try {
    const result = await Promise.race([
      (async () => {
        const ping = await db().execute(sql`select 1 as ok`);
        const regSession = await db().execute(
          sql`select to_regclass('public.session') as public_session, to_regclass('session') as session`
        );
        const searchPath = await db().execute(sql`show search_path`);
        return { ping, regSession, searchPath };
      })(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('db diagnostics timeout')), 9000)
      ),
    ]);

    const tag = errorId ? '[Auth db][' + errorId + ']' : '[Auth db]';
    console.error(tag, result);
  } catch (e: any) {
    const tag = errorId ? '[Auth db][' + errorId + ']' : '[Auth db]';
    console.error(`${tag} failed:`, e?.message || e);
  }
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string' && error) {
    return error;
  }

  return 'Unknown error';
}

function createAuthErrorId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function getAuthErrorHint(message: string) {
  if (/HYPERDRIVE binding|ALLOW_DIRECT_DB_IN_WORKERS|direct database access is disabled/i.test(message)) {
    return 'Set ALLOW_DIRECT_DB_IN_WORKERS=true for direct Postgres, or bind HYPERDRIVE in Cloudflare.';
  }

  if (/DATABASE_URL is not set/i.test(message)) {
    return 'Set DATABASE_URL in Cloudflare Worker runtime variables for preview and production.';
  }

  if (
    /BETTER_AUTH_SECRET is missing|default secret|Invalid BETTER_AUTH_SECRET/i.test(
      message
    )
  ) {
    return 'Set AUTH_SECRET (or BETTER_AUTH_SECRET) as a 32+ character secret in Cloudflare secrets.';
  }

  if (/trusted origin|base url could not be determined|callbacks and redirects/i.test(message)) {
    return 'Set AUTH_URL to your production origin and redeploy.';
  }

  if (/timeout after/i.test(message)) {
    return 'Auth request timed out. Verify DATABASE_URL reachability or switch to Hyperdrive.';
  }

  return undefined;
}

function withErrorIdHeader(response: Response, errorId: string) {
  const headers = new Headers(response.headers);
  headers.set('x-auth-error-id', errorId);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function getAuthHandlerTimeoutMs() {
  const raw =
    getRuntimeEnv('AUTH_HANDLER_TIMEOUT_MS') ||
    process.env.AUTH_HANDLER_TIMEOUT_MS ||
    '12000';
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 12000;
  }

  return parsed;
}

async function withTimeout<T>(promise: Promise<T>, label: string) {
  const timeoutMs = getAuthHandlerTimeoutMs();
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`${label} timeout after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuth();
    const handler = toNextJsHandler(auth.handler);
    const resp = await withTimeout(handler.POST(request), 'Auth POST');
    if (resp.status >= 500) {
      const errorId = createAuthErrorId();
      logAuthEnvHints(request, errorId);
      await logDbDiagnostics(errorId);
      const loggedResponse = await logErrorResponse('POST', resp, errorId);
      return withErrorIdHeader(loggedResponse, errorId);
    }
    return await logErrorResponse('POST', resp);
  } catch (error: any) {
    const errorId = createAuthErrorId();
    console.error(`[Auth POST][${errorId}] error:`, error);
    logAuthEnvHints(request, errorId);
    await logDbDiagnostics(errorId);

    const message = getErrorMessage(error);
    const hint = getAuthErrorHint(message);
    const isTimeout = /timeout after/i.test(message);
    return NextResponse.json(
      { code: 1, message, hint, errorId },
      {
        status: isTimeout ? 504 : 500,
        headers: { 'x-auth-error-id': errorId },
      }
    );
  }
}

export async function GET(request: Request) {
  try {
    const auth = await getAuth();
    const handler = toNextJsHandler(auth.handler);
    const resp = await withTimeout(handler.GET(request), 'Auth GET');
    if (resp.status >= 500) {
      const errorId = createAuthErrorId();
      logAuthEnvHints(request, errorId);
      await logDbDiagnostics(errorId);
      const loggedResponse = await logErrorResponse('GET', resp, errorId);
      return withErrorIdHeader(loggedResponse, errorId);
    }
    return await logErrorResponse('GET', resp);
  } catch (error: any) {
    const errorId = createAuthErrorId();
    console.error(`[Auth GET][${errorId}] error:`, error);
    logAuthEnvHints(request, errorId);
    await logDbDiagnostics(errorId);

    const message = getErrorMessage(error);
    const hint = getAuthErrorHint(message);
    const isTimeout = /timeout after/i.test(message);

    return NextResponse.json(
      { code: 1, message, hint, errorId },
      {
        status: isTimeout ? 504 : 500,
        headers: { 'x-auth-error-id': errorId },
      }
    );
  }
}
