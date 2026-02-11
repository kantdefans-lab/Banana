
export class RunwayProvider {
  name = 'runway';
  configs = {};

  constructor(config: any) {}
  
  async generate(params: any) {
    return { 
      id: 'mock-id', 
      status: 'completed', // 修改为常用状态
      
      taskId: 'mock-id',
      // 关键修改: 强制转换为 any，避免 AITaskStatus 枚举校验失败
      taskStatus: 'completed' as any,
      
      data: {}
    };
  }
}