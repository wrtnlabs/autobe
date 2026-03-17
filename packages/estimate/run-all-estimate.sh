#!/bin/bash
# Run estimate for all new models × projects
# Usage: cd packages/estimate && bash run-all-estimate.sh

set -e

EXAMPLES="/Users/yongrean/Downloads/autobe-examples"
REPORTS="reports/benchmark"

MODELS=(
  "anthropic/claude-sonnet-4.6:claude-sonnet-4.6"
  "deepseek/deepseek-v3.2:deepseek-v3.2"
  "moonshotai/kimi-k2.5:kimi-k2.5"
  "openai/gpt-5.4:gpt-5.4"
  "qwen/qwen3.5-122b-a10b:qwen3.5-122b-a10b"
  "qwen/qwen3.5-35b-a3b:qwen3.5-35b-a3b"
  "qwen/qwen3.5-397b-a17b:qwen3.5-397b-a17b"
  "z-ai/glm-5:glm-5"
)

PROJECTS=("todo" "reddit" "shopping")

for entry in "${MODELS[@]}"; do
  INPUT_DIR="${entry%%:*}"
  REPORT_NAME="${entry##*:}"

  for project in "${PROJECTS[@]}"; do
    INPUT_PATH="$EXAMPLES/$INPUT_DIR/$project"
    OUTPUT_PATH="$REPORTS/$REPORT_NAME/$project"

    if [ ! -d "$INPUT_PATH" ]; then
      echo "SKIP: $INPUT_PATH not found"
      continue
    fi

    # Always re-evaluate (overwrite existing reports)
    mkdir -p "$OUTPUT_PATH"

    echo ""
    echo "=========================================="
    echo "  $REPORT_NAME / $project"
    echo "=========================================="

    npx ts-node src/bin/estimate.ts \
      -i "$INPUT_PATH" \
      -o "$OUTPUT_PATH" \
      --use-agent \
      --project "$project" \
      --continue-on-gate-failure \
      2>&1 | tee "estimate.$REPORT_NAME.$project.log"
  done
done

echo ""
echo "All estimates complete!"
