import { NextResponse } from 'next/server';
import { toNextJsHandler } from 'better-auth/next-js';

import { getAuth } from '@/core/auth';

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
