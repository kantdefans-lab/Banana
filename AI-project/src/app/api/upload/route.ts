import { NextRequest, NextResponse } from 'next/server';
import { AwsClient } from 'aws4fetch';

// 不要加 export const runtime = 'edge'; (保持现状)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ code: 400, message: 'No file uploaded' }, { status: 400 });
    }

    // 1. 读取并清理环境变量 (防止用户多填了空格或https前缀)
    const env = process.env;
    const accountId = (env.R2_ACCOUNT_ID || '').trim();
    const accessKeyId = (env.R2_ACCESS_KEY_ID || '').trim();
    const secretAccessKey = (env.R2_SECRET_ACCESS_KEY || '').trim();
    const bucketName = (env.R2_BUCKET_NAME || '').trim();
    const publicDomain = (env.R2_PUBLIC_DOMAIN || '').trim();

    // 🔍 调试日志：检查变量是否读取成功 (为了安全，隐去敏感信息)
    console.log('🔍 Checking Env Vars:', {
      hasAccountId: !!accountId,
      hasAccessKey: !!accessKeyId,
      hasSecret: !!secretAccessKey,
      bucketName: bucketName,
      hasDomain: !!publicDomain
    });

    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicDomain) {
      throw new Error('Missing R2 Environment Variables on Server.');
    }

    // 2. 初始化 AWS Client
    const r2 = new AwsClient({
      accessKeyId,
      secretAccessKey,
      service: 's3',
      region: 'auto',
    });

    // 3. 生成文件名和路径
    const ext = file.name.split('.').pop() || 'png';
    const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
    
    // 构造标准的 S3 API URL
    const endpoint = `https://${accountId}.r2.cloudflarestorage.com/${bucketName}/${uniqueFilename}`;
    
    console.log(`📤 Uploading to: ${endpoint}`);

    // 🛠️ 关键修复：将 File 转为 ArrayBuffer (Node环境兼容性更好)
    const fileBuffer = await file.arrayBuffer();

    // 4. 发送上传请求
    // 🛠️ 关键修复：添加 cache: 'no-store' 防止 Next.js 劫持请求
    const response = await r2.fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: fileBuffer, 
      // @ts-ignore - Next.js 特有参数，TypeScript 可能会报红，忽略即可
      cache: 'no-store', 
    });

    if (response.status !== 200) {
      const errorText = await response.text();
      console.error('❌ R2 Response:', response.status, errorText);
      throw new Error(`R2 API Error (${response.status}): ${errorText}`);
    }

    // 5. 构造返回的公开链接
    const cleanDomain = publicDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const publicUrl = `https://${cleanDomain}/${uniqueFilename}`;

    console.log('✅ Upload Success:', publicUrl);

    return NextResponse.json({ code: 0, url: publicUrl });

  } catch (error: any) {
    console.error('❌ R2 Upload Critical Error:', error);
    // 返回详细错误给前端，方便调试
    return NextResponse.json({ 
      code: 500, 
      message: `Upload failed: ${error.message}` 
    }, { status: 500 });
  }
}