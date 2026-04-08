I build another coding agent — AutoBe, an open-source AI that generates entire backend applications from natural language.

When Claude Code's source leaked, it couldn't have come at a better time — we were about to layer serious orchestration onto our pipeline, and this was the best possible study material.

Felt like receiving a gift.

## TL;DR

1. Claude Code—source code leaked via an npm incident
   - `while(true)` + autonomous selection of 40 tools + 4-tier context compression
   - A masterclass in prompt engineering and agent workflow design
   - 2nd generation: humans lead, AI assists
2. AutoBe, the opposite design
   - 4 ASTs x 4-stage compiler x self-correction loops
   - Function Calling Harness: even small models like `qwen3.5-35b-a3b` produce backends on par with top-tier models
   - 3rd generation: AI generates, compilers verify
3. After reading—shared insights, a coexisting future
   - Independently reaching the same conclusions: reduce the choices; give workers self-contained context
   - 0.95^400 ~ 0%—the shift to 3rd generation is an architecture problem, not a model performance problem
   - AutoBE handles the initial build, Claude Code handles maintenance—coexistence, not replacement

Full writeup: http://autobe.dev/articles/autobe-vs-claude-code.html
