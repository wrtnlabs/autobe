#!/bin/bash
set -e

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

# Mode: "scoring" (fast, no server) or "full" (with runtime + golden set)
MODE="${1:-scoring}"

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
    if [ "$MODE" = "full" ]; then
      ARGS="$ARGS --run-tests --golden --project $PROJECT"
    fi

    if node "$ESTIMATE/dist/bin/estimate.js" $ARGS 2>&1 | tail -3; then
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
