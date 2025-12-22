#!/bin/bash
pnpm run build:prompt

################################################
# ANTHROPIC
################################################
run_anthropic_sonnet() {
    echo "Starting anthropic/claude-sonnet-4.5..."
    pnpm run archive:go --vendor anthropic/claude-sonnet-4.5 --project todo > archive.claude-sonnet-4.5.todo.log
    pnpm run archive:go --vendor anthropic/claude-sonnet-4.5 --project bbs > archive.claude-sonnet-4.5.bbs.log
    pnpm run archive:go --vendor anthropic/claude-sonnet-4.5 --project reddit > archive.claude-sonnet-4.5.reddit.log
    pnpm run archive:go --vendor anthropic/claude-sonnet-4.5 --project shopping > archive.claude-sonnet-4.5.shopping.log
    echo "Completed anthropic/claude-sonnet-4.5"
}

run_anthropic_haiku() {
    echo "Starting anthropic/claude-haiku-4.5..."
    pnpm run archive:go --vendor anthropic/claude-haiku-4.5 --project todo > archive.claude-haiku-4.5.todo.log
    pnpm run archive:go --vendor anthropic/claude-haiku-4.5 --project bbs > archive.claude-haiku-4.5.bbs.log
    pnpm run archive:go --vendor anthropic/claude-haiku-4.5 --project reddit > archive.claude-haiku-4.5.reddit.log
    pnpm run archive:go --vendor anthropic/claude-haiku-4.5 --project shopping > archive.claude-haiku-4.5.shopping.log
    echo "Completed anthropic/claude-haiku-4.5"
}

################################################
# GOOGLE
################################################
run_google_gemini_pro() {
    echo "Starting google/gemini-2.5-pro..."
    pnpm run archive:go --vendor google/gemini-2.5-pro --project todo > archive.google-gemini-2.5-pro.todo.log
    pnpm run archive:go --vendor google/gemini-2.5-pro --project bbs > archive.google-gemini-2.5-pro.bbs.log
    pnpm run archive:go --vendor google/gemini-2.5-pro --project reddit > archive.google-gemini-2.5-pro.reddit.log
    pnpm run archive:go --vendor google/gemini-2.5-pro --project shopping > archive.google-gemini-2.5-pro.shopping.log
    echo "Completed google/gemini-2.5-pro"
}

################################################
# OPENAI
################################################
run_openai_gpt41() {
    echo "Starting openai/gpt-4.1..."
    pnpm run archive:go --vendor openai/gpt-4.1 --project todo > archive.openai-gpt-4.1.todo.log
    pnpm run archive:go --vendor openai/gpt-4.1 --project bbs > archive.openai-gpt-4.1.bbs.log
    pnpm run archive:go --vendor openai/gpt-4.1 --project reddit > archive.openai-gpt-4.1.reddit.log
    pnpm run archive:go --vendor openai/gpt-4.1 --project shopping > archive.openai-gpt-4.1.shopping.log
    echo "Completed openai/gpt-4.1"
}

run_openai_gpt41_mini() {
    echo "Starting openai/gpt-4.1-mini..."
    pnpm run archive:go --vendor openai/gpt-4.1-mini --project todo > archive.openai-gpt-4.1-mini.todo.log
    pnpm run archive:go --vendor openai/gpt-4.1-mini --project bbs > archive.openai-gpt-4.1-mini.bbs.log
    pnpm run archive:go --vendor openai/gpt-4.1-mini --project reddit > archive.openai-gpt-4.1-mini.reddit.log
    pnpm run archive:go --vendor openai/gpt-4.1-mini --project shopping > archive.openai-gpt-4.1-mini.shopping.log
    echo "Completed openai/gpt-4.1-mini"
}

run_openai_gpt52() {
    echo "Starting openai/gpt-5.2..."
    pnpm run archive:go --vendor openai/gpt-5.2 --project todo > archive.openai-gpt-5.2.todo.log
    pnpm run archive:go --vendor openai/gpt-5.2 --project bbs > archive.openai-gpt-5.2.bbs.log
    pnpm run archive:go --vendor openai/gpt-5.2 --project reddit > archive.openai-gpt-5.2.reddit.log
    pnpm run archive:go --vendor openai/gpt-5.2 --project shopping > archive.openai-gpt-5.2.shopping.log
    echo "Completed openai/gpt-5.2"
}

run_openai_oss() {
    echo "Starting openai/gpt-oss-120b..."
    pnpm run archive:go --vendor openai/gpt-oss-120b --project todo > archive.gpt-oss-120b.todo.log
    pnpm run archive:go --vendor openai/gpt-oss-120b --project bbs > archive.gpt-oss-120b.bbs.log
    pnpm run archive:go --vendor openai/gpt-oss-120b --project reddit > archive.gpt-oss-120b.reddit.log
    pnpm run archive:go --vendor openai/gpt-oss-120b --project shopping > archive.gpt-oss-120b.shopping.log
    echo "Completed openai/gpt-oss-120b"
}

################################################
# GROK
################################################
run_grok_4_fast() {
    echo "Starting x-ai/grok-4-fast..."
    pnpm run archive:go --vendor x-ai/grok-4-fast --project todo > archive.x-ai-grok-4-fast.todo.log
    pnpm run archive:go --vendor x-ai/grok-4-fast --project bbs > archive.x-ai-grok-4-fast.bbs.log
    pnpm run archive:go --vendor x-ai/grok-4-fast --project reddit > archive.x-ai-grok-4-fast.reddit.log
    pnpm run archive:go --vendor x-ai/grok-4-fast --project shopping > archive.x-ai-grok-4-fast.shopping.log
    echo "Completed x-ai/grok-4-fast"
}

run_grok_code_fast() {
    echo "Starting x-ai/grok-code-fast-1..."
    pnpm run archive:go --vendor x-ai/grok-code-fast-1 --project todo > archive.x-ai-grok-code-fast-1.todo.log
    pnpm run archive:go --vendor x-ai/grok-code-fast-1 --project bbs > archive.x-ai-grok-code-fast-1.bbs.log
    pnpm run archive:go --vendor x-ai/grok-code-fast-1 --project reddit > archive.x-ai-grok-code-fast-1.reddit.log
    pnpm run archive:go --vendor x-ai/grok-code-fast-1 --project shopping > archive.x-ai-grok-code-fast-1.shopping.log
    echo "Completed x-ai/grok-code-fast-1"
}

################################################
# DEEPSEEK
################################################
run_deepseek_terminus() {
    echo "Starting deepseek/deepseek-v3.1-terminus:exacto..."
    pnpm run archive:go --vendor deepseek/deepseek-v3.1-terminus:exacto --project todo > archive.deepseek-v3.1-terminus.todo.log
    pnpm run archive:go --vendor deepseek/deepseek-v3.1-terminus:exacto --project bbs > archive.deepseek-v3.1-terminus.bbs.log
    pnpm run archive:go --vendor deepseek/deepseek-v3.1-terminus:exacto --project reddit > archive.deepseek-v3.1-terminus.reddit.log
    pnpm run archive:go --vendor deepseek/deepseek-v3.1-terminus:exacto --project shopping > archive.deepseek-v3.1-terminus.shopping.log
    echo "Completed deepseek/deepseek-v3.1-terminus:exacto"
}

run_deepseek_exp() {
    echo "Starting deepseek/deepseek-v3.2-exp..."
    pnpm run archive:go --vendor deepseek/deepseek-v3.2-exp --project todo > archive.deepseek-v3.2-exp.todo.log
    pnpm run archive:go --vendor deepseek/deepseek-v3.2-exp --project bbs > archive.deepseek-v3.2-exp.bbs.log
    pnpm run archive:go --vendor deepseek/deepseek-v3.2-exp --project reddit > archive.deepseek-v3.2-exp.reddit.log
    pnpm run archive:go --vendor deepseek/deepseek-v3.2-exp --project shopping > archive.deepseek-v3.2-exp.shopping.log
    echo "Completed deepseek/deepseek-v3.2-exp"
}

################################################
# LLAMA
################################################
run_llama_maverick() {
    echo "Starting meta-llama/llama-4-maverick..."
    pnpm run archive:go --vendor meta-llama/llama-4-maverick --project todo > archive.meta-llama-llama-4-maverick.todo.log
    pnpm run archive:go --vendor meta-llama/llama-4-maverick --project bbs > archive.meta-llama-llama-4-maverick.bbs.log
    pnpm run archive:go --vendor meta-llama/llama-4-maverick --project reddit > archive.meta-llama-llama-4-maverick.reddit.log
    pnpm run archive:go --vendor meta-llama/llama-4-maverick --project shopping > archive.meta-llama-llama-4-maverick.shopping.log
    echo "Completed meta-llama/llama-4-maverick"
}

run_llama_scout() {
    echo "Starting meta-llama/llama-4-scout..."
    pnpm run archive:go --vendor meta-llama/llama-4-scout --project todo > archive.meta-llama-llama-4-scout.todo.log
    pnpm run archive:go --vendor meta-llama/llama-4-scout --project bbs > archive.meta-llama-llama-4-scout.bbs.log
    pnpm run archive:go --vendor meta-llama/llama-4-scout --project reddit > archive.meta-llama-llama-4-scout.reddit.log
    pnpm run archive:go --vendor meta-llama/llama-4-scout --project shopping > archive.meta-llama-llama-4-scout.shopping.log
    echo "Completed meta-llama/llama-4-scout"
}

################################################
# QWEN3
################################################
run_qwen_instruct() {
    echo "Starting qwen/qwen3-next-80b-a3b-instruct..."
    pnpm run archive:go --vendor qwen/qwen3-next-80b-a3b-instruct --project todo > archive.qwen-qwen3-next-80b-a3b-instruct.todo.log
    pnpm run archive:go --vendor qwen/qwen3-next-80b-a3b-instruct --project bbs > archive.qwen-qwen3-next-80b-a3b-instruct.bbs.log
    pnpm run archive:go --vendor qwen/qwen3-next-80b-a3b-instruct --project reddit > archive.qwen-qwen3-next-80b-a3b-instruct.reddit.log
    pnpm run archive:go --vendor qwen/qwen3-next-80b-a3b-instruct --project shopping > archive.qwen-qwen3-next-80b-a3b-instruct.shopping.log
    echo "Completed qwen/qwen3-next-80b-a3b-instruct"
}

run_qwen_thinking() {
    echo "Starting qwen/qwen3-next-80b-a3b-thinking..."
    pnpm run archive:go --vendor qwen/qwen3-next-80b-a3b-thinking --project todo > archive.qwen-qwen3-next-80b-a3b-thinking.todo.log
    pnpm run archive:go --vendor qwen/qwen3-next-80b-a3b-thinking --project bbs > archive.qwen-qwen3-next-80b-a3b-thinking.bbs.log
    pnpm run archive:go --vendor qwen/qwen3-next-80b-a3b-thinking --project reddit > archive.qwen-qwen3-next-80b-a3b-thinking.reddit.log
    pnpm run archive:go --vendor qwen/qwen3-next-80b-a3b-thinking --project shopping > archive.qwen-qwen3-next-80b-a3b-thinking.shopping.log
    echo "Completed qwen/qwen3-next-80b-a3b-thinking"
}

run_qwen_coder() {
    echo "Starting qwen/qwen3-coder:exacto..."
    pnpm run archive:go --vendor qwen/qwen3-coder:exacto --project todo > archive.qwen-qwen3-coder.todo.log
    pnpm run archive:go --vendor qwen/qwen3-coder:exacto --project bbs > archive.qwen-qwen3-coder.bbs.log
    pnpm run archive:go --vendor qwen/qwen3-coder:exacto --project reddit > archive.qwen-qwen3-coder.reddit.log
    pnpm run archive:go --vendor qwen/qwen3-coder:exacto --project shopping > archive.qwen-qwen3-coder.shopping.log
    echo "Completed qwen/qwen3-coder:exacto"
}

################################################
# MISTRAL
################################################
run_mistral_codestral() {
    echo "Starting mistralai/codestral-2508..."
    pnpm run archive:go --vendor mistralai/codestral-2508 --project todo > archive.mistralai-codestral-2508.todo.log
    pnpm run archive:go --vendor mistralai/codestral-2508 --project bbs > archive.mistralai-codestral-2508.bbs.log
    pnpm run archive:go --vendor mistralai/codestral-2508 --project reddit > archive.mistralai-codestral-2508.reddit.log
    pnpm run archive:go --vendor mistralai/codestral-2508 --project shopping > archive.mistralai-codestral-2508.shopping.log
    echo "Completed mistralai/codestral-2508"
}

run_mistral_devstral() {
    echo "Starting mistralai/devstral-medium..."
    pnpm run archive:go --vendor mistralai/devstral-medium --project todo > archive.mistralai-devstral-medium.todo.log
    pnpm run archive:go --vendor mistralai/devstral-medium --project bbs > archive.mistralai-devstral-medium.bbs.log
    pnpm run archive:go --vendor mistralai/devstral-medium --project reddit > archive.mistralai-devstral-medium.reddit.log
    pnpm run archive:go --vendor mistralai/devstral-medium --project shopping > archive.mistralai-devstral-medium.shopping.log
    echo "Completed mistralai/devstral-medium"
}

################################################
# GLM
################################################
run_glm() {
    echo "Starting z-ai/glm-4.6:exacto..."
    pnpm run archive:go --vendor z-ai/glm-4.6:exacto --project todo > archive.z-ai-glm-4.6.todo.log
    pnpm run archive:go --vendor z-ai/glm-4.6:exacto --project bbs > archive.z-ai-glm-4.6.bbs.log
    pnpm run archive:go --vendor z-ai/glm-4.6:exacto --project reddit > archive.z-ai-glm-4.6.reddit.log
    pnpm run archive:go --vendor z-ai/glm-4.6:exacto --project shopping > archive.z-ai-glm-4.6.shopping.log
    echo "Completed z-ai/glm-4.6:exacto"
}

################################################
# KIMI
################################################
run_kimi() {
    echo "Starting moonshotai/kimi-k2-0905:exacto..."
    pnpm run archive:go --vendor moonshotai/kimi-k2-0905:exacto --project todo > archive.moonshotai-kimi-k2-0905.todo.log
    pnpm run archive:go --vendor moonshotai/kimi-k2-0905:exacto --project bbs > archive.moonshotai-kimi-k2-0905.bbs.log
    pnpm run archive:go --vendor moonshotai/kimi-k2-0905:exacto --project reddit > archive.moonshotai-kimi-k2-0905.reddit.log
    pnpm run archive:go --vendor moonshotai/kimi-k2-0905:exacto --project shopping > archive.moonshotai-kimi-k2-0905.shopping.log
    echo "Completed moonshotai/kimi-k2-0905:exacto"
}

################################################
# MINIMAX
################################################
run_minimax() {
    echo "Starting minimax/minimax-m2..."
    pnpm run archive:go --vendor minimax/minimax-m2 --project todo > archive.minimax-minimax-m2.todo.log
    pnpm run archive:go --vendor minimax/minimax-m2 --project bbs > archive.minimax-minimax-m2.bbs.log
    pnpm run archive:go --vendor minimax/minimax-m2 --project reddit > archive.minimax-minimax-m2.reddit.log
    pnpm run archive:go --vendor minimax/minimax-m2 --project shopping > archive.minimax-minimax-m2.shopping.log
    echo "Completed minimax/minimax-m2"
}

################################################
# 모든 모델을 병렬로 실행
################################################
echo "=== 작업 시작 ==="
echo "각 모델별로 프로젝트를 순차 실행하고, 모델끼리는 병렬로 실행합니다."
echo ""

run_anthropic_sonnet &
run_anthropic_haiku &
run_google_gemini_pro &
run_openai_gpt41 &
run_openai_gpt41_mini &
run_openai_gpt52 &
run_openai_oss &
run_grok_4_fast &
run_grok_code_fast &
run_deepseek_terminus &
run_deepseek_exp &
run_llama_maverick &
run_llama_scout &
run_qwen_instruct &
run_qwen_thinking &
run_qwen_coder &
run_mistral_codestral &
run_mistral_devstral &
run_glm &
run_kimi &
run_minimax &

wait
echo ""
echo "=== 모든 작업 완료! ==="
