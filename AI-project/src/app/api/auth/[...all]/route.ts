import { NextResponse } from 'next/server';
import { toNextJsHandler } from 'better-auth/next-js';

import { getAuth } from '@/core/auth';
import { getRuntimeEnv } from '@/shared/lib/env';

function summarizeUrl(value?: string | null) {
  if (!value) return { valid: false };
  try {
    const url = new URL(value);
    return {
      valid: true,
      protocol: url.protocol,
      host: url.host,
      pathname: url.pathname,
    };
  } catch {
    return { valid: false };
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuth();
    const handler = toNextJsHandler(auth.handler);
    return handler.POST(request);
  } catch (error: any) {
    console.error('Auth POST error:', error);
    return NextResponse.json(
      { code: 1, message: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get('debug') === '1') {
    const authUrl =
      getRuntimeEnv('AUTH_URL') || getRuntimeEnv('NEXT_PUBLIC_APP_URL') || '';
    const authSecret =
      getRuntimeEnv('AUTH_SECRET') || getRuntimeEnv('BETTER_AUTH_SECRET') || '';
    const databaseUrl = getRuntimeEnv('DATABASE_URL') || '';

    return NextResponse.json({
      code: 0,
      message: 'debug',
      data: {
        authUrl: summarizeUrl(authUrl),
        authSecretPresent: !!authSecret,
        databaseUrl: summarizeUrl(databaseUrl),
        databaseUrlPresent: !!databaseUrl,
      },
    });
  }

  try {
    const auth = await getAuth();
    const handler = toNextJsHandler(auth.handler);
    return handler.GET(request);
  } catch (error: any) {
    console.error('Auth GET error:', error);
    return NextResponse.json(
      { code: 1, message: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
