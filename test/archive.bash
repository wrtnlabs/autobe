#!/bin/bash
pnpm run build:prompt

# openai/gpt-4.1-mini
pnpm run archive:go --vendor openai/gpt-4.1-mini --project todo > archive.openai-gpt-4.1-mini.todo.log &
pnpm run archive:go --vendor openai/gpt-4.1-mini --project bbs > archive.openai-gpt-4.1-mini.bbs.log &
pnpm run archive:go --vendor openai/gpt-4.1-mini --project reddit > archive.openai-gpt-4.1-mini.reddit.log &
pnpm run archive:go --vendor openai/gpt-4.1-mini --project shopping > archive.openai-gpt-4.1-mini.shopping.log &

# qwen/qwen3-next-80b-a3b-instruct
pnpm run archive:go --vendor qwen/qwen3-next-80b-a3b-instruct --project todo > archive.qwen-qwen3-next-80b-a3b-instruct.todo.log &
pnpm run archive:go --vendor qwen/qwen3-next-80b-a3b-instruct --project bbs > archive.qwen-qwen3-next-80b-a3b-instruct.bbs.log &
pnpm run archive:go --vendor qwen/qwen3-next-80b-a3b-instruct --project reddit > archive.qwen-qwen3-next-80b-a3b-instruct.reddit.log &
pnpm run archive:go --vendor qwen/qwen3-next-80b-a3b-instruct --project shopping > archive.qwen-qwen3-next-80b-a3b-instruct.shopping.log &

wait
echo "All Completed!"
