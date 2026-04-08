#!/bin/bash
set -e

# ── Paths ─────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
REPORT_DIR="$SCRIPT_DIR/reports/benchmark"

# Load .env
for env_file in "$SCRIPT_DIR/.env" "$REPO_ROOT/.env"; do
  if [ -f "$env_file" ]; then
    set -a; source "$env_file"; set +a
  fi
done

# Default: autobe-examples beside autobe repo
EXAMPLES_DIR="${EXAMPLES_DIR:-$REPO_ROOT/../autobe-examples}"

# ── Defaults ──────────────────────────────────────────────
FILTER_MODEL=""
FILTER_PROJECT=""
FULL_MODE=false

# ── Parse arguments ───────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --model)     FILTER_MODEL="$2"; shift 2 ;;
    --project)   FILTER_PROJECT="$2"; shift 2 ;;
    --full)      FULL_MODE=true; shift ;;
    --examples)  EXAMPLES_DIR="$2"; shift 2 ;;
    --help|-h)
      cat <<'HELP'
Usage: run-benchmark.sh [options]

  Default: evaluate ALL models (static analysis + AI agents)

Options:
  --model <name>       Run only this model (e.g., kimi-k2.5)
  --project <name>     Run only this project (e.g., reddit)
  --full               Also run runtime tests + golden set
  --examples <path>    Path to autobe-examples directory
  -h, --help           Show this help

Examples:
  corepack pnpm estimate                                          # ALL models
  corepack pnpm estimate -- --model kimi-k2.5                     # one model
  corepack pnpm estimate -- --project todo                        # one project
  corepack pnpm estimate -- --model glm-5 --project shopping      # model + project
  corepack pnpm estimate -- --full                                # + runtime tests + golden set
HELP
      exit 0
      ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# ── Validation ────────────────────────────────────────────
if [ -z "$OPENROUTER_API_KEY" ]; then
  echo "ERROR: OPENROUTER_API_KEY is required"
  echo "  Set it in packages/estimate/.env or export OPENROUTER_API_KEY=sk-or-..."
  exit 1
fi

EXAMPLES_DIR="$(cd "$EXAMPLES_DIR" 2>/dev/null && pwd)" || {
  echo "ERROR: autobe-examples not found: $EXAMPLES_DIR"
  echo "  Set EXAMPLES_DIR=<path> or use --examples <path>"
  exit 1
}

# ── Discover targets ──────────────────────────────────────
VALID_PROJECTS="todo bbs reddit shopping erp gauzy"
TARGETS=()
MODELS_FOUND=()

for vendor_dir in "$EXAMPLES_DIR"/*/; do
  vendor=$(basename "$vendor_dir")
  [[ "$vendor" == ".git" || "$vendor" == "raw" || "$vendor" == "node_modules" ]] && continue

  for model_dir in "$vendor_dir"*/; do
    model=$(basename "$model_dir")
    [[ -n "$FILTER_MODEL" && "$model" != "$FILTER_MODEL" ]] && continue

    for project_dir in "$model_dir"*/; do
      project=$(basename "$project_dir")
      echo "$VALID_PROJECTS" | grep -qw "$project" || continue
      [[ -n "$FILTER_PROJECT" && "$project" != "$FILTER_PROJECT" ]] && continue

      TARGETS+=("$model:$project:$project_dir")
      if ! printf '%s\n' "${MODELS_FOUND[@]}" | grep -qx "$model"; then
        MODELS_FOUND+=("$model")
      fi
    done
  done
done

if [ ${#TARGETS[@]} -eq 0 ]; then
  echo "ERROR: No targets found"
  [[ -n "$FILTER_MODEL" ]] && echo "  --model: $FILTER_MODEL"
  [[ -n "$FILTER_PROJECT" ]] && echo "  --project: $FILTER_PROJECT"
  exit 1
fi

MODE_LABEL="static + agent"
$FULL_MODE && MODE_LABEL="static + agent + runtime + golden"

echo ""
echo "=== Estimate: ${#TARGETS[@]} targets ($MODE_LABEL) ==="
for t in "${TARGETS[@]}"; do
  model="${t%%:*}"
  rest="${t#*:}"
  project="${rest%%:*}"
  echo "  $model/$project"
done
echo ""

# ── Resolve ts-node path ──────────────────────────────────
# Use ts-node directly (same as `pnpm estimate` in package.json)
# node dist/ has ESM resolution issues with workspace packages
TSNODE_BIN="$REPO_ROOT/node_modules/.bin/ts-node"
if [ ! -x "$TSNODE_BIN" ]; then
  echo "ERROR: ts-node not found at $TSNODE_BIN"
  exit 1
fi
# Force CJS module resolution for Node v22 compatibility
# (workspace packages use "main": "src/index.ts" with extensionless imports)
export TS_NODE_COMPILER_OPTIONS='{"module":"commonjs","moduleResolution":"node"}'
ESTIMATE_CMD="$TSNODE_BIN $SCRIPT_DIR/src/bin/estimate.ts"

# ── Run evaluations ──────────────────────────────────────
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
  OUTPUT="$REPORT_DIR/$model/$project"

  echo "[$TOTAL/$TOTAL_COUNT] $model/$project"

  ARGS="-i $input -o $OUTPUT --continue-on-gate-failure --project $project --use-agent"
  $FULL_MODE && ARGS="$ARGS --run-tests --golden"

  LOG_FILE=$(mktemp)
  EXIT_CODE=0
  $ESTIMATE_CMD $ARGS > "$LOG_FILE" 2>&1 || EXIT_CODE=$?

  # Success = report file exists (exit code unreliable due to @clack/prompts piping)
  REPORT_FILE="$OUTPUT/estimate-report.json"
  if [ -f "$REPORT_FILE" ]; then
    tail -5 "$LOG_FILE"
    [ "$EXIT_CODE" -ne 0 ] && echo "  (exit code $EXIT_CODE — report generated despite non-zero exit)"
    PASSED=$((PASSED + 1))
  else
    tail -10 "$LOG_FILE"
    echo "  ERROR: evaluation failed (exit code $EXIT_CODE, no report generated)"
    FAILED=$((FAILED + 1))
  fi
  rm -f "$LOG_FILE"
  echo "────────────────────────────────────────"
done

echo ""
echo "Done: $PASSED passed, $FAILED failed (total $TOTAL)"

# ── Summary table ─────────────────────────────────────────
read_score() {
  local report="$1"
  if [ -f "$report" ]; then
    node -e "const r=require('$report');process.stdout.write(r.totalScore+'('+r.grade+')');" 2>/dev/null || echo "?"
  else
    echo "--"
  fi
}

ALL_PROJECTS=()
for p_name in todo bbs reddit shopping erp gauzy; do
  for m in "${MODELS_FOUND[@]}"; do
    if [ -f "$REPORT_DIR/$m/$p_name/estimate-report.json" ]; then
      ALL_PROJECTS+=("$p_name")
      break
    fi
  done
done

# Header
HEADER="| $(printf '%-24s' 'Model') |"
SEP="|$(printf '%.0s-' {1..26})|"
for proj in "${ALL_PROJECTS[@]}"; do
  HEADER="$HEADER $(printf '%-10s' "$proj") |"
  SEP="$SEP$(printf '%.0s-' {1..12})|"
done

echo ""
echo "$SEP"
echo "$HEADER"
echo "$SEP"

for m in "${MODELS_FOUND[@]}"; do
  ROW="| $(printf '%-24s' "$m") |"
  for proj in "${ALL_PROJECTS[@]}"; do
    SCORE=$(read_score "$REPORT_DIR/$m/$proj/estimate-report.json")
    ROW="$ROW $(printf '%10s' "$SCORE") |"
  done
  echo "$ROW"
done
echo "$SEP"

# ── Aggregate for dashboard ──────────────────────────────
AGGREGATE="$REPO_ROOT/apps/dashboard-ui/scripts/aggregate-benchmarks.mjs"
if [ -f "$AGGREGATE" ]; then
  echo ""
  echo "Aggregating benchmark data..."
  node "$AGGREGATE"

  WEBSITE_DIR="$REPO_ROOT/website/public/benchmark"
  DASHBOARD_JSON="$REPO_ROOT/apps/dashboard-ui/public/benchmark-summary.json"
  if [ -f "$DASHBOARD_JSON" ] && [ -d "$WEBSITE_DIR" ]; then
    cp "$DASHBOARD_JSON" "$WEBSITE_DIR/benchmark-summary.json"
    echo "Dashboard + website data updated."
  fi
fi

echo ""
echo "Reports: $REPORT_DIR/{model}/{project}/estimate-report.json"
