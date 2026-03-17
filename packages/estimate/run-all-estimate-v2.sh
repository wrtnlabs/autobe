#!/bin/bash
# Run estimate for ALL models × projects in autobe-examples
# Usage: cd packages/estimate && bash run-all-estimate-v2.sh

set -e

EXAMPLES="/Users/yongrean/Downloads/autobe-examples"
REPORTS="reports/benchmark"

# Discover all model/project combos (exclude .git and raw)
COMBOS=$(find "$EXAMPLES" -maxdepth 3 -mindepth 3 -type d \
  ! -path "*/.git/*" ! -path "*/raw/*" | sort)

for combo in $COMBOS; do
  # Extract project (last dir), model path (2 dirs before)
  project=$(basename "$combo")
  model_dir=$(dirname "$combo")
  model_name=$(basename "$model_dir")

  # Skip gauzy (no estimate support yet)
  if [ "$project" = "gauzy" ]; then
    echo "SKIP: $model_name/$project (gauzy not supported)"
    continue
  fi

  OUTPUT_PATH="$REPORTS/$model_name/$project"
  mkdir -p "$OUTPUT_PATH"

  echo ""
  echo "=========================================="
  echo "  $model_name / $project"
  echo "=========================================="

  npx ts-node src/bin/estimate.ts \
    -i "$combo" \
    -o "$OUTPUT_PATH" \
    --use-agent \
    --project "$project" \
    --continue-on-gate-failure \
    2>&1 | tee "estimate.$model_name.$project.log"
done

echo ""
echo "All estimates complete!"
