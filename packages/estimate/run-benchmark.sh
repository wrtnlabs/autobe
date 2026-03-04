#!/bin/bash
set -e

# Load .env from estimate package
ENV_FILE="$(cd "$(dirname "$0")" && pwd)/.env"
if [ -f "$ENV_FILE" ]; then
  set -a
  source "$ENV_FILE"
  set +a
fi

MODELS=(
  "gpt-4.1-mini:openai/gpt-4.1-mini"
  "qwen3-30b:qwen/qwen3-30b-a3b-thinking-2507"
  "qwen3-80b:qwen/qwen3-next-80b-a3b-instruct"
  "qwen3-coder:qwen/qwen3-coder-next"
  "deepseek-v3.1:deepseek/deepseek-v3.1-terminus-exacto"
)
PROJECTS=("todo" "bbs" "reddit" "shopping")
BASE="$HOME/Downloads/autobe-examples"
ESTIMATE="$HOME/Downloads/autobe/packages/estimate"

# Mode: "scoring" (fast, no server), "agent" (with AI agents), or "full" (agent + runtime + golden set)
MODE="${1:-scoring}"

if [ "$MODE" = "agent" ] || [ "$MODE" = "full" ]; then
  if [ -z "$OPENROUTER_API_KEY" ]; then
    echo "ERROR: OPENROUTER_API_KEY is required for mode=$MODE"
    echo "  export OPENROUTER_API_KEY=sk-or-..."
    exit 1
  fi
fi

PASSED=0
FAILED=0
TOTAL=0
TOTAL_COUNT=$((${#MODELS[@]} * ${#PROJECTS[@]}))

for MODEL in "${MODELS[@]}"; do
  MODEL_NAME="${MODEL%%:*}"
  MODEL_PATH="${MODEL##*:}"
  for PROJECT in "${PROJECTS[@]}"; do
    TOTAL=$((TOTAL + 1))
    INPUT="$BASE/$MODEL_PATH/$PROJECT"
    OUTPUT="$ESTIMATE/reports/benchmark/$MODEL_NAME/$PROJECT"

    if [ ! -d "$INPUT" ]; then
      echo "SKIP: $INPUT does not exist"
      FAILED=$((FAILED + 1))
      continue
    fi

    echo "[$TOTAL/$TOTAL_COUNT] $MODEL_NAME / $PROJECT ($MODE)"

    ARGS="-i $INPUT -o $OUTPUT"
    if [ "$MODE" = "agent" ]; then
      ARGS="$ARGS --use-agent"
    elif [ "$MODE" = "full" ]; then
      ARGS="$ARGS --use-agent --run-tests --golden --project $PROJECT"
    fi

    if npx tsx "$ESTIMATE/dist/bin/estimate.js" $ARGS 2>&1 | tail -3; then
      PASSED=$((PASSED + 1))
    else
      echo "  ERROR: evaluation failed"
      FAILED=$((FAILED + 1))
    fi

    echo "────────────────────────────────────────"
  done
done

echo ""
echo "Benchmark complete: $PASSED passed, $FAILED failed (total $TOTAL)"
