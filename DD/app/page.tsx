import ThoughtForm from "@/components/ThoughtForm";

export default function Page() {
  return (
    <div className="stack" style={{ gap: 24 }}>
      <div className="stack">
        <h1>哲学小思考 → 匹配哲学家</h1>
        <p className="small">
          输入 20-4000 字的灵光碎片，AI 会生成最贴近你气质的 5 位哲学家榜单。结果会自动保存，之后可在「历史记录」查看。
        </p>
      </div>
      <ThoughtForm />
    </div>
  );
}
