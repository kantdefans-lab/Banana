import dotenv from 'dotenv';

import {
  extractMediaUrls,
  getTask,
  listModels,
  mapStatus,
  submitTask,
} from '@/shared/lib/wavespeed';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env: ${name}`);
  }
  return value;
}

async function run() {
  const apiKey = requireEnv('WAVESPEED_API_KEY');
  const mode = (process.argv[2] || 'models').toLowerCase();

  if (mode === 'models') {
    const models = await listModels({ apiKey });
    console.log('count', models.length);
    console.log(models.slice(0, 50).map((m) => m.model_id || m.id));
    return;
  }

  if (mode === 'submit') {
    const modelId = requireEnv('WS_MODEL_ID');
    const prompt = process.env.WS_PROMPT || 'test: a cute cat, high detail';
    const result = await submitTask({
      apiKey,
      requestedModelId: modelId,
      params: { prompt },
    });
    console.log('taskId', result.taskId);
    return;
  }

  if (mode === 'poll') {
    const taskId = requireEnv('WS_TASK_ID');
    for (let i = 0; i < 60; i++) {
      const result = await getTask({ apiKey, taskId });
      const status = mapStatus(
        result.task?.status ||
          result.raw?.status ||
          result.task?.state ||
          result.raw?.state
      );
      const media = extractMediaUrls(result.raw);
      console.log(
        i,
        status,
        media.imageUrls[0] || media.videoUrls[0] || ''
      );
      if (status === 'success' || status === 'failed') {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
    return;
  }

  throw new Error(`Unknown mode: ${mode}`);
}

run().catch((error) => {
  console.error(error?.message || String(error));
  process.exit(1);
});

