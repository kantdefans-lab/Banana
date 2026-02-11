import { and, count, desc, eq, sql, or, like } from 'drizzle-orm';
import { db } from '@/core/db';
import { aiTask, credit } from '@/config/db/schema';
import { AITaskStatus } from '@/extensions/ai';
import { appendUserToResult, User } from '@/shared/models/user';
import { consumeCredits, CreditStatus } from './credit';

export type AITask = typeof aiTask.$inferSelect & {
  user?: User;
};
export type NewAITask = typeof aiTask.$inferInsert;
export type UpdateAITask = Partial<Omit<NewAITask, 'id' | 'createdAt'>>;

export async function createAITask(newAITask: NewAITask) {
  console.log('🛑 [Model] 进入 createAITask...');

  try {
    // 1. 插入任务 (无事务包裹，防止死锁)
    console.log('🛑 [Model] 1. 准备插入 ai_task 表...');
    const [taskResult] = await db().insert(aiTask).values(newAITask).returning();
    console.log(`🛑 [Model] 2. ai_task 插入成功, ID: ${taskResult.id}`);

    // 2. 扣除积分
    if (newAITask.costCredits && newAITask.costCredits > 0) {
      console.log(`🛑 [Model] 3. 准备扣除积分 (数量: ${newAITask.costCredits})...`);
      
      // --- 🌟 核心修改开始：构建详细的元数据 ---
      
      // 尝试将 options 字符串解析为对象，让 metadata 里的 JSON 更干净
      let optionsObj = {};
      try {
        if (newAITask.options && typeof newAITask.options === 'string') {
          optionsObj = JSON.parse(newAITask.options);
        } else if (typeof newAITask.options === 'object') {
          optionsObj = newAITask.options as any;
        }
      } catch (e) {
        console.warn('⚠️ Options 解析失败，将存储原始数据');
        optionsObj = { raw: newAITask.options };
      }

      // 构造详细的 metadata 对象 (完全符合你的要求)
      const richMetadata = {
        prompt_preview: newAITask.prompt,
        provider: newAITask.provider,
        model: newAITask.model,
        scene: newAITask.scene,
        media_type: newAITask.mediaType,
        timestamp: new Date().toISOString(),
        options: optionsObj,
        taskId: taskResult.id,
        type: 'ai-task' // 保持兼容性
      };

      // 构造易读的描述文本
      const description = `AI图片生成: ${newAITask.provider}/${newAITask.model}, 场景: ${newAITask.scene}`;

      // 调用扣分函数
      const consumedCredit = await consumeCredits({
        userId: newAITask.userId,
        credits: newAITask.costCredits,
        scene: newAITask.scene || 'ai_generation',
        description: description,           // ✅ 使用详细描述
        metadata: JSON.stringify(richMetadata), // ✅ 使用详细 JSON
      });
      
      // --- 🌟 核心修改结束 ---

      console.log('🛑 [Model] 4. 积分扣除成功');

      // 3. 回填 creditId 到任务表
      if (consumedCredit && consumedCredit.id) {
        taskResult.creditId = consumedCredit.id;
        await db()
          .update(aiTask)
          .set({ creditId: consumedCredit.id })
          .where(eq(aiTask.id, taskResult.id));
      }
    }

    return taskResult;

  } catch (error) {
    console.error('❌ [Model] createAITask 内部报错:', error);
    throw error;
  }
}

// 根据主键ID查找任务（UUID格式）
export async function findAITaskById(id: string) {
  const [result] = await db().select().from(aiTask).where(eq(aiTask.id, id));
  return result;
}

// 根据业务ID（taskId字段）查找任务
export async function findAITaskByTaskId(taskId: string) {
  try {
    const [result] = await db()
      .select()
      .from(aiTask)
      .where(eq(aiTask.taskId, taskId));
    return result || null;
  } catch (error) {
    console.error('findAITaskByTaskId 查询失败:', error);
    throw error;
  }
}

// 根据外部任务ID智能查找
export async function findAITaskByExternalId(externalTaskId: string) {
  try {
    // 首先尝试直接匹配 taskId 字段
    const task = await findAITaskByTaskId(externalTaskId);
    if (task) {
      return task;
    }
    
    // 如果没有直接匹配，尝试在 JSON 字段中搜索
    const tasks = await db()
      .select()
      .from(aiTask)
      .where(
        or(
          like(aiTask.taskInfo, `%${externalTaskId}%`),
          like(aiTask.taskResult, `%${externalTaskId}%`)
        )
      )
      .orderBy(desc(aiTask.createdAt))
      .limit(1);
    
    return tasks[0] || null;
  } catch (error) {
    console.error('findAITaskByExternalId 查询失败:', error);
    return null;
  }
}

// 智能查找函数（自动判断ID类型）
export async function findAITask(identifier: string) {
  if (identifier.includes('-') && identifier.length === 36) {
    return await findAITaskById(identifier);
  }
  return await findAITaskByTaskId(identifier);
}

export async function updateAITaskById(id: string, updateAITask: UpdateAITask) {
  // 更新逻辑保留事务，处理失败退款
  const result = await db().transaction(async (tx) => {
    // 如果任务失败且关联了积分记录，尝试自动退款
    if (updateAITask.status === AITaskStatus.FAILED && updateAITask.creditId) {
      console.log(`💸 [Model] 任务失败，触发自动退款流程... CreditID: ${updateAITask.creditId}`);
      try {
        const [consumedCredit] = await tx
          .select()
          .from(credit)
          .where(eq(credit.id, updateAITask.creditId));
          
        if (consumedCredit && consumedCredit.status === CreditStatus.ACTIVE) {
          const consumedItems = JSON.parse(consumedCredit.consumedDetail || '[]');
          
          // 退还余额
          await Promise.all(
            consumedItems.map((item: any) => {
              if (item && item.creditId && item.creditsConsumed > 0) {
                return tx
                  .update(credit)
                  .set({
                    remainingCredits: sql`${credit.remainingCredits} + ${item.creditsConsumed}`,
                  })
                  .where(eq(credit.id, item.creditId));
              }
            })
          );

          // 标记消费记录为已删除
          await tx
            .update(credit)
            .set({ status: CreditStatus.DELETED })
            .where(eq(credit.id, updateAITask.creditId));
            
          console.log(`✅ [Model] 退款成功`);
        }
      } catch (refundError) {
        console.error(`⚠️ [Model] 自动退款失败 (但不影响任务状态更新):`, refundError);
      }
    }

    // 更新任务状态
    const [updatedTask] = await tx
      .update(aiTask)
      .set(updateAITask)
      .where(eq(aiTask.id, id))
      .returning();

    return updatedTask;
  });

  return result;
}

export async function getAITasksCount({
  userId,
  status,
  mediaType,
  provider,
}: {
  userId?: string;
  status?: string;
  mediaType?: string;
  provider?: string;
}): Promise<number> {
  const [result] = await db()
    .select({ count: count() })
    .from(aiTask)
    .where(
      and(
        userId ? eq(aiTask.userId, userId) : undefined,
        mediaType ? eq(aiTask.mediaType, mediaType) : undefined,
        provider ? eq(aiTask.provider, provider) : undefined,
        status ? eq(aiTask.status, status) : undefined
      )
    );

  return result?.count || 0;
}

export async function getAITasks({
  userId,
  status,
  mediaType,
  provider,
  page = 1,
  limit = 30,
  getUser = false,
}: {
  userId?: string;
  status?: string;
  mediaType?: string;
  provider?: string;
  page?: number;
  limit?: number;
  getUser?: boolean;
}): Promise<AITask[]> {
  const result = await db()
    .select()
    .from(aiTask)
    .where(
      and(
        userId ? eq(aiTask.userId, userId) : undefined,
        mediaType ? eq(aiTask.mediaType, mediaType) : undefined,
        provider ? eq(aiTask.provider, provider) : undefined,
        status ? eq(aiTask.status, status) : undefined
      )
    )
    .orderBy(desc(aiTask.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);

  if (getUser) {
    return appendUserToResult(result);
  }

  return result;
}