# Style Constraint Block

Use this block before generating rewrites from source_text.

## Context
- Corpus path: C:\Users\86136\Desktop\新建文件夹 (2)
- Document count: 1
- Source file counts: {'pdf': 0, 'docx': 0, 'doc': 1}
- Style profile version: 1.1.0
- Style consistency score: 0.0
- Requested task: expand
- Requested fidelity: medium-high
- Effective fidelity: light

## Non-Negotiables
- Follow the input language of source_text.
- Keep named entities, numbers, and key facts unchanged unless explicitly instructed.
- Do not fabricate new factual claims.
- If task is expand/hybrid, expand only by adding structure and reasoning links.
- Keep terminology consistent with focus_terms and banned_terms constraints.

## Task Guidance
- Expand with transitions, framing, and explanatory layers without adding unsupported facts.
- Apply subtle lexical and tonal adaptation; keep most sentence structure unchanged.

## Style Anchors
- Dominant language: mixed
- Sentence avg tokens: 0.0
- Sentence p90 tokens: 0.0
- Long sentence ratio: 0.0
- Avg paragraphs per doc: 0.0
- Avg sentences per paragraph: 0.0
- Heading line ratio: 0.0

### Frequent Tone Markers
- none detected

### Preferred Terms
- none detected

### Rhetorical Moves
- problem_solution: 0
- comparison: 0
- stepwise: 0
- evidence: 0
- call_to_action: 0

## Avoid Patterns
- Do not introduce facts that are not supported by source_text.
- Do not copy long verbatim corpus sentences; mimic style instead of copying.
- Do not change named entities, numbers, or key terms without explicit request.
- Avoid unstable language switching unless source_text is mixed.
- Avoid aggressive style imitation; keep adaptation conservative.

## Evidence Samples
- none

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

## Automatic Fallback Notes
- Style consistency is very low, so fidelity is reduced to light.