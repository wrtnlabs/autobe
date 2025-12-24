#!/bin/bash
pnpm run build:prompt

# openai/gpt-4.1-mini
pnpm run archive:go --vendor openai/gpt-4.1-mini --project todo --from test --to test > archive.openai-gpt-4.1-mini.todo.log
pnpm run archive:go --vendor openai/gpt-4.1-mini --project bbs --from test --to test > archive.openai-gpt-4.1-mini.bbs.log
pnpm run archive:go --vendor openai/gpt-4.1-mini --project reddit --from test --to test > archive.openai-gpt-4.1-mini.reddit.log
pnpm run archive:go --vendor openai/gpt-4.1-mini --project shopping --from test --to test > archive.openai-gpt-4.1-mini.shopping.log

# qwen/qwen3-next-80b-a3b-instruct
pnpm run archive:go --vendor qwen/qwen3-next-80b-a3b-instruct --project todo --from test --to test > archive.qwen-qwen3-next-80b-a3b-instruct.todo.log
pnpm run archive:go --vendor qwen/qwen3-next-80b-a3b-instruct --project bbs --from test --to test > archive.qwen-qwen3-next-80b-a3b-instruct.bbs.log
pnpm run archive:go --vendor qwen/qwen3-next-80b-a3b-instruct --project reddit --from test --to test > archive.qwen-qwen3-next-80b-a3b-instruct.reddit.log
pnpm run archive:go --vendor qwen/qwen3-next-80b-a3b-instruct --project shopping --from test --to test > archive.qwen-qwen3-next-80b-a3b-instruct.shopping.log
