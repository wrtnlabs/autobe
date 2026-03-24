#!/bin/bash
set -e

# ── Configuration ──────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Load .env from estimate package
ENV_FILE="$SCRIPT_DIR/.env"
if [ -f "$ENV_FILE" ]; then
  set -a
  source "$ENV_FILE"
  set +a
fi

# autobe-examples directory (auto-discover models/projects)
EXAMPLES_DIR="${EXAMPLES_DIR:-$(cd "$SCRIPT_DIR/../.." && pwd)/../autobe-examples}"

# Estimate package directory
ESTIMATE_DIR="$SCRIPT_DIR"

# Mode: "scoring" (fast, no server), "agent" (with AI agents), or "full" (agent + runtime + golden set)
MODE="${MODE:-scoring}"

# Filters (optional)
FILTER_VENDOR=""
FILTER_MODEL=""
FILTER_PROJECT=""

# ── Parse arguments ───────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --mode)      MODE="$2"; shift 2 ;;
    --vendor)    FILTER_VENDOR="$2"; shift 2 ;;
    --model)     FILTER_MODEL="$2"; shift 2 ;;
    --project)   FILTER_PROJECT="$2"; shift 2 ;;
    --examples)  EXAMPLES_DIR="$2"; shift 2 ;;
    --help|-h)
      echo "Usage: ./run-benchmark.sh [options]"
      echo ""
      echo "Options:"
      echo "  --mode <scoring|agent|full>  Evaluation mode (default: scoring)"
      echo "  --vendor <name>              Run only this vendor (e.g., openai, qwen)"
      echo "  --model <name>               Run only this model (e.g., kimi-k2.5)"
      echo "  --project <name>             Run only this project (e.g., reddit)"
      echo "  --examples <path>            Path to autobe-examples directory"
      echo "  -h, --help                   Show this help"
      echo ""
      echo "Examples:"
      echo "  ./run-benchmark.sh                           # all models, scoring mode"
      echo "  ./run-benchmark.sh --mode agent              # all models, with AI agents"
      echo "  ./run-benchmark.sh --vendor openai            # all openai models only"
      echo "  ./run-benchmark.sh --model kimi-k2.5         # specific model only"
      echo "  ./run-benchmark.sh --project reddit          # specific project only"
      echo "  ./run-benchmark.sh --vendor qwen --project todo"
      exit 0
      ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# ── Validation ─────────────────────────────────────────────

if [ "$MODE" = "agent" ] || [ "$MODE" = "full" ]; then
  if [ -z "$OPENROUTER_API_KEY" ]; then
    echo "ERROR: OPENROUTER_API_KEY is required for mode=$MODE"
    echo "  export OPENROUTER_API_KEY=sk-or-..."
    exit 1
  fi
fi

EXAMPLES_DIR="$(cd "$EXAMPLES_DIR" 2>/dev/null && pwd)" || {
  echo "ERROR: Examples directory not found: $EXAMPLES_DIR"
  echo "  Set EXAMPLES_DIR or use --examples <path>"
  exit 1
}

echo "Scanning: $EXAMPLES_DIR"

# ── Discover targets ──────────────────────────────────────

VALID_PROJECTS="todo bbs reddit shopping erp gauzy"
TARGETS=()
MODELS_FOUND=()

for vendor_dir in "$EXAMPLES_DIR"/*/; do
  vendor=$(basename "$vendor_dir")
  [[ "$vendor" == ".git" || "$vendor" == "raw" || "$vendor" == "node_modules" ]] && continue

  # Apply vendor filter
  [[ -n "$FILTER_VENDOR" && "$vendor" != "$FILTER_VENDOR" ]] && continue

  for model_dir in "$vendor_dir"*/; do
    model=$(basename "$model_dir")

    # Apply model filter
    [[ -n "$FILTER_MODEL" && "$model" != "$FILTER_MODEL" ]] && continue

    for project_dir in "$model_dir"*/; do
      project=$(basename "$project_dir")

      # Only valid projects
      echo "$VALID_PROJECTS" | grep -qw "$project" || continue

      # Apply project filter
      [[ -n "$FILTER_PROJECT" && "$project" != "$FILTER_PROJECT" ]] && continue

      TARGETS+=("$model:$project:$project_dir")

      # Track unique models for summary table
      if ! printf '%s\n' "${MODELS_FOUND[@]}" | grep -qx "$model"; then
        MODELS_FOUND+=("$model")
      fi
    done
  done
done

if [ ${#TARGETS[@]} -eq 0 ]; then
  echo "ERROR: No targets found"
  [[ -n "$FILTER_VENDOR" ]] && echo "  --vendor filter: $FILTER_VENDOR"
  [[ -n "$FILTER_MODEL" ]] && echo "  --model filter: $FILTER_MODEL"
  [[ -n "$FILTER_PROJECT" ]] && echo "  --project filter: $FILTER_PROJECT"
  exit 1
fi

echo "Found ${#TARGETS[@]} target(s):"
for t in "${TARGETS[@]}"; do
  model="${t%%:*}"
  rest="${t#*:}"
  project="${rest%%:*}"
  echo "  • $model/$project"
done
echo ""

# ── Build check ────────────────────────────────────────────

if [ ! -f "$ESTIMATE_DIR/dist/bin/estimate.js" ]; then
  echo "Building estimate package..."
  (cd "$ESTIMATE_DIR" && npx tsc)
fi

# ── Run benchmarks ─────────────────────────────────────────

PASSED=0
FAILED=0
TOTAL=0
TOTAL_COUNT=${#TARGETS[@]}

for entry in "${TARGETS[@]}"; do
  model="${entry%%:*}"
  rest="${entry#*:}"
  project="${rest%%:*}"
  input="${rest#*:}"

  TOTAL=$((TOTAL + 1))
  OUTPUT="$ESTIMATE_DIR/reports/benchmark/$model/$project"

  echo "[$TOTAL/$TOTAL_COUNT] $model / $project ($MODE)"

  ARGS="-i $input -o $OUTPUT --continue-on-gate-failure --project $project"
  if [ "$MODE" = "agent" ]; then
    ARGS="$ARGS --use-agent"
  elif [ "$MODE" = "full" ]; then
    ARGS="$ARGS --use-agent --run-tests --golden"
  fi

  LOG_FILE=$(mktemp)
  if node -r ts-node/register "$ESTIMATE_DIR/dist/bin/estimate.js" $ARGS > "$LOG_FILE" 2>&1; then
    tail -5 "$LOG_FILE"
    PASSED=$((PASSED + 1))
  else
    tail -10 "$LOG_FILE"
    echo "  ERROR: evaluation failed"
    FAILED=$((FAILED + 1))
  fi
  rm -f "$LOG_FILE"

  echo "────────────────────────────────────────"
done

echo ""
echo "Benchmark complete: $PASSED passed, $FAILED failed (total $TOTAL)"

# ── Summary table ──────────────────────────────────────────

read_score() {
  local report="$1"
  if [ -f "$report" ]; then
    node -e "
      const r = require('$report');
      process.stdout.write(r.totalScore + '(' + r.grade + ')');
    " 2>/dev/null || echo "?"
  else
    echo "--"
  fi
}

# Collect all projects that exist
ALL_PROJECTS=()
for p_name in todo bbs reddit shopping erp gauzy; do
  for m in "${MODELS_FOUND[@]}"; do
    if [ -f "$ESTIMATE_DIR/reports/benchmark/$m/$p_name/estimate-report.json" ]; then
      if ! printf '%s\n' "${ALL_PROJECTS[@]}" | grep -qx "$p_name"; then
        ALL_PROJECTS+=("$p_name")
      fi
      break
    fi
  done
done

# Print header
HEADER="│ $(printf '%-24s' 'Model') │"
SEPARATOR="├$(printf '%.0s─' {1..26})┤"
TOP="┌$(printf '%.0s─' {1..26})┬"
BOTTOM="└$(printf '%.0s─' {1..26})┴"

for proj in "${ALL_PROJECTS[@]}"; do
  HEADER="$HEADER $(printf '%-10s' "$proj") │"
  SEPARATOR="$SEPARATOR$(printf '%.0s─' {1..12})┤"
  TOP="$TOP$(printf '%.0s─' {1..12})┬"
  BOTTOM="$BOTTOM$(printf '%.0s─' {1..12})┴"
done

# Fix trailing characters
TOP="${TOP%┬}┐"
SEPARATOR="${SEPARATOR%┤}┤"
BOTTOM="${BOTTOM%┴}┘"

echo ""
echo "$TOP"
echo "$HEADER"
echo "$SEPARATOR"

for m in "${MODELS_FOUND[@]}"; do
  ROW="│ $(printf '%-24s' "$m") │"
  for proj in "${ALL_PROJECTS[@]}"; do
    SCORE=$(read_score "$ESTIMATE_DIR/reports/benchmark/$m/$proj/estimate-report.json")
    ROW="$ROW $(printf '%10s' "$SCORE") │"
  done
  echo "$ROW"
done

echo "$BOTTOM"

# ── Aggregate benchmark data for dashboard ─────────────────
AGGREGATE_SCRIPT="$(dirname "$ESTIMATE_DIR")/apps/dashboard-ui/scripts/aggregate-benchmarks.mjs"
WEBSITE_BENCHMARK_DIR="$(dirname "$ESTIMATE_DIR")/website/public/benchmark"

if [ -f "$AGGREGATE_SCRIPT" ]; then
  echo ""
  echo "Aggregating benchmark data for dashboard..."
  node "$AGGREGATE_SCRIPT"
  if [ -d "$WEBSITE_BENCHMARK_DIR" ]; then
    cp "$(dirname "$AGGREGATE_SCRIPT")/../public/benchmark-summary.json" "$WEBSITE_BENCHMARK_DIR/benchmark-summary.json"
    echo "Dashboard data updated: $WEBSITE_BENCHMARK_DIR/benchmark-summary.json"
    # Auto-refresh browser tab showing benchmark
    if command -v osascript &>/dev/null; then
      osascript -e '
        tell application "Google Chrome"
          repeat with w in windows
            repeat with t in tabs of w
              if URL of t contains "benchmark" then
                tell t to reload
              end if
            end repeat
          end repeat
        end tell
      ' 2>/dev/null && echo "Browser refreshed." || true
    fi
  fi
fi

# ── Generate blog summary for landing page ────────────────
BLOG_SUMMARY_SCRIPT="$(dirname "$ESTIMATE_DIR")/website/scripts/generate-blog-summary.js"
if [ -f "$BLOG_SUMMARY_SCRIPT" ]; then
  node "$BLOG_SUMMARY_SCRIPT" 2>/dev/null && echo "Blog summary updated." || true
fi
