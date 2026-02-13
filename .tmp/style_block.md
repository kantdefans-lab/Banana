# Style Constraint Block

Use this block before generating rewrites from source_text.

## Context
- Corpus path: C:\Users\86136\Desktop\文风改写库\陈冠初日常
- Document count: 1
- Source file counts: {'pdf': 0, 'docx': 0, 'doc': 0, 'txt': 1}
- Style profile version: 1.1.1
- Style consistency score: 0.559
- Requested task: expand
- Requested fidelity: high
- Effective fidelity: high

## Non-Negotiables
- Follow the input language of source_text.
- Keep named entities, numbers, and key facts unchanged unless explicitly instructed.
- Do not fabricate new factual claims.
- If task is expand/hybrid, expand only by adding structure and reasoning links.
- Keep terminology consistent with focus_terms and banned_terms constraints.

## Task Guidance
- Expand with transitions, framing, and explanatory layers without adding unsupported facts.
- Apply aggressive style mimicry, but never change factual claims or required terms.

## Style Anchors
- Dominant language: zh
- Sentence avg tokens: 89.906
- Sentence p90 tokens: 197.0
- Long sentence ratio: 0.688
- Avg paragraphs per doc: 12.0
- Avg sentences per paragraph: 2.667
- Heading line ratio: 0.025

### Frequent Tone Markers
- 可能 [hedging]
- 或许 [hedging]

### Preferred Terms
- 我爱着, 我真的很难过, ono, 逛啊逛, 写给我可爱的小咪, 寒潮过后, 我们来看苏州的第一场雪, 然现在没雪, 但冷是真的冷, 我的手痛得不行, 首先, 我要再再再再次郑重其事的说一句

### Rhetorical Moves
- problem_solution: 0
- comparison: 5
- stepwise: 1
- evidence: 0
- call_to_action: 0

## Avoid Patterns
- Do not introduce facts that are not supported by source_text.
- Do not copy long verbatim corpus sentences; mimic style instead of copying.
- Do not change named entities, numbers, or key terms without explicit request.
- Avoid chaining too many clauses in one sentence.

## Evidence Samples
- "首先，我要再再再再次郑重其事的说一句"
- "小斗睡醒了，小斗要上厕所。"
- "臭咪我又想哭了，哦对马上可以见到柚子了，快到了，小斗不写了。"
- "##小春，你好哇！突然想给你写一封情书，不知道小春以前有没有收到过。这是老公给你的第一封信咯。"
- "好爱你，真的。想到一段话 我爱着，什么都不说。我爱着，只有心里知觉。"

## Output Contract
Return exactly three sections:
1. Version A (Conservative)
2. Version B (Enhanced)
3. Style Delta (3-6 bullets explaining differences)

## Quality Gate
- Verify semantic equivalence with source_text before returning.
- Verify Version A and Version B differ in style intensity.
- Verify language consistency with source_text.
- Verify no banned_terms appear.