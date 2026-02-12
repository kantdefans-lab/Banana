import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

import { getStorageService } from '@/shared/services/storage';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { code: 400, message: 'No file uploaded' },
        { status: 400 }
      );
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { code: 400, message: 'Only image uploads are supported' },
        { status: 400 }
      );
    }

    const ext = file.name.split('.').pop() || 'png';
    const key = `${Date.now()}-${uuidv4()}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const storageService = await getStorageService();
    const result = await storageService.uploadFile({
      body: buffer,
      key,
      contentType: file.type,
      disposition: 'inline',
    });

    if (!result.success || !result.url) {
      const message = result.error || 'Upload failed';
      return NextResponse.json({ code: 500, message }, { status: 500 });
    }

    return NextResponse.json({
      code: 0,
      url: result.url,
      key: result.key,
    });
  } catch (error: any) {
    const message = error?.message || 'Upload failed';
    console.error('upload image failed:', error);
    return NextResponse.json({ code: 500, message }, { status: 500 });
  }
}
