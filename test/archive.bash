#!/bin/bash
pnpm run build:prompt

# openai/gpt-4.1-mini (0.4)
pnpm run archive:go --vendor openai/gpt-4.1-mini --project todo > archive.openai-gpt-4.1-mini.todo.log
pnpm run archive:go --vendor openai/gpt-4.1-mini --project bbs > archive.openai-gpt-4.1-mini.bbs.log
pnpm run archive:go --vendor openai/gpt-4.1-mini --project reddit > archive.openai-gpt-4.1-mini.reddit.log
pnpm run archive:go --vendor openai/gpt-4.1-mini --project shopping > archive.openai-gpt-4.1-mini.shopping.log

######################################################
# QWEN
######################################################
# qwen/qwen3-next-80b-a3b-instruct (0.06)
pnpm run archive:go --vendor qwen/qwen3-next-80b-a3b-instruct --project todo > archive.qwen-qwen3-next-80b-a3b-instruct.todo.log
pnpm run archive:go --vendor qwen/qwen3-next-80b-a3b-instruct --project bbs > archive.qwen-qwen3-next-80b-a3b-instruct.bbs.log
pnpm run archive:go --vendor qwen/qwen3-next-80b-a3b-instruct --project reddit > archive.qwen-qwen3-next-80b-a3b-instruct.reddit.log
pnpm run archive:go --vendor qwen/qwen3-next-80b-a3b-instruct --project shopping > archive.qwen-qwen3-next-80b-a3b-instruct.shopping.log

# qwen/qwen3-next-80b-a3b-thinking (0.15)
pnpm run archive:go --vendor qwen/qwen3-next-80b-a3b-thinking --project todo > archive.qwen-qwen3-next-80b-a3b-thinking.todo.log
pnpm run archive:go --vendor qwen/qwen3-next-80b-a3b-thinking --project bbs > archive.qwen-qwen3-next-80b-a3b-thinking.bbs.log
pnpm run archive:go --vendor qwen/qwen3-next-80b-a3b-thinking --project reddit > archive.qwen-qwen3-next-80b-a3b-thinking.reddit.log
pnpm run archive:go --vendor qwen/qwen3-next-80b-a3b-thinking --project shopping > archive.qwen-qwen3-next-80b-a3b-thinking.shopping.log

# qwen/qwen3-30b-a3b-thinking-2507 (0.051)
pnpm run archive:go --vendor qwen/qwen3-30b-a3b-thinking-2507 --project todo > archive.qwen-qwen3-30b-a3b-thinking-2507.todo.log
pnpm run archive:go --vendor qwen/qwen3-30b-a3b-thinking-2507 --project bbs > archive.qwen-qwen3-30b-a3b-thinking-2507.bbs.log
pnpm run archive:go --vendor qwen/qwen3-30b-a3b-thinking-2507 --project reddit > archive.qwen-qwen3-30b-a3b-thinking-2507.reddit.log
pnpm run archive:go --vendor qwen/qwen3-30b-a3b-thinking-2507 --project shopping > archive.qwen-qwen3-30b-a3b-thinking-2507.shopping.log

# qwen/qwen3-235b-a22b-2507 (0.071)
pnpm run archive:go --vendor qwen/qwen3-235b-a22b-2507 --project todo > archive.qwen-qwen3-235b-a22b-2507.todo.log
pnpm run archive:go --vendor qwen/qwen3-235b-a22b-2507 --project bbs > archive.qwen-qwen3-235b-a22b-2507.bbs.log
pnpm run archive:go --vendor qwen/qwen3-235b-a22b-2507 --project reddit > archive.qwen-qwen3-235b-a22b-2507.reddit.log
pnpm run archive:go --vendor qwen/qwen3-235b-a22b-2507 --project shopping > archive.qwen-qwen3-235b-a22b-2507.shopping.log

# qwen/qwen3-235b-a22b-thinking-2507 (0.11)
pnpm run archive:go --vendor qwen/qwen3-235b-a22b-thinking-2507 --project todo > archive.qwen-qwen3-235b-a22b-thinking-2507.todo.log
pnpm run archive:go --vendor qwen/qwen3-235b-a22b-thinking-2507 --project bbs > archive.qwen-qwen3-235b-a22b-thinking-2507.bbs.log
pnpm run archive:go --vendor qwen/qwen3-235b-a22b-thinking-2507 --project reddit > archive.qwen-qwen3-235b-a22b-thinking-2507.reddit.log
pnpm run archive:go --vendor qwen/qwen3-235b-a22b-thinking-2507 --project shopping > archive.qwen-qwen3-235b-a22b-thinking-2507.shopping.log

######################################################
# GLM
######################################################
# z-ai/glm-4.7 (0.16)
pnpm run archive:go --vendor z-ai/glm-4.7 --project todo > archive.z-ai-glm-4.7.todo.log
pnpm run archive:go --vendor z-ai/glm-4.7 --project bbs > archive.z-ai-glm-4.7.bbs.log
pnpm run archive:go --vendor z-ai/glm-4.7 --project reddit > archive.z-ai-glm-4.7.reddit.log
pnpm run archive:go --vendor z-ai/glm-4.7 --project shopping > archive.z-ai-glm-4.7.shopping.log

######################################################
# KIMI
######################################################
# moonshotai/kimi-k2-0905 (0.39)
pnpm run archive:go --vendor moonshotai/kimi-k2-0905 --project todo > archive.moonshotai-kimi-k2-0905.todo.log
pnpm run archive:go --vendor moonshotai/kimi-k2-0905 --project bbs > archive.moonshotai-kimi-k2-0905.bbs.log
pnpm run archive:go --vendor moonshotai/kimi-k2-0905 --project reddit > archive.moonshotai-kimi-k2-0905.reddit.log
pnpm run archive:go --vendor moonshotai/kimi-k2-0905 --project shopping > archive.moonshotai-kimi-k2-0905.shopping.log

# moonshotai/kimi-k2-thinking (0.32)
pnpm run archive:go --vendor moonshotai/kimi-k2-thinking --project todo > archive.moonshotai-kimi-k2-thinking.todo.log
pnpm run archive:go --vendor moonshotai/kimi-k2-thinking --project bbs > archive.moonshotai-kimi-k2-thinking.bbs.log
pnpm run archive:go --vendor moonshotai/kimi-k2-thinking --project reddit > archive.moonshotai-kimi-k2-thinking.reddit.log
pnpm run archive:go --vendor moonshotai/kimi-k2-thinking --project shopping > archive.moonshotai-kimi-k2-thinking.shopping.log