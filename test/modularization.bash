################################################
# EVERYTHING
################################################
pnpm run archive:go --vendor openai/gpt-4.1 --project todo --from realize > archive.openai-gpt-4.1.todo.log
pnpm run archive:go --vendor openai/gpt-4.1 --project bbs --from realize > archive.openai-gpt-4.1.bbs.log
pnpm run archive:go --vendor openai/gpt-4.1 --project reddit --from realize > archive.openai-gpt-4.1.reddit.log
pnpm run archive:go --vendor openai/gpt-4.1 --project shopping --from realize > archive.openai-gpt-4.1.shopping.log

pnpm run archive:go --vendor openai/gpt-4.1-mini --project todo --from realize > archive.openai-gpt-4.1-mini.todo.log
pnpm run archive:go --vendor openai/gpt-4.1-mini --project bbs --from realize > archive.openai-gpt-4.1-mini.bbs.log
pnpm run archive:go --vendor openai/gpt-4.1-mini --project reddit --from realize > archive.openai-gpt-4.1-mini.reddit.log
pnpm run archive:go --vendor openai/gpt-4.1-mini --project shopping --from realize > archive.openai-gpt-4.1-mini.shopping.log

pnpm run archive:go --vendor qwen/qwen3-next-80b-a3b-instruct --project todo --from realize > archive.qwen-qwen3-next-80b-a3b-instruct.todo.log
pnpm run archive:go --vendor qwen/qwen3-next-80b-a3b-instruct --project bbs --from realize > archive.qwen-qwen3-next-80b-a3b-instruct.bbs.log
pnpm run archive:go --vendor qwen/qwen3-next-80b-a3b-instruct --project reddit --from realize > archive.qwen-qwen3-next-80b-a3b-instruct.reddit.log
pnpm run archive:go --vendor qwen/qwen3-next-80b-a3b-instruct --project shopping --from realize > archive.qwen-qwen3-next-80b-a3b-instruct.shopping.log

################################################
# MODULARIZATION
################################################
pnpm start --include realize_modularization_todo --archive > realize.openai-gpt-4.1.todo.log
pnpm start --include realize_modularization_bbs --archive > realize.openai-gpt-4.1.bbs.log
pnpm start --include realize_modularization_reddit --archive > realize.openai-gpt-4.1.reddit.log
pnpm start --include realize_modularization_shopping --archive > realize.openai-gpt-4.1.shopping.log

pnpm start --vendor qwen/qwen3-next-80b-a3b-instruct --include realize_modularization_todo --archive > realize.qwen-qwen3-next-80b-a3b-instruct.todo.log
pnpm start --vendor qwen/qwen3-next-80b-a3b-instruct --include realize_modularization_bbs --archive > realize.qwen-qwen3-next-80b-a3b-instruct.bbs.log
pnpm start --vendor qwen/qwen3-next-80b-a3b-instruct --include realize_modularization_reddit --archive > realize.qwen-qwen3-next-80b-a3b-instruct.reddit.log
pnpm start --vendor qwen/qwen3-next-80b-a3b-instruct --include realize_modularization_shopping --archive > realize.qwen-qwen3-next-80b-a3b-instruct.shopping.log

################################################
# COLLECTOR
################################################
pnpm start --include realize_collector_todo --archive > realize_collector.openai-gpt-4.1.todo.log
pnpm start --include realize_collector_bbs --archive > realize_collector.openai-gpt-4.1.bbs.log
pnpm start --include realize_collector_reddit --archive > realize_collector.openai-gpt-4.1.reddit.log
pnpm start --include realize_collector_shopping --archive > realize_collector.openai-gpt-4.1.shopping.log

pnpm start --vendor openai/gpt-4.1-mini --include realize_collector_todo --archive > realize_collector.openai-gpt-4.1-mini.todo.log
pnpm start --vendor openai/gpt-4.1-mini --include realize_collector_bbs --archive > realize_collector.openai-gpt-4.1-mini.bbs.log
pnpm start --vendor openai/gpt-4.1-mini --include realize_collector_reddit --archive > realize_collector.openai-gpt-4.1-mini.reddit.log
pnpm start --vendor openai/gpt-4.1-mini --include realize_collector_shopping --archive > realize_collector.openai-gpt-4.1-mini.shopping.log

pnpm start --vendor qwen/qwen3-next-80b-a3b-instruct --include realize_collector_todo --archive > realize_collector.qwen-qwen3-next-80b-a3b-instruct.todo.log
pnpm start --vendor qwen/qwen3-next-80b-a3b-instruct --include realize_collector_bbs --archive > realize_collector.qwen-qwen3-next-80b-a3b-instruct.bbs.log
pnpm start --vendor qwen/qwen3-next-80b-a3b-instruct --include realize_collector_reddit --archive > realize_collector.qwen-qwen3-next-80b-a3b-instruct.reddit.log
pnpm start --vendor qwen/qwen3-next-80b-a3b-instruct --include realize_collector_shopping --archive > realize_collector.qwen-qwen3-next-80b-a3b-instruct.shopping.log

################################################
# TRANSFORMER
################################################
pnpm start --include realize_transformer_todo --archive > realize_transformer.openai-gpt-4.1.todo.log
pnpm start --include realize_transformer_bbs --archive > realize_transformer.openai-gpt-4.1.bbs.log
pnpm start --include realize_transformer_reddit --archive > realize_transformer.openai-gpt-4.1.reddit.log
pnpm start --include realize_transformer_shopping --archive > realize_transformer.openai-gpt-4.1.shopping.log

pnpm start --vendor openai/gpt-4.1-mini --include realize_transformer_todo --archive > realize_transformer.openai-gpt-4.1-mini.todo.log
pnpm start --vendor openai/gpt-4.1-mini --include realize_transformer_bbs --archive > realize_transformer.openai-gpt-4.1-mini.bbs.log
pnpm start --vendor openai/gpt-4.1-mini --include realize_transformer_reddit --archive > realize_transformer.openai-gpt-4.1-mini.reddit.log
pnpm start --vendor openai/gpt-4.1-mini --include realize_transformer_shopping --archive > realize_transformer.openai-gpt-4.1-mini.shopping.log

pnpm start --vendor qwen/qwen3-next-80b-a3b-instruct --include realize_transformer_todo --archive > realize_transformer.qwen-qwen3-next-80b-a3b-instruct.todo.log
pnpm start --vendor qwen/qwen3-next-80b-a3b-instruct --include realize_transformer_bbs --archive > realize_transformer.qwen-qwen3-next-80b-a3b-instruct.bbs.log
pnpm start --vendor qwen/qwen3-next-80b-a3b-instruct --include realize_transformer_reddit --archive > realize_transformer.qwen-qwen3-next-80b-a3b-instruct.reddit.log
pnpm start --vendor qwen/qwen3-next-80b-a3b-instruct --include realize_transformer_shopping --archive > realize_transformer.qwen-qwen3-next-80b-a3b-instruct.shopping.log