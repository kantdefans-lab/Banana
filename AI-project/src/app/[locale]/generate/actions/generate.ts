'use server';

// 允许接收任意参数
export async function generateImage(params: any) {
  console.log('Mock generating image:', params);
  
  return {
    code: 0,
    success: true,
    message: 'Success',
    data: {
      id: 'mock-task-123',      // ✅ 页面使用的是 result.data.id
      taskId: 'mock-task-123',  // 保留 taskId 以防万一
      costCredits: 10,
      status: 'queued'
    }
  };
}

export async function queryTaskStatus(taskId: string) {
  return { 
    code: 0,
    data: {
      status: 'completed',
      imageUrl: 'https://placehold.co/600x400'
    }
  };
}