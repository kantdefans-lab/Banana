import { AIManager, GeminiProvider, KieProvider, ReplicateProvider } from '@/extensions/ai';
import { RunwayProvider } from '@/extensions/ai/runway'; // 添加这行导入
import { Configs, getAllConfigs } from '@/shared/models/config';

export function getAIManagerWithConfigs(configs: Configs) {
  const aiManager = new AIManager();

  console.log('🔄 开始初始化 AI Manager...');
  console.log('📋 配置检查:', {
    kie_api_key: configs.kie_api_key ? '已设置' : '未设置',
    replicate_api_token: configs.replicate_api_token ? '已设置' : '未设置', 
    gemini_api_key: configs.gemini_api_key ? '已设置' : '未设置',
    runway_api_token: configs.runway_api_token ? '已设置' : '未设置' // 添加这行
  });

  if (configs.kie_api_key) {
    console.log('✅ 正在注册 KieProvider...');
    try {
      const kieProvider = new KieProvider({
        apiKey: configs.kie_api_key,
        callbackUrl: ''
      });
      aiManager.addProvider(kieProvider, 'kie' as any);
      console.log('✅ KieProvider 注册成功为: kie');
    } catch (error) {
      console.error('❌ KieProvider 注册失败:', error);
    }
  } else {
    console.log('❌ 缺少 kie_api_key 配置');
  }

  if (configs.replicate_api_token) {
    console.log('✅ 正在注册 ReplicateProvider...');
    try {
      const replicateProvider = new ReplicateProvider({
        apiToken: configs.replicate_api_token,
      });
      aiManager.addProvider(replicateProvider, 'replicate' as any);
      console.log('✅ ReplicateProvider 注册成功为: replicate');
    } catch (error) {
      console.error('❌ ReplicateProvider 注册失败:', error);
    }
  }

  if (configs.gemini_api_key) {
    console.log('✅ 正在注册 GeminiProvider...');
    try {
      const geminiProvider = new GeminiProvider({
        apiKey: configs.gemini_api_key,
      });
      aiManager.addProvider(geminiProvider, 'gemini' as any);
      console.log('✅ GeminiProvider 注册成功为: gemini');
    } catch (error) {
      console.error('❌ GeminiProvider 注册失败:', error);
    }
  }

  // 🔥 添加 Runway Provider 注册
  if (configs.runway_api_token) {
    console.log('✅ 正在注册 RunwayProvider...');
    try {
      const runwayProvider = new RunwayProvider({
        apiKey: configs.runway_api_token,
      });
      aiManager.addProvider(runwayProvider, 'runway' as any);
      console.log('✅ RunwayProvider 注册成功为: runway');
    } catch (error) {
      console.error('❌ RunwayProvider 注册失败:', error);
    }
  } else {
    console.log('❌ 缺少 runway_api_token 配置');
  }

  let providerNames: any[] = [];
  if (aiManager.getProviderNames) {
    providerNames = aiManager.getProviderNames();
  }
  console.log(`📋 AI Manager 初始化完成，可用的 providers: ${providerNames.join(', ') || '无'}`);

  return aiManager;
}

let aiService: AIManager | null = null;

export async function getAIService(): Promise<AIManager> {
  console.log('🔄 调用 getAIService()...');
  if (!aiService) {
    console.log('🔄 首次初始化 AI Service...');
    const configs = await getAllConfigs();
    console.log('📋 从数据库获取配置完成');
    aiService = getAIManagerWithConfigs(configs);
  } else {
    console.log('📋 使用缓存的 AI Service');
  }
  return aiService;
}