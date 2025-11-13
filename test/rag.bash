pnpm run archive --vendor qwen/qwen3-next-80b-a3b-instruct --project todo --from interface --to interface > archive.qwen-qwen3-next-80b-a3b-instruct.todo.log
pnpm run archive --vendor qwen/qwen3-next-80b-a3b-instruct --project bbs --from interface --to interface > archive.qwen-qwen3-next-80b-a3b-instruct.bbs.log
pnpm run archive --vendor qwen/qwen3-next-80b-a3b-instruct --project reddit --from interface --to interface > archive.qwen-qwen3-next-80b-a3b-instruct.reddit.log
pnpm run archive --vendor qwen/qwen3-next-80b-a3b-instruct --project shopping --from interface --to interface > archive.qwen-qwen3-next-80b-a3b-instruct.shopping.log

pnpm run archive --vendor deepseek/deepseek-v3.1-terminus:exacto --schema claude --project todo --from interface --to interface > archive.deepseek-v3.1-terminus.todo.log
pnpm run archive --vendor deepseek/deepseek-v3.1-terminus:exacto --schema claude --project bbs --from interface --to interface > archive.deepseek-v3.1-terminus.bbs.log
pnpm run archive --vendor deepseek/deepseek-v3.1-terminus:exacto --schema claude --project reddit --from interface --to interface > archive.deepseek-v3.1-terminus.reddit.log
pnpm run archive --vendor deepseek/deepseek-v3.1-terminus:exacto --schema claude --project shopping --from interface --to interface > archive.deepseek-v3.1-terminus.shopping.log

pnpm run archive --vendor moonshotai/kimi-k2-0905:exacto --project todo --schema claude --from interface --to interface > archive.moonshotai-kimi-k2-0905.todo.log
pnpm run archive --vendor moonshotai/kimi-k2-0905:exacto --project bbs --schema claude --from interface --to interface > archive.moonshotai-kimi-k2-0905.bbs.log
pnpm run archive --vendor moonshotai/kimi-k2-0905:exacto --project reddit --schema claude --from interface --to interface > archive.moonshotai-kimi-k2-0905.reddit.log
pnpm run archive --vendor moonshotai/kimi-k2-0905:exacto --project shopping --schema claude --from interface --to interface > archive.moonshotai-kimi-k2-0905.shopping.log

pnpm run archive --vendor openai/gpt-4.1-mini --project todo --from interface --to interface > archive.openai-gpt-4.1-mini.todo.log
pnpm run archive --vendor openai/gpt-4.1-mini --project bbs --from interface --to interface > archive.openai-gpt-4.1-mini.bbs.log
pnpm run archive --vendor openai/gpt-4.1-mini --project reddit --from interface --to interface > archive.openai-gpt-4.1-mini.reddit.log
pnpm run archive --vendor openai/gpt-4.1-mini --project shopping --from interface --to interface > archive.openai-gpt-4.1-mini.shopping.log