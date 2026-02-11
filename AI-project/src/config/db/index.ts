// 文件路径: src/config/db/index.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { envConfigs } from '@/config'; 

// 1. 获取链接
const connectionString = process.env.DATABASE_URL || envConfigs.database_url;

if (!connectionString) {
  throw new Error('DATABASE_URL is missing');
}

// 打印一下 Host 确认我们连的是 Pooler 还是 DB
// (注意不要打印密码)
console.log('🔌 DB Connect:', connectionString.split('@')[1]);

const client = postgres(connectionString, { 
  // 🔥🔥🔥 核心稳健配置 🔥🔥🔥
  
  // 1. 关闭预处理 (解决 History 报错的核心)
  prepare: false, 
  
  // 2. 极致短连接 (解决 Cloudflare 僵尸连接)
  // 用完即焚，保证每次查询都是新鲜连接
  idle_timeout: 1, 
  max_lifetime: 10,
  
  // 3. 限制并发
  max: 1,
  
  // 4. SSL (必须开启)
  ssl: { rejectUnauthorized: false },

  // 5. 关键：不要禁用 fetch_types
  // 5432 Session Mode 支持自动类型获取，Auth 全靠它！
  // fetch_types: false, // <--- 删掉或注释掉这一行
  
  // 6. 连接超时
  connect_timeout: 30, 
});

export const db = drizzle(client, { schema });