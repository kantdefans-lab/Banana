import type { PhiloResponse } from "@/lib/validation/schemas";

export default function MatchResult({ data }: { data: PhiloResponse }) {
  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="card stack">
        <h2>{data.title}</h2>
        <p style={{ margin: 0 }}>{data.overall_summary}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {data.keywords_for_you.map((k) => (
            <span key={k} className="badge">#{k}</span>
          ))}
        </div>
      </div>
      <div className="grid">
        {data.matches.map((match) => (
          <div key={match.rank} className="card stack" style={{ gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="badge">TOP {match.rank}</span>
              <span style={{ fontWeight: 700 }}>{match.philosopher}</span>
            </div>
            <div className="small" style={{ color: "var(--muted)" }}>{match.era}</div>
            <p style={{ margin: 0 }}>{match.why_you_match}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {match.signature_traits.map((t) => (
                <span key={t} className="badge">{t}</span>
              ))}
            </div>
            <div className="card" style={{ background: "rgba(255,255,255,0.02)", borderStyle: "dashed" }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>温和提醒</div>
              <p style={{ margin: 0 }}>{match.gentle_pushback}</p>
            </div>
            <div className="stack">
              <div style={{ fontWeight: 700 }}>延伸阅读</div>
              <ul className="list-reset stack">
                {match.reading_next.map((r, idx) => (
                  <li key={idx} className="small">
                    <span className="badge" style={{ textTransform: "uppercase" }}>{r.type}</span> {r.item} — {r.why}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
      <div className="card">
        <strong>一句收束：</strong> {data.one_sentence_takeaway}
      </div>
    </div>
  );
}
