import { NextResponse } from 'next/server';
import { toNextJsHandler } from 'better-auth/next-js';

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

export async function POST(request: Request) {
  try {
    const auth = await getAuth();
    const handler = toNextJsHandler(auth.handler);
    const resp = await handler.POST(request);
    return await logErrorResponse('POST', resp);
  } catch (error: any) {
    console.error('Auth POST error:', error);
    return NextResponse.json(
      { code: 1, message: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const auth = await getAuth();
    const handler = toNextJsHandler(auth.handler);
    const resp = await handler.GET(request);
    return await logErrorResponse('GET', resp);
  } catch (error: any) {
    console.error('Auth GET error:', error);
    return NextResponse.json(
      { code: 1, message: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
