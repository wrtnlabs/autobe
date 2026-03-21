#!/bin/bash
pnpm run build:prompt

######################################################
# QWEN
######################################################
# qwen/qwen3.5-397b-a17b (0.39)
pnpm run archive:go --vendor qwen/qwen3.5-397b-a17b --useToolChoice false --project todo > archive.qwen-qwen3.5-397b-a17b.todo.log
pnpm run archive:go --vendor qwen/qwen3.5-397b-a17b --useToolChoice false --project reddit > archive.qwen-qwen3.5-397b-a17b.reddit.log
pnpm run archive:go --vendor qwen/qwen3.5-397b-a17b --useToolChoice false --project shopping > archive.qwen-qwen3.5-397b-a17b.shopping.log
pnpm run archive:go --vendor qwen/qwen3.5-397b-a17b --useToolChoice false --project erp > archive.qwen-qwen3.5-397b-a17b.erp.log

# qwen/qwen3.5-122b-a10b (0.26)
pnpm run archive:go --vendor qwen/qwen3.5-122b-a10b --useToolChoice false --project todo > archive.qwen-qwen3.5-122b-a10b.todo.log
pnpm run archive:go --vendor qwen/qwen3.5-122b-a10b --useToolChoice false --project reddit > archive.qwen-qwen3.5-122b-a10b.reddit.log
pnpm run archive:go --vendor qwen/qwen3.5-122b-a10b --useToolChoice false --project shopping > archive.qwen-qwen3.5-122b-a10b.shopping.log
pnpm run archive:go --vendor qwen/qwen3.5-122b-a10b --useToolChoice false --project erp > archive.qwen-qwen3.5-122b-a10b.erp.log

# qwen/qwen3.5-27b (0.195)
pnpm run archive:go --vendor qwen/qwen3.5-27b --useToolChoice false --project todo > archive.qwen-qwen3.5-27b.todo.log
pnpm run archive:go --vendor qwen/qwen3.5-27b --useToolChoice false --project reddit > archive.qwen-qwen3.5-27b.reddit.log
pnpm run archive:go --vendor qwen/qwen3.5-27b --useToolChoice false --project shopping > archive.qwen-qwen3.5-27b.shopping.log
pnpm run archive:go --vendor qwen/qwen3.5-27b --useToolChoice false --project erp > archive.qwen-qwen3.5-27b.erp.log

# qwen/qwen3.5-35b-a3b (0.1625)
pnpm run archive:go --vendor qwen/qwen3.5-35b-a3b  --useToolChoice false --project todo > archive.qwen-qwen3.5-35b-a3b.todo.log
pnpm run archive:go --vendor qwen/qwen3.5-35b-a3b  --useToolChoice false --project reddit > archive.qwen-qwen3.5-35b-a3b.reddit.log
pnpm run archive:go --vendor qwen/qwen3.5-35b-a3b  --useToolChoice false --project shopping > archive.qwen-qwen3.5-35b-a3b.shopping.log
pnpm run archive:go --vendor qwen/qwen3.5-35b-a3b  --useToolChoice false --project erp > archive.qwen-qwen3.5-35b-a3b.erp.log

# qwen/qwen3-coder-next (0.12) -> working
pnpm run archive:go --vendor qwen/qwen3-coder-next --project todo > archive.qwen-qwen3-coder-next.todo.log
pnpm run archive:go --vendor qwen/qwen3-coder-next --project reddit > archive.qwen-qwen3-coder-next.reddit.log
pnpm run archive:go --vendor qwen/qwen3-coder-next --project shopping > archive.qwen-qwen3-coder-next.shopping.log
pnpm run archive:go --vendor qwen/qwen3-coder-next --project erp > archive.qwen-qwen3-coder-next.erp.log

######################################################
# KIMI
######################################################
# moonshotai/kimi-k2.5 (0.45) -> working
pnpm run archive:go --vendor moonshotai/kimi-k2.5 --project todo > archive.moonshotai-kimi-k2.5.todo.log
pnpm run archive:go --vendor moonshotai/kimi-k2.5 --project reddit > archive.moonshotai-kimi-k2.5.reddit.log
pnpm run archive:go --vendor moonshotai/kimi-k2.5 --project shopping > archive.moonshotai-kimi-k2.5.shopping.log
pnpm run archive:go --vendor moonshotai/kimi-k2.5 --project erp > archive.moonshotai-kimi-k2.5.erp.log

######################################################
# GLM
######################################################
# z-ai/glm-5 (0.72) -> working
pnpm run archive:go --vendor z-ai/glm-5 --useToolChoice false --project todo > archive.z-ai-glm-5.todo.log
pnpm run archive:go --vendor z-ai/glm-5 --useToolChoice false --project reddit > archive.z-ai-glm-5.reddit.log
pnpm run archive:go --vendor z-ai/glm-5 --useToolChoice false --project shopping > archive.z-ai-glm-5.shopping.log
pnpm run archive:go --vendor z-ai/glm-5 --useToolChoice false --project erp > archive.z-ai-glm-5.erp.log

# z-ai/glm-5-turbo (0.90) -> not working
pnpm run archive:go --vendor z-ai/glm-5-turbo --useToolChoice false --project todo > archive.z-ai-glm-5-turbo.todo.log
pnpm run archive:go --vendor z-ai/glm-5-turbo --useToolChoice false --project reddit > archive.z-ai-glm-5-turbo.reddit.log
pnpm run archive:go --vendor z-ai/glm-5-turbo --useToolChoice false --project shopping > archive.z-ai-glm-5-turbo.shopping.log
pnpm run archive:go --vendor z-ai/glm-5-turbo --useToolChoice false --project erp > archive.z-ai-glm-5-turbo.erp.log

######################################################
# MINIMAX
######################################################
# minimax/minimax-m2.7 (0.30) -> working
pnpm run archive:go --vendor minimax/minimax-m2.7 --useToolChoice false --project todo > archive.minimax-minimax-m2.7.todo.log
pnpm run archive:go --vendor minimax/minimax-m2.7 --useToolChoice false --project reddit > archive.minimax-minimax-m2.7.reddit.log
pnpm run archive:go --vendor minimax/minimax-m2.7 --useToolChoice false --project shopping > archive.minimax-minimax-m2.7.shopping.log
pnpm run archive:go --vendor minimax/minimax-m2.7 --useToolChoice false --project erp > archive.minimax-minimax-m2.7.erp.log

######################################################
# DEEPSEEK
######################################################
# deepseek/deepseek-v3.2 (0.25) -> working
pnpm run archive:go --vendor deepseek/deepseek-v3.2 --project todo > archive.deepseek-deepseek-v3.2.todo.log
pnpm run archive:go --vendor deepseek/deepseek-v3.2 --project reddit > archive.deepseek-deepseek-v3.2.reddit.log
pnpm run archive:go --vendor deepseek/deepseek-v3.2 --project shopping > archive.deepseek-deepseek-v3.2.shopping.log
pnpm run archive:go --vendor deepseek/deepseek-v3.2 --project erp > archive.deepseek-deepseek-v3.2.erp.log

######################################################
# OPENAI
######################################################
# openai/gpt-5.4 (2.50) -> working
pnpm run archive:go --vendor openai/gpt-5.4 --project todo > archive.openai-gpt-5.4.todo.log
pnpm run archive:go --vendor openai/gpt-5.4 --project reddit > archive.openai-gpt-5.4.reddit.log
pnpm run archive:go --vendor openai/gpt-5.4 --project shopping > archive.openai-gpt-5.4.shopping.log
pnpm run archive:go --vendor openai/gpt-5.4 --project erp > archive.openai-gpt-5.4.erp.log

# openai/gpt-5.4-mini (0.75) -> working
pnpm run archive:go --vendor openai/gpt-5.4-mini --project todo > archive.openai-gpt-5.4-mini.todo.log
pnpm run archive:go --vendor openai/gpt-5.4-mini --project reddit > archive.openai-gpt-5.4-mini.reddit.log
pnpm run archive:go --vendor openai/gpt-5.4-mini --project shopping > archive.openai-gpt-5.4-mini.shopping.log
pnpm run archive:go --vendor openai/gpt-5.4-mini --project erp > archive.openai-gpt-5.4-mini.erp.log

# openai/gpt-5.4-nano (0.25)
pnpm run archive:go --vendor openai/gpt-5.4-nano --project todo > archive.openai-gpt-5.4-nano.todo.log
pnpm run archive:go --vendor openai/gpt-5.4-nano --project reddit > archive.openai-gpt-5.4-nano.reddit.log
pnpm run archive:go --vendor openai/gpt-5.4-nano --project shopping > archive.openai-gpt-5.4-nano.shopping.log
pnpm run archive:go --vendor openai/gpt-5.4-nano --project erp > archive.openai-gpt-5.4-nano.erp.log

#######################################################
# ANTHROPIC
#######################################################
# anthropic/claude-sonnet-4.6 (3.00) -> working
pnpm run archive:go --vendor anthropic/claude-sonnet-4.6 --project todo > archive.anthropic-claude-sonnet-4.6.todo.log
pnpm run archive:go --vendor anthropic/claude-sonnet-4.6 --project reddit > archive.anthropic-claude-sonnet-4.6.reddit.log
pnpm run archive:go --vendor anthropic/claude-sonnet-4.6 --project shopping > archive.anthropic-claude-sonnet-4.6.shopping.log
pnpm run archive:go --vendor anthropic/claude-sonnet-4.6 --project erp > archive.anthropic-claude-sonnet-4.6.erp.log
