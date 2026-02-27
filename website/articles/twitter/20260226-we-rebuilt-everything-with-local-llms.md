We built an AI that writes full backend apps with 100% success rate. Then we broke it on purpose.

The code was unmaintainable — no shared modules. Change one field? Regenerate 50 implementations. So we rebuilt everything. Success rate crashed to 40%.

How do you find bugs you don't know exist? Throw weak models at it. A 30b model exposed every schema ambiguity that GPT-4.1 papered over.

qwen3-coder-next raw function calling: 6.75%. With validation feedback: 100%. We shipped builds with NO system prompt — output quality was indistinguishable. Types beat prose.

Back to 100% with GLM v5.

- Detailed Article: https://dev.to/samchon/autobe-we-built-an-ai-that-writes-full-backend-apps-then-broke-its-100-success-rate-on-purpose-5757
- Github Repository: https://github.com/wrtnlabs/autobe
