"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

interface Props {
  mode: "login" | "signup";
}

export default function AuthForm({ mode }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }
      router.replace("/");
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? "发生错误，请稍后再试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="card stack" onSubmit={handleSubmit} style={{ maxWidth: 420, margin: "0 auto" }}>
      <h2>{mode === "signup" ? "注册" : "登录"}</h2>
      <label className="input-label">
        <span>邮箱</span>
      </label>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{
          padding: "12px",
          borderRadius: 12,
          border: "1px solid var(--border)",
          background: "var(--card)",
          color: "var(--text)",
        }}
      />
      <label className="input-label">
        <span>密码</span>
      </label>
      <input
        type="password"
        required
        minLength={6}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{
          padding: "12px",
          borderRadius: 12,
          border: "1px solid var(--border)",
          background: "var(--card)",
          color: "var(--text)",
        }}
      />
      {error && <p style={{ color: "#f87171", margin: 0 }}>{error}</p>}
      <button className="btn" type="submit" disabled={loading}>
        {loading ? "处理中..." : mode === "signup" ? "注册" : "登录"}
      </button>
    </form>
  );
}
