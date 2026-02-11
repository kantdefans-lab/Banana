import { NextRequest, NextResponse } from "next/server";
import { callAihubmix } from "@/lib/llm/aihubmix";
import { createRouteClient, createServiceRoleClient } from "@/lib/supabase/server";
import { inputSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const intermediate = NextResponse.next();
  const supabase = createRouteClient(req, intermediate);

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!user) {
      return NextResponse.json({ message: "未登录" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const parsed = inputSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.errors[0]?.message ?? "输入不合法";
      return NextResponse.json({ message: first }, { status: 400 });
    }

    const inputText = parsed.data.inputText;

    const result = await callAihubmix(inputText);

    const service = createServiceRoleClient();
    const { data: inserted, error: insertError } = await service
      .from("thoughts")
      .insert({ user_id: user.id, input_text: inputText, result_json: result })
      .select("id")
      .single();

    if (insertError) {
      console.error(insertError);
      return NextResponse.json({ message: "写入数据库失败" }, { status: 500 });
    }

    const final = NextResponse.json({ thoughtId: inserted.id, result });
    intermediate.cookies.getAll().forEach((cookie) => {
      final.cookies.set(cookie);
    });
    return final;
  } catch (err: any) {
    console.error(err);
    const message = err?.message ?? "服务器错误";
    return NextResponse.json({ message }, { status: 500 });
  }
}
