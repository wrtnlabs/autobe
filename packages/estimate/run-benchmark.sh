#!/bin/bash
set -e

# ── Configuration ──────────────────────────────────────────
# Override these with environment variables if needed:
#   ESTIMATE_BASE=/custom/path ./run-benchmark.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Load .env from estimate package
ENV_FILE="$SCRIPT_DIR/.env"
if [ -f "$ENV_FILE" ]; then
  set -a
  source "$ENV_FILE"
  set +a
fi

# Base directory for test results (default: test/results in monorepo root)
ESTIMATE_BASE="${ESTIMATE_BASE:-$(cd "$SCRIPT_DIR/../.." && pwd)/test/results}"

# Estimate package directory
ESTIMATE_DIR="$SCRIPT_DIR"

# Models to benchmark (format: "display-name:openrouter-model-id")
MODELS=(
  "gpt-4.1-mini:openai/gpt-4.1-mini"
  "gpt-4.1:openai/gpt-4.1"
  "qwen3-80b:qwen/qwen3-next-80b-a3b-instruct"
)

# Projects to evaluate
PROJECTS=("todo" "bbs" "reddit" "shopping" "erp")

# Mode: "scoring" (fast, no server), "agent" (with AI agents), or "full" (agent + runtime + golden set)
MODE="${1:-scoring}"

# ── Validation ─────────────────────────────────────────────

if [ "$MODE" = "agent" ] || [ "$MODE" = "full" ]; then
  if [ -z "$OPENROUTER_API_KEY" ]; then
    echo "ERROR: OPENROUTER_API_KEY is required for mode=$MODE"
    echo "  export OPENROUTER_API_KEY=sk-or-..."
    exit 1
  fi
fi

if [ ! -d "$ESTIMATE_BASE" ]; then
  echo "ERROR: Base directory not found: $ESTIMATE_BASE"
  echo "  Set ESTIMATE_BASE environment variable to your test results path"
  echo "  Example: ESTIMATE_BASE=~/autobe-examples ./run-benchmark.sh"
  exit 1
fi

# ── Build check ────────────────────────────────────────────

if [ ! -f "$ESTIMATE_DIR/dist/bin/estimate.js" ]; then
  echo "Building estimate package..."
  (cd "$ESTIMATE_DIR" && npx tsc --build)
fi

# ── Run benchmarks ─────────────────────────────────────────

PASSED=0
FAILED=0
SKIPPED=0
TOTAL=0
TOTAL_COUNT=$((${#MODELS[@]} * ${#PROJECTS[@]}))

for MODEL in "${MODELS[@]}"; do
  MODEL_NAME="${MODEL%%:*}"
  MODEL_PATH="${MODEL##*:}"
  for PROJECT in "${PROJECTS[@]}"; do
    TOTAL=$((TOTAL + 1))

    # Try multiple path patterns
    INPUT=""
    for CANDIDATE in \
      "$ESTIMATE_BASE/$MODEL_PATH/$PROJECT/realize" \
      "$ESTIMATE_BASE/$MODEL_PATH/$PROJECT" \
      "$ESTIMATE_BASE/$MODEL_NAME/$PROJECT/realize" \
      "$ESTIMATE_BASE/$MODEL_NAME/$PROJECT"; do
      if [ -d "$CANDIDATE/src" ]; then
        INPUT="$CANDIDATE"
        break
      fi
    done

    if [ -z "$INPUT" ]; then
      echo "SKIP [$TOTAL/$TOTAL_COUNT]: $MODEL_NAME/$PROJECT — no src/ found"
      SKIPPED=$((SKIPPED + 1))
      continue
    fi

    OUTPUT="$ESTIMATE_DIR/reports/benchmark/$MODEL_NAME/$PROJECT"

    echo "[$TOTAL/$TOTAL_COUNT] $MODEL_NAME / $PROJECT ($MODE)"
    echo "  Input: $INPUT"

    ARGS="-i $INPUT -o $OUTPUT"
    if [ "$MODE" = "agent" ]; then
      ARGS="$ARGS --use-agent"
    elif [ "$MODE" = "full" ]; then
      ARGS="$ARGS --use-agent --run-tests --golden --project $PROJECT"
    fi

    if npx tsx "$ESTIMATE_DIR/dist/bin/estimate.js" $ARGS 2>&1 | tail -3; then
      PASSED=$((PASSED + 1))
    else
      echo "  ERROR: evaluation failed"
      FAILED=$((FAILED + 1))
    fi

    echo "────────────────────────────────────────"
  done
done

echo ""
echo "Benchmark complete: $PASSED passed, $FAILED failed, $SKIPPED skipped (total $TOTAL)"

# ── Summary table ──────────────────────────────────────────

read_score() {
  local report="$1"
  if [ -f "$report" ]; then
    python3 -c "
import json
d = json.load(open('$report'))
print(str(d.get('totalScore','?')) + '(' + str(d.get('grade','?')) + ')')
" 2>/dev/null || echo "?"
  else
    echo "--"
  fi
}

echo ""
echo "┌──────────────────┬────────┬────────┬────────┬──────────┬────────┐"
printf "│ %-16s │ %-6s │ %-6s │ %-6s │ %-8s │ %-6s │\n" "Model" "todo" "bbs" "reddit" "shopping" "erp"
echo "├──────────────────┼────────┼────────┼────────┼──────────┼────────┤"

for MODEL in "${MODELS[@]}"; do
  MODEL_NAME="${MODEL%%:*}"
  T=$(read_score "$ESTIMATE_DIR/reports/benchmark/$MODEL_NAME/todo/estimate-report.json")
  B=$(read_score "$ESTIMATE_DIR/reports/benchmark/$MODEL_NAME/bbs/estimate-report.json")
  R=$(read_score "$ESTIMATE_DIR/reports/benchmark/$MODEL_NAME/reddit/estimate-report.json")
  S=$(read_score "$ESTIMATE_DIR/reports/benchmark/$MODEL_NAME/shopping/estimate-report.json")
  G=$(read_score "$ESTIMATE_DIR/reports/benchmark/$MODEL_NAME/erp/estimate-report.json")
  printf "│ %-16s │ %6s │ %6s │ %6s │ %8s │ %6s │\n" "$MODEL_NAME" "$T" "$B" "$R" "$S" "$G"
done

echo "└──────────────────┴────────┴────────┴────────┴──────────┴────────┘"
