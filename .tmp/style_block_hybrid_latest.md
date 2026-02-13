# Style Constraint Block

Use this block before generating rewrites from source_text.

## Context
- Corpus path: C:\Users\86136\Desktop\新建文件夹 (2)
- Document count: 1
- Source file counts: {'pdf': 0, 'docx': 0, 'doc': 1}
- Style profile version: 1.1.1
- Style consistency score: 0.498
- Requested task: hybrid
- Requested fidelity: medium-high
- Effective fidelity: medium-high

## Non-Negotiables
- Follow the input language of source_text.
- Keep named entities, numbers, and key facts unchanged unless explicitly instructed.
- Do not fabricate new factual claims.
- If task is expand/hybrid, expand only by adding structure and reasoning links.
- Keep terminology consistent with focus_terms and banned_terms constraints.

## Task Guidance
- Polish and rewrite at the same time, with controlled expansion where it improves coherence.
- Apply clear style adaptation in diction, flow, and rhetorical moves while preserving meaning.

## Style Anchors
- Dominant language: mixed
- Sentence avg tokens: 30.866
- Sentence p90 tokens: 93.0
- Long sentence ratio: 0.125
- Avg paragraphs per doc: 39.0
- Avg sentences per paragraph: 86.795
- Heading line ratio: 0.017

### Frequent Tone Markers
- 可能 [hedging]
- 因此 [transition]
- 同时 [transition]
- 然而 [transition]
- 必须 [assertive]
- 倾向于 [hedging]
- 显然 [assertive]
- 确实 [assertive]
- 另一方面 [transition]
- 或许 [hedging]

### Preferred Terms
- social, asd, 因此, psychology, husserl, neuroscience, journal, stein, 例如, cognitive, 然而, gallese

### Rhetorical Moves
- problem_solution: 145
- comparison: 140
- stepwise: 76
- evidence: 411
- call_to_action: 23

## Avoid Patterns
- Do not introduce facts that are not supported by source_text.
- Do not copy long verbatim corpus sentences; mimic style instead of copying.
- Do not change named entities, numbers, or key terms without explicit request.
- Avoid unstable language switching unless source_text is mixed.

## Evidence Samples
- "第三编 他心问题 第三编将涉及如下主题： 1."
- "他心问题的现象学进路；"
- "他心问题的直接社会感知进路；"
- "他心问题的具身模拟进路；"
- "他心问题的内感受进路；"

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