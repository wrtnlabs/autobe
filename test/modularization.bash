################################################
# EVERYTHING
################################################
pnpm run archive:go --vendor openai/gpt-4.1 --project todo --from realize > archive.openai-gpt-4.1.todo.log
pnpm run archive:go --vendor openai/gpt-4.1 --project bbs --from realize > archive.openai-gpt-4.1.bbs.log
pnpm run archive:go --vendor openai/gpt-4.1 --project reddit --from realize > archive.openai-gpt-4.1.reddit.log
pnpm run archive:go --vendor openai/gpt-4.1 --project shopping --from realize > archive.openai-gpt-4.1.shopping.log

pnpm run archive:go --vendor qwen/qwen3-next-80b-a3b-instruct --project todo --from realize > archive.qwen-qwen3-next-80b-a3b-instruct.todo.log
pnpm run archive:go --vendor qwen/qwen3-next-80b-a3b-instruct --project bbs --from realize > archive.qwen-qwen3-next-80b-a3b-instruct.bbs.log
pnpm run archive:go --vendor qwen/qwen3-next-80b-a3b-instruct --project reddit --from realize > archive.qwen-qwen3-next-80b-a3b-instruct.reddit.log
pnpm run archive:go --vendor qwen/qwen3-next-80b-a3b-instruct --project shopping --from realize > archive.qwen-qwen3-next-80b-a3b-instruct.shopping.log

################################################
# COLLECTOR
################################################
pnpm start --include realize_collector_todo
pnpm start --include realize_collector_bbs
pnpm start --include realize_collector_reddit
pnpm start --include realize_collector_shopping

pnpm start --vendor qwen/qwen3-next-80b-a3b-instruct --include realize_collector_todo
pnpm start --vendor qwen/qwen3-next-80b-a3b-instruct --include realize_collector_bbs
pnpm start --vendor qwen/qwen3-next-80b-a3b-instruct --include realize_collector_reddit
pnpm start --vendor qwen/qwen3-next-80b-a3b-instruct --include realize_collector_shopping

################################################
# TRANSFORMER
################################################
pnpm start --include realize_transformer_todo
pnpm start --include realize_transformer_bbs
pnpm start --include realize_transformer_reddit
pnpm start --include realize_transformer_shopping

pnpm start --vendor qwen/qwen3-next-80b-a3b-instruct --include realize_transformer_todo
pnpm start --vendor qwen/qwen3-next-80b-a3b-instruct --include realize_transformer_bbs
pnpm start --vendor qwen/qwen3-next-80b-a3b-instruct --include realize_transformer_reddit
pnpm start --vendor qwen/qwen3-next-80b-a3b-instruct --include realize_transformer_shopping
