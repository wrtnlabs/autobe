# anthropic/claude-sonnet-4.5
pnpm run archive:go --vendor anthropic/claude-sonnet-4.5 --project todo --from test > archive.anthropic-claude-sonnet-4.5.todo.log &
pnpm run archive:go --vendor anthropic/claude-sonnet-4.5 --project bbs --from test > archive.anthropic-claude-sonnet-4.5.bbs.log &
pnpm run archive:go --vendor anthropic/claude-sonnet-4.5 --project reddit --from test > archive.anthropic-claude-sonnet-4.5.reddit.log &
pnpm run archive:go --vendor anthropic/claude-sonnet-4.5 --project shopping --from test > archive.anthropic-claude-sonnet-4.5.shopping.log &

# anthropic/claude-haiku-4.5
pnpm run archive:go --vendor anthropic/claude-haiku-4.5 --project todo --from test > archive.anthropic-claude-haiku-4.5.todo.log &
pnpm run archive:go --vendor anthropic/claude-haiku-4.5 --project bbs --from test > archive.anthropic-claude-haiku-4.5.bbs.log &
pnpm run archive:go --vendor anthropic/claude-haiku-4.5 --project reddit --from test > archive.anthropic-claude-haiku-4.5.reddit.log &
pnpm run archive:go --vendor anthropic/claude-haiku-4.5 --project shopping --from test > archive.anthropic-claude-haiku-4.5.shopping.log &

# openai/gpt-4.1
pnpm run archive:go --vendor openai/gpt-4.1 --project todo --from test > archive.openai-gpt-4.1.todo.log &
pnpm run archive:go --vendor openai/gpt-4.1 --project bbs --from test > archive.openai-gpt-4.1.bbs.log &
pnpm run archive:go --vendor openai/gpt-4.1 --project reddit --from test > archive.openai-gpt-4.1.reddit.log &
pnpm run archive:go --vendor openai/gpt-4.1 --project shopping --from test > archive.openai-gpt-4.1.shopping.log &

# openai/gpt-4.1-mini
pnpm run archive:go --vendor openai/gpt-4.1-mini --project todo --from test > archive.openai-gpt-4.1-mini.todo.log &
pnpm run archive:go --vendor openai/gpt-4.1-mini --project bbs --from test > archive.openai-gpt-4.1-mini.bbs.log &
pnpm run archive:go --vendor openai/gpt-4.1-mini --project reddit --from test > archive.openai-gpt-4.1-mini.reddit.log &
pnpm run archive:go --vendor openai/gpt-4.1-mini --project shopping --from test > archive.openai-gpt-4.1-mini.shopping.log &

# openai/gpt-5.2
pnpm run archive:go --vendor openai/gpt-5.2 --project todo --from test > archive.openai-gpt-5.2.todo.log &
pnpm run archive:go --vendor openai/gpt-5.2 --project bbs --from test > archive.openai-gpt-5.2.bbs.log &
pnpm run archive:go --vendor openai/gpt-5.2 --project reddit --from test > archive.openai-gpt-5.2.reddit.log &
pnpm run archive:go --vendor openai/gpt-5.2 --project shopping --from test > archive.openai-gpt-5.2.shopping.log &

# qwen/qwen3-next-80b-a3b-instruct
pnpm run archive:go --vendor qwen/qwen3-next-80b-a3b-instruct --project todo --from test > archive.qwen-qwen3-next-80b-a3b-instruct.todo.log &
pnpm run archive:go --vendor qwen/qwen3-next-80b-a3b-instruct --project bbs --from test > archive.qwen-qwen3-next-80b-a3b-instruct.bbs.log &
pnpm run archive:go --vendor qwen/qwen3-next-80b-a3b-instruct --project reddit --from test > archive.qwen-qwen3-next-80b-a3b-instruct.reddit.log &
pnpm run archive:go --vendor qwen/qwen3-next-80b-a3b-instruct --project shopping --from interface > archive.qwen-qwen3-next-80b-a3b-instruct.shopping.log &

wait
echo "All Completed!"
