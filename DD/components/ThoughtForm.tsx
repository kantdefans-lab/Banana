"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ThoughtForm() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (text.trim().length < 20 || text.trim().length > 4000) {
      setError("请输入 20-4000 字之间的内容。");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputText: text.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: "" }));
        throw new Error(data.message || "生成失败，请稍后再试。");
      }
      const data = await res.json();
      router.push(`/thoughts/${data.thoughtId}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? "生成失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="card stack" onSubmit={handleSubmit}>
      <div className="input-label">
        <span>写下你的哲学小思考</span>
        <span>{text.length}/4000</span>
      </div>
      <textarea
        placeholder="例如：最近感觉自己像在一场无尽循环的剧中，每个人都背着自己的剧本..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        minLength={20}
        maxLength={4000}
        required
      />
      {error && <p style={{ color: "#f87171", margin: 0 }}>{error}</p>}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p className="small">点击生成即表示同意将输入用于生成并存档。</p>
        <button className="btn" type="submit" disabled={loading}>
          {loading ? "生成中..." : "生成匹配"}
        </button>
      </div>
    </form>
  );
}
