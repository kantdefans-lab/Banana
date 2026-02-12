import { NextResponse } from 'next/server';
import { toNextJsHandler } from 'better-auth/next-js';

import { getRuntimeEnv } from '@/shared/lib/env';
import { getAuth } from '@/core/auth';

async function logErrorResponse(label: string, response: Response) {
  if (response.status < 400) return response;
  try {
    const cloned = response.clone();
    const bodyText = await cloned.text();
    console.error(`[Auth ${label}] ${response.status} ${response.statusText} body:`, bodyText);
  } catch (e) {
    console.error(`[Auth ${label}] ${response.status} ${response.statusText} (failed to read body)`, e);
  }
  return response;
}

function logAuthEnvHints(request: Request) {
  try {
    const hasSecret = !!(getRuntimeEnv('AUTH_SECRET') || getRuntimeEnv('BETTER_AUTH_SECRET') || process.env.AUTH_SECRET || process.env.BETTER_AUTH_SECRET);
    const hasDbUrl = !!(getRuntimeEnv('DATABASE_URL') || process.env.DATABASE_URL);
    const authUrl = getRuntimeEnv('AUTH_URL') || process.env.AUTH_URL || '';
    const appUrl = getRuntimeEnv('NEXT_PUBLIC_APP_URL') || process.env.NEXT_PUBLIC_APP_URL || '';
    console.error('[Auth env]', {
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

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string' && error) {
    return error;
  }

  return 'Unknown error';
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
    if (resp.status >= 500) logAuthEnvHints(request);
    return await logErrorResponse('POST', resp);
  } catch (error: any) {
    console.error('Auth POST error:', error);

    const message = getErrorMessage(error);
    const isTimeout = /timeout after/i.test(message);

    return NextResponse.json(
      { code: 1, message },
      { status: isTimeout ? 504 : 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const auth = await getAuth();
    const handler = toNextJsHandler(auth.handler);
    const resp = await withTimeout(handler.GET(request), 'Auth GET');
    if (resp.status >= 500) logAuthEnvHints(request);
    return await logErrorResponse('GET', resp);
  } catch (error: any) {
    console.error('Auth GET error:', error);

    const message = getErrorMessage(error);
    const isTimeout = /timeout after/i.test(message);

    return NextResponse.json(
      { code: 1, message },
      { status: isTimeout ? 504 : 500 }
    );
  }
}
