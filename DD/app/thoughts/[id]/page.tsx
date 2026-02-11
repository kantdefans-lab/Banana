import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MatchResult from "@/components/MatchResult";
import type { ThoughtRow } from "@/lib/validation/schemas";

export default async function ThoughtDetail({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return notFound();
  }

  const { data, error } = await supabase
    .from("thoughts")
    .select("id, input_text, result_json, created_at")
    .eq("id", params.id)
    .single();

  if (error || !data) {
    return notFound();
  }

  const thought = data as ThoughtRow;

  return (
    <div className="stack" style={{ gap: 16 }}>
      <h1>{(thought.result_json as any)?.title ?? "匹配详情"}</h1>
      <p className="small" style={{ whiteSpace: "pre-wrap" }}>
        原始输入：{thought.input_text}
      </p>
      <MatchResult data={thought.result_json} />
    </div>
  );
}
