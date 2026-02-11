import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // 1. 获取并解码 URL
  const urlParam = request.nextUrl.searchParams.get('url');

  if (!urlParam) {
    return new NextResponse(JSON.stringify({ error: 'Missing URL parameter' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 解码 URL (防止二次编码问题)
  const targetUrl = decodeURIComponent(urlParam);
  console.log(`📥 [Proxy] 正在下载图片: ${targetUrl}`);

  try {
    // 2. 后端去请求外部图片
    // 关键修改：添加 User-Agent 伪装成浏览器，防止 403 Forbidden
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      }
    });

    if (!response.ok) {
      console.error(`❌ [Proxy] 远程服务器拒绝: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    // 3. 获取图片数据
    const blob = await response.blob();
    const contentType = response.headers.get('content-type') || 'image/png';
    const contentLength = response.headers.get('content-length');
    
    console.log(`✅ [Proxy] 下载成功, 大小: ${blob.size} 字节, 类型: ${contentType}`);

    // 4. 设置响应头
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Disposition', `attachment; filename="ai-generated-${Date.now()}.${contentType.split('/')[1] || 'png'}"`);
    if (contentLength) {
      headers.set('Content-Length', contentLength);
    }

    // 5. 返回图片流
    return new NextResponse(blob, { headers });

  } catch (error: any) {
    console.error('❌ [Proxy] 内部错误:', error);
    return new NextResponse(JSON.stringify({ error: `Error fetching image: ${error.message}` }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}