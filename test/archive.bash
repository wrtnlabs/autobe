#!/bin/bash
pnpm run build:prompt

######################################################
# QWEN
######################################################
# qwen/qwen3.5-397b-a17b (0.39)
pnpm run archive:go --vendor qwen/qwen3.5-397b-a17b --useToolChoice false --project todo > archive.qwen-qwen3.5-397b-a17b.todo.log
pnpm run archive:go --vendor qwen/qwen3.5-397b-a17b --useToolChoice false --project bbs > archive.qwen-qwen3.5-397b-a17b.bbs.log
pnpm run archive:go --vendor qwen/qwen3.5-397b-a17b --useToolChoice false --project reddit > archive.qwen-qwen3.5-397b-a17b.reddit.log
pnpm run archive:go --vendor qwen/qwen3.5-397b-a17b --useToolChoice false --project shopping > archive.qwen-qwen3.5-397b-a17b.shopping.log

# qwen/qwen3.5-122b-a10b (0.26)
pnpm run archive:go --vendor qwen/qwen3.5-122b-a10b --useToolChoice false --project todo > archive.qwen-qwen3.5-122b-a10b.todo.log
pnpm run archive:go --vendor qwen/qwen3.5-122b-a10b --useToolChoice false --project bbs > archive.qwen-qwen3.5-122b-a10b.bbs.log
pnpm run archive:go --vendor qwen/qwen3.5-122b-a10b --useToolChoice false --project reddit > archive.qwen-qwen3.5-122b-a10b.reddit.log
pnpm run archive:go --vendor qwen/qwen3.5-122b-a10b --useToolChoice false --project shopping > archive.qwen-qwen3.5-122b-a10b.shopping.log

# qwen/qwen3.5-35b-a3b (0.1625)
pnpm run archive:go --vendor qwen/qwen3.5-35b-a3b  --useToolChoice false --project todo > archive.qwen-qwen3.5-35b-a3b.todo.log
pnpm run archive:go --vendor qwen/qwen3.5-35b-a3b  --useToolChoice false --project bbs > archive.qwen-qwen3.5-35b-a3b.bbs.log
pnpm run archive:go --vendor qwen/qwen3.5-35b-a3b  --useToolChoice false --project reddit > archive.qwen-qwen3.5-35b-a3b.reddit.log
pnpm run archive:go --vendor qwen/qwen3.5-35b-a3b  --useToolChoice false --project shopping > archive.qwen-qwen3.5-35b-a3b.shopping.log

# qwen/qwen3-coder-next (0.12) -> working
pnpm run archive:go --vendor qwen/qwen3-coder-next --project todo > archive.qwen-qwen3-coder-next.todo.log
pnpm run archive:go --vendor qwen/qwen3-coder-next --project bbs > archive.qwen-qwen3-coder-next.bbs.log
pnpm run archive:go --vendor qwen/qwen3-coder-next --project reddit > archive.qwen-qwen3-coder-next.reddit.log
pnpm run archive:go --vendor qwen/qwen3-coder-next --project shopping > archive.qwen-qwen3-coder-next.shopping.log

######################################################
# KIMI
######################################################
# moonshotai/kimi-k2.5 (0.45) -> not working
pnpm run archive:go --vendor moonshotai/kimi-k2.5 --project todo > archive.moonshotai-kimi-k2.5.todo.log
pnpm run archive:go --vendor moonshotai/kimi-k2.5 --project bbs > archive.moonshotai-kimi-k2.5.bbs.log
pnpm run archive:go --vendor moonshotai/kimi-k2.5 --project reddit > archive.moonshotai-kimi-k2.5.reddit.log
pnpm run archive:go --vendor moonshotai/kimi-k2.5 --project shopping > archive.moonshotai-kimi-k2.5.shopping.log

######################################################
# GLM
######################################################
# z-ai/glm-5 (0.95) -> working
pnpm run archive:go --vendor z-ai/glm-5 --project todo > archive.z-ai-glm-5.todo.log
pnpm run archive:go --vendor z-ai/glm-5 --project bbs > archive.z-ai-glm-5.bbs.log
pnpm run archive:go --vendor z-ai/glm-5 --project reddit > archive.z-ai-glm-5.reddit.log
pnpm run archive:go --vendor z-ai/glm-5 --project shopping > archive.z-ai-glm-5.shopping.log

######################################################
# DEEPSEEK
######################################################
# deepseek/deepseek-v3.2 (0.25) -> not working
pnpm run archive:go --vendor deepseek/deepseek-v3.2 --project todo > archive.deepseek-deepseek-v3.2.todo.log
pnpm run archive:go --vendor deepseek/deepseek-v3.2 --project bbs > archive.deepseek-deepseek-v3.2.bbs.log
pnpm run archive:go --vendor deepseek/deepseek-v3.2 --project reddit > archive.deepseek-deepseek-v3.2.reddit.log
pnpm run archive:go --vendor deepseek/deepseek-v3.2 --project shopping > archive.deepseek-deepseek-v3.2.shopping.log

# deepseek/deepseek-v3.1-terminus:exacto (0.21) -> working
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
