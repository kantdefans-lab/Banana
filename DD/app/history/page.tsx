import Link from "next/link";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { ThoughtRow } from "@/lib/validation/schemas";

export default async function HistoryPage() {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data, error } = await supabase
    .from("thoughts")
    .select("id, created_at, result_json")
    .order("created_at", { ascending: false });

  if (error) {
    return <p className="small">加载失败，请稍后再试。</p>;
  }

  const thoughts = (data as ThoughtRow[] | null) || [];

  return (
    <div className="stack" style={{ gap: 16 }}>
      <h1>历史记录</h1>
      {thoughts.length === 0 ? (
        <p className="small">暂无记录，去主页生成一条试试吧。</p>
      ) : (
        <ul className="list-reset stack">
          {thoughts.map((item) => (
            <li key={item.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 700 }}>{(item.result_json as any)?.title ?? "哲学匹配"}</div>
                <div className="small">
                  {format(new Date(item.created_at), "PPPp", { locale: zhCN })}
                </div>
              </div>
              <Link className="btn" href={`/thoughts/${item.id}`}>
                查看详情
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
