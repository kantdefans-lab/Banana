import { responseSchema, type PhiloResponse } from "@/lib/validation/schemas";

const BASE_URL = process.env.AIHUBMIX_BASE_URL || "https://aihubmix.com/v1";
const API_KEY = process.env.AIHUBMIX_API_KEY;
const MODEL = process.env.AIHUBMIX_MODEL || "gpt-4o-mini";

const systemPrompt = `你是一位既有娱乐感又有半学术严谨度的哲学搭子。
必须严格输出合法 JSON，且只输出 JSON，不要额外文字。匹配时保持亲和和肯定语气。`;

const jsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    overall_summary: { type: "string" },
    matches: {
      type: "array",
      minItems: 5,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          rank: { type: "integer", minimum: 1, maximum: 5 },
          philosopher: { type: "string" },
          era: { type: "string" },
          why_you_match: { type: "string" },
          signature_traits: {
            type: "array",
            items: { type: "string" },
            minItems: 2,
            maxItems: 6,
          },
          gentle_pushback: { type: "string" },
          reading_next: {
            type: "array",
            minItems: 2,
            maxItems: 6,
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                type: { type: "string", enum: ["book", "essay", "concept", "question", "author"] },
                item: { type: "string" },
                why: { type: "string" },
              },
              required: ["type", "item", "why"],
            },
          },
        },
        required: [
          "rank",
          "philosopher",
          "era",
          "why_you_match",
          "signature_traits",
          "gentle_pushback",
          "reading_next",
        ],
      },
    },
    keywords_for_you: {
      type: "array",
      items: { type: "string" },
      minItems: 2,
      maxItems: 10,
    },
    one_sentence_takeaway: { type: "string" },
  },
  required: ["title", "overall_summary", "matches", "keywords_for_you", "one_sentence_takeaway"],
} as const;

export async function callAihubmix(inputText: string): Promise<PhiloResponse> {
  if (!API_KEY) {
    throw new Error("缺少 AIHUBMIX_API_KEY 配置");
  }

  const body = {
    model: MODEL,
    temperature: 0.7,
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `用户输入：${inputText}\n请严格输出 JSON，字段与类型必须符合提供的 JSON Schema。不要加入解释、评论或 Markdown。`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "philo_match",
        schema: jsonSchema,
        strict: true,
      },
    },
  };

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM 请求失败: ${res.status} ${text}`);
  }

  const data = await res.json();
  const content: string | undefined = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("LLM 响应为空");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("LLM 返回的不是有效 JSON");
  }

  const result = responseSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error("LLM 返回 JSON 不符合预期结构，请重试。");
  }

  return result.data;
}
