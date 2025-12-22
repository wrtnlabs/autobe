pnpm run build:prompt

# anthropic/claude-sonnet-4.5
pnpm run archive:go --vendor anthropic/claude-sonnet-4.5 --project todo > archive.anthropic-claude-sonnet-4.5.todo.log &
pnpm run archive:go --vendor anthropic/claude-sonnet-4.5 --project bbs > archive.anthropic-claude-sonnet-4.5.bbs.log &
pnpm run archive:go --vendor anthropic/claude-sonnet-4.5 --project reddit > archive.anthropic-claude-sonnet-4.5.reddit.log &
pnpm run archive:go --vendor anthropic/claude-sonnet-4.5 --project shopping > archive.anthropic-claude-sonnet-4.5.shopping.log &

# anthropic/claude-haiku-4.5
pnpm run archive:go --vendor anthropic/claude-haiku-4.5 --project todo > archive.anthropic-claude-haiku-4.5.todo.log &
pnpm run archive:go --vendor anthropic/claude-haiku-4.5 --project bbs > archive.anthropic-claude-haiku-4.5.bbs.log &
pnpm run archive:go --vendor anthropic/claude-haiku-4.5 --project reddit > archive.anthropic-claude-haiku-4.5.reddit.log &
pnpm run archive:go --vendor anthropic/claude-haiku-4.5 --project shopping > archive.anthropic-claude-haiku-4.5.shopping.log &

# openai/gpt-4.1
pnpm run archive:go --vendor openai/gpt-4.1 --project todo > archive.openai-gpt-4.1.todo.log &
pnpm run archive:go --vendor openai/gpt-4.1 --project bbs > archive.openai-gpt-4.1.bbs.log &
pnpm run archive:go --vendor openai/gpt-4.1 --project reddit > archive.openai-gpt-4.1.reddit.log &
pnpm run archive:go --vendor openai/gpt-4.1 --project shopping > archive.openai-gpt-4.1.shopping.log &

# openai/gpt-4.1-mini
pnpm run archive:go --vendor openai/gpt-4.1-mini --project todo > archive.openai-gpt-4.1-mini.todo.log &
pnpm run archive:go --vendor openai/gpt-4.1-mini --project bbs > archive.openai-gpt-4.1-mini.bbs.log &
pnpm run archive:go --vendor openai/gpt-4.1-mini --project reddit > archive.openai-gpt-4.1-mini.reddit.log &
pnpm run archive:go --vendor openai/gpt-4.1-mini --project shopping > archive.openai-gpt-4.1-mini.shopping.log &

# openai/gpt-5.2
pnpm run archive:go --vendor openai/gpt-5.2 --project todo > archive.openai-gpt-5.2.todo.log &
pnpm run archive:go --vendor openai/gpt-5.2 --project bbs > archive.openai-gpt-5.2.bbs.log &
pnpm run archive:go --vendor openai/gpt-5.2 --project reddit > archive.openai-gpt-5.2.reddit.log &
pnpm run archive:go --vendor openai/gpt-5.2 --project shopping > archive.openai-gpt-5.2.shopping.log &

# qwen/qwen3-next-80b-a3b-instruct
pnpm run archive:go --vendor qwen/qwen3-next-80b-a3b-instruct --project todo > archive.qwen-qwen3-next-80b-a3b-instruct.todo.log &
pnpm run archive:go --vendor qwen/qwen3-next-80b-a3b-instruct --project bbs > archive.qwen-qwen3-next-80b-a3b-instruct.bbs.log &
pnpm run archive:go --vendor qwen/qwen3-next-80b-a3b-instruct --project reddit > archive.qwen-qwen3-next-80b-a3b-instruct.reddit.log &
pnpm run archive:go --vendor qwen/qwen3-next-80b-a3b-instruct --project shopping > archive.qwen-qwen3-next-80b-a3b-instruct.shopping.log &

wait
echo "All Completed!"
