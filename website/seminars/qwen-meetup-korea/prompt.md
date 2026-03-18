Create a 60-slide PPT based on the attached `draft.md`. Total presentation time: 30 minutes, ~30 seconds per slide.

## Storyline

- Chapter order: AutoBe → Typia → Function Calling → Qwen → Closing — **do not reorder, merge, or omit**
- Appendix may be omitted
- Follow the storyline of the draft, but freely reinterpret for a PPT audience — transform, don't transcribe

## Untouchable

Never abbreviate, omit, or reinterpret:

- **Code snippets & JSON blocks**: verbatim from the draft
- **`// ❌` validation annotations**: every annotation, exactly as written
- **Type definitions**: `AutoBeOpenApi.IJsonSchema`, `AutoBeTest.IExpression`, etc. — verbatim
- **Benchmark figures**: 6.75%, 0% → 100%, etc. — exact numbers

## Slide Rules

- Minimum font size **18pt** — legible from the back of the room
- **List format**, keyword-driven — no prose
- If content overflows, **split into multiple slides under the same title** — never overflow
- Code/diagrams may use the full slide without a title. Conversely, no slide with just a title and nothing else
- All code must have **VSCode-style syntax highlighting**
- Write **detailed speaker notes** for every slide — slides are keywords only, so the talk depends on the notes

## Design

Charts and diagrams in moderation. Simple but not bland. Use your judgment — will adjust via feedback.

## Audience

**Junior developers** who may know nothing about Typia or AutoBe. Briefly explain:

- **AutoBe**: what the project does
- **Compilers and ASTs**: quick primer
- **Function Calling**: what it is, why it matters
- **Typia's core mechanism**: include a TS → JS transform example — without this, Typia is incomprehensible

## Chapter-Specific Notes

### Chapter 3: Function Calling

- Emphasize: the decisive means of turning probabilistic AI deterministic
- Every structured domain is unions and recursive types, just like a compiler AST — semiconductors, law, accounting, etc.
- If you can research deeper than `draft.md` and write it better, do so — the draft is rough

### Double JSON.stringify Issue

- **Specify which type triggers it**
- Not a Qwen 3.5–only problem — **same issue occurs with Anthropic models**

## References

Explore thoroughly and understand from first principles. Additional web searches welcome.

- https://github.com/wrtnlabs/autobe / https://autobe.dev
- https://github.com/samchon/typia / https://typia.io
- https://typia.io/docs/validators/validate
- https://typia.io/docs/llm/application
- https://typia.io/docs/llm/json

## Final Word

No token or time constraints. Deliver the highest quality possible. An AI-generated deck for an AI seminar — this is your stage. Show what you can do.
