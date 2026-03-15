#!/bin/bash
pnpm run build:prompt

######################################################
# QWEN
######################################################
# qwen/qwen3.5-397b-a17b (0.39)
pnpm run archive:go --vendor qwen/qwen3.5-397b-a17b:exacto --useToolChoice false --project todo > archive.qwen-qwen3.5-397b-a17b.todo.log
pnpm run archive:go --vendor qwen/qwen3.5-397b-a17b:exacto --useToolChoice false --project reddit > archive.qwen-qwen3.5-397b-a17b.reddit.log
pnpm run archive:go --vendor qwen/qwen3.5-397b-a17b:exacto --useToolChoice false --project shopping > archive.qwen-qwen3.5-397b-a17b.shopping.log
pnpm run archive:go --vendor qwen/qwen3.5-397b-a17b:exacto --useToolChoice false --project erp > archive.qwen-qwen3.5-397b-a17b.erp.log

# qwen/qwen3.5-122b-a10b (0.26)
pnpm run archive:go --vendor qwen/qwen3.5-122b-a10b:exacto --useToolChoice false --project todo > archive.qwen-qwen3.5-122b-a10b.todo.log
pnpm run archive:go --vendor qwen/qwen3.5-122b-a10b:exacto --useToolChoice false --project reddit > archive.qwen-qwen3.5-122b-a10b.reddit.log
pnpm run archive:go --vendor qwen/qwen3.5-122b-a10b:exacto --useToolChoice false --project shopping > archive.qwen-qwen3.5-122b-a10b.shopping.log
pnpm run archive:go --vendor qwen/qwen3.5-122b-a10b:exacto --useToolChoice false --project erp > archive.qwen-qwen3.5-122b-a10b.erp.log

# qwen/qwen3.5-27b (0.195)
pnpm run archive:go --vendor qwen/qwen3.5-27b:exacto --useToolChoice false --project todo > archive.qwen-qwen3.5-27b.todo.log
pnpm run archive:go --vendor qwen/qwen3.5-27b:exacto --useToolChoice false --project reddit > archive.qwen-qwen3.5-27b.reddit.log
pnpm run archive:go --vendor qwen/qwen3.5-27b:exacto --useToolChoice false --project shopping > archive.qwen-qwen3.5-27b.shopping.log
pnpm run archive:go --vendor qwen/qwen3.5-27b:exacto --useToolChoice false --project erp > archive.qwen-qwen3.5-27b.erp.log

# qwen/qwen3.5-35b-a3b (0.1625)
pnpm run archive:go --vendor qwen/qwen3.5-35b-a3b:exacto  --useToolChoice false --project todo > archive.qwen-qwen3.5-35b-a3b.todo.log
pnpm run archive:go --vendor qwen/qwen3.5-35b-a3b:exacto  --useToolChoice false --project reddit > archive.qwen-qwen3.5-35b-a3b.reddit.log
pnpm run archive:go --vendor qwen/qwen3.5-35b-a3b:exacto  --useToolChoice false --project shopping > archive.qwen-qwen3.5-35b-a3b.shopping.log
pnpm run archive:go --vendor qwen/qwen3.5-35b-a3b:exacto  --useToolChoice false --project erp > archive.qwen-qwen3.5-35b-a3b.erp.log

# qwen/qwen3-coder-next (0.12) -> working
pnpm run archive:go --vendor qwen/qwen3-coder-next:exacto --project todo > archive.qwen-qwen3-coder-next.todo.log
pnpm run archive:go --vendor qwen/qwen3-coder-next:exacto --project reddit > archive.qwen-qwen3-coder-next.reddit.log
pnpm run archive:go --vendor qwen/qwen3-coder-next:exacto --project shopping > archive.qwen-qwen3-coder-next.shopping.log
pnpm run archive:go --vendor qwen/qwen3-coder-next:exacto --project erp > archive.qwen-qwen3-coder-next.erp.log

######################################################
# KIMI
######################################################
# moonshotai/kimi-k2.5 (0.45) -> not working
pnpm run archive:go --vendor moonshotai/kimi-k2.5:exacto --project todo > archive.moonshotai-kimi-k2.5.todo.log
pnpm run archive:go --vendor moonshotai/kimi-k2.5:exacto --project reddit > archive.moonshotai-kimi-k2.5.reddit.log
pnpm run archive:go --vendor moonshotai/kimi-k2.5:exacto --project shopping > archive.moonshotai-kimi-k2.5.shopping.log
pnpm run archive:go --vendor moonshotai/kimi-k2.5:exacto --project erp > archive.moonshotai-kimi-k2.5.erp.log

######################################################
# GLM
######################################################
# z-ai/glm-5 (0.95) -> working
pnpm run archive:go --vendor z-ai/glm-5:exacto --useToolChoice false --project todo > archive.z-ai-glm-5.todo.log
pnpm run archive:go --vendor z-ai/glm-5:exacto --useToolChoice false --project reddit > archive.z-ai-glm-5.reddit.log
pnpm run archive:go --vendor z-ai/glm-5:exacto --useToolChoice false --project shopping > archive.z-ai-glm-5.shopping.log
pnpm run archive:go --vendor z-ai/glm-5:exacto --useToolChoice false --project erp > archive.z-ai-glm-5.erp.log

######################################################
# DEEPSEEK
######################################################
# deepseek/deepseek-v3.2 (0.25) -> not working
pnpm run archive:go --vendor deepseek/deepseek-v3.2:exacto --project todo > archive.deepseek-deepseek-v3.2.todo.log
pnpm run archive:go --vendor deepseek/deepseek-v3.2:exacto --project reddit > archive.deepseek-deepseek-v3.2.reddit.log
pnpm run archive:go --vendor deepseek/deepseek-v3.2:exacto --project shopping > archive.deepseek-deepseek-v3.2.shopping.log
pnpm run archive:go --vendor deepseek/deepseek-v3.2:exacto --project erp > archive.deepseek-deepseek-v3.2.erp.log

# deepseek/deepseek-v3.1-terminus:exacto (0.21) -> working
pnpm run archive:go --vendor deepseek/deepseek-v3.1-terminus:exacto --project todo > archive.deepseek-deepseek-v3.1-terminus-exacto.todo.log
pnpm run archive:go --vendor deepseek/deepseek-v3.1-terminus:exacto --project reddit > archive.deepseek-deepseek-v3.1-terminus-exacto.reddit.log
pnpm run archive:go --vendor deepseek/deepseek-v3.1-terminus:exacto --project shopping > archive.deepseek-deepseek-v3.1-terminus-exacto.shopping.log
pnpm run archive:go --vendor deepseek/deepseek-v3.1-terminus:exacto --project erp > archive.deepseek-deepseek-v3.1-terminus-exacto.erp.log

######################################################
# OPENAI
######################################################
# openai/gpt-5.4 (2.50) -> working
pnpm run archive:go --vendor openai/gpt-5.4 --project todo > archive.openai-gpt-5.4.todo.log
pnpm run archive:go --vendor openai/gpt-5.4 --project reddit > archive.openai-gpt-5.4.reddit.log
pnpm run archive:go --vendor openai/gpt-5.4 --project shopping > archive.openai-gpt-5.4.shopping.log
pnpm run archive:go --vendor openai/gpt-5.4 --project erp > archive.openai-gpt-5.4.erp.log
