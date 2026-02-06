#!/bin/bash
pnpm run build:prompt

######################################################
# QWEN
######################################################
# qwen/qwen3-coder-next (0.07)
pnpm run archive:go --vendor qwen/qwen3-coder-next --project todo > archive.qwen-qwen3-coder-next.todo.log
pnpm run archive:go --vendor qwen/qwen3-coder-next --project bbs > archive.qwen-qwen3-coder-next.bbs.log
pnpm run archive:go --vendor qwen/qwen3-coder-next --project reddit > archive.qwen-qwen3-coder-next.reddit.log
pnpm run archive:go --vendor qwen/qwen3-coder-next --project shopping > archive.qwen-qwen3-coder-next.shopping.log

# qwen/qwen3-next-80b-a3b-instruct (0.09) -> working
pnpm run archive:go --vendor qwen/qwen3-next-80b-a3b-instruct --project todo > archive.qwen-qwen3-next-80b-a3b-instruct.todo.log
pnpm run archive:go --vendor qwen/qwen3-next-80b-a3b-instruct --project bbs > archive.qwen-qwen3-next-80b-a3b-instruct.bbs.log
pnpm run archive:go --vendor qwen/qwen3-next-80b-a3b-instruct --project reddit > archive.qwen-qwen3-next-80b-a3b-instruct.reddit.log
pnpm run archive:go --vendor qwen/qwen3-next-80b-a3b-instruct --project shopping > archive.qwen-qwen3-next-80b-a3b-instruct.shopping.log

# qwen/qwen3-30b-a3b-thinking-2507 (0.051) -> working
pnpm run archive:go --vendor qwen/qwen3-30b-a3b-thinking-2507 --project todo > archive.qwen-qwen3-30b-a3b-thinking-2507.todo.log
pnpm run archive:go --vendor qwen/qwen3-30b-a3b-thinking-2507 --project bbs > archive.qwen-qwen3-30b-a3b-thinking-2507.bbs.log
pnpm run archive:go --vendor qwen/qwen3-30b-a3b-thinking-2507 --project reddit > archive.qwen-qwen3-30b-a3b-thinking-2507.reddit.log
pnpm run archive:go --vendor qwen/qwen3-30b-a3b-thinking-2507 --project shopping > archive.qwen-qwen3-30b-a3b-thinking-2507.shopping.log

# qwen/qwen3-coder:exacto (0.22) -> not working
pnpm run archive:go --vendor qwen/qwen3-coder:exacto --project todo > archive.qwen-qwen3-coder.todo.log
pnpm run archive:go --vendor qwen/qwen3-coder:exacto --project bbs > archive.qwen-qwen3-coder.bbs.log
pnpm run archive:go --vendor qwen/qwen3-coder:exacto --project reddit > archive.qwen-qwen3-coder.reddit.log
pnpm run archive:go --vendor qwen/qwen3-coder:exacto --project shopping > archive.qwen-qwen3-coder.shopping.log

######################################################
# KIMI
######################################################
# moonshotai/kimi-k2.5 (0.5) -> not working
pnpm run archive:go --vendor moonshotai/kimi-k2.5 --project todo > archive.moonshotai-kimi-k2.5.todo.log
pnpm run archive:go --vendor moonshotai/kimi-k2.5 --project bbs > archive.moonshotai-kimi-k2.5.bbs.log
pnpm run archive:go --vendor moonshotai/kimi-k2.5 --project reddit > archive.moonshotai-kimi-k2.5.reddit.log
pnpm run archive:go --vendor moonshotai/kimi-k2.5 --project shopping > archive.moonshotai-kimi-k2.5.shopping.log

######################################################
# GLM
######################################################
# z-ai/glm-4.7 (0.4) -> not working
pnpm run archive:go --vendor z-ai/glm-4.7 --project todo > archive.z-ai-glm-4.7.todo.log
pnpm run archive:go --vendor z-ai/glm-4.7 --project bbs > archive.z-ai-glm-4.7.bbs.log
pnpm run archive:go --vendor z-ai/glm-4.7 --project reddit > archive.z-ai-glm-4.7.reddit.log
pnpm run archive:go --vendor z-ai/glm-4.7 --project shopping > archive.z-ai-glm-4.7.shopping.log

######################################################
# DEEPSEEK
######################################################
# deepseek/deepseek-v3.2 (0.25) -> not working
pnpm run archive:go --vendor deepseek/deepseek-v3.2 --project todo > archive.deepseek-deepseek-v3.2.todo.log
pnpm run archive:go --vendor deepseek/deepseek-v3.2 --project bbs > archive.deepseek-deepseek-v3.2.bbs.log
pnpm run archive:go --vendor deepseek/deepseek-v3.2 --project reddit > archive.deepseek-deepseek-v3.2.reddit.log
pnpm run archive:go --vendor deepseek/deepseek-v3.2 --project shopping > archive.deepseek-deepseek-v3.2.shopping.log

# deepseek/deepseek-v3.1-terminus:exacto (0.21) -> not working
pnpm run archive:go --vendor deepseek/deepseek-v3.1-terminus:exacto --project todo > archive.deepseek-deepseek-v3.1-terminus-exacto.todo.log
pnpm run archive:go --vendor deepseek/deepseek-v3.1-terminus:exacto --project bbs > archive.deepseek-deepseek-v3.1-terminus-exacto.bbs.log
pnpm run archive:go --vendor deepseek/deepseek-v3.1-terminus:exacto --project reddit > archive.deepseek-deepseek-v3.1-terminus-exacto.reddit.log
pnpm run archive:go --vendor deepseek/deepseek-v3.1-terminus:exacto --project shopping > archive.deepseek-deepseek-v3.1-terminus-exacto.shopping.log

######################################################
# OPENAI
######################################################
# openai/gpt-5.2 (1.75) -> working
pnpm run archive:go --vendor openai/gpt-5.2 --project todo > archive.openai-gpt-5.2.todo.log
pnpm run archive:go --vendor openai/gpt-5.2 --project bbs > archive.openai-gpt-5.2.bbs.log
pnpm run archive:go --vendor openai/gpt-5.2 --project reddit > archive.openai-gpt-5.2.reddit.log
pnpm run archive:go --vendor openai/gpt-5.2 --project shopping > archive.openai-gpt-5.2.shopping.log

# openai/gpt-5-mini (0.25) -> working
pnpm run archive:go --vendor openai/gpt-5-mini --project todo > archive.openai-gpt-5-mini.todo.log
pnpm run archive:go --vendor openai/gpt-5-mini --project bbs > archive.openai-gpt-5-mini.bbs.log
pnpm run archive:go --vendor openai/gpt-5-mini --project reddit > archive.openai-gpt-5-mini.reddit.log
pnpm run archive:go --vendor openai/gpt-5-mini --project shopping > archive.openai-gpt-5-mini.shopping.log

# openai/gpt-4.1-mini (0.4) -> working
pnpm run archive:go --vendor openai/gpt-4.1-mini --project todo > archive.openai-gpt-4.1-mini.todo.log
pnpm run archive:go --vendor openai/gpt-4.1-mini --project bbs > archive.openai-gpt-4.1-mini.bbs.log
pnpm run archive:go --vendor openai/gpt-4.1-mini --project reddit > archive.openai-gpt-4.1-mini.reddit.log
pnpm run archive:go --vendor openai/gpt-4.1-mini --project shopping > archive.openai-gpt-4.1-mini.shopping.log
