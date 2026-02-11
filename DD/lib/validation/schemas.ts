import { z } from "zod";

export const inputSchema = z.object({
  inputText: z
    .string()
    .trim()
    .min(20, "至少 20 字")
    .max(4000, "最多 4000 字"),
});

const readingNextSchema = z.object({
  type: z.enum(["book", "essay", "concept", "question", "author"]),
  item: z.string().min(1),
  why: z.string().min(1),
});

const matchSchema = z.object({
  rank: z.number().int().min(1).max(5),
  philosopher: z.string().min(1),
  era: z.string().min(1),
  why_you_match: z.string().min(1),
  signature_traits: z.array(z.string().min(1)).min(2).max(6),
  gentle_pushback: z.string().min(1),
  reading_next: z.array(readingNextSchema).min(2).max(6),
});

export const responseSchema = z.object({
  title: z.string().min(1),
  overall_summary: z.string().min(1),
  matches: z.array(matchSchema).length(5),
  keywords_for_you: z.array(z.string().min(1)).min(2).max(10),
  one_sentence_takeaway: z.string().min(1),
});

export type PhiloResponse = z.infer<typeof responseSchema>;
export type PhiloMatch = z.infer<typeof matchSchema>;
export type ReadingNext = z.infer<typeof readingNextSchema>;

export interface ThoughtRow {
  id: string;
  user_id: string;
  input_text: string;
  result_json: PhiloResponse;
  created_at: string;
}
