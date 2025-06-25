# AutoBE Benchmarks

Adversarial testing framework for AutoBE Agent performance evaluation.

## Overview

This benchmarking system evaluates AutoBE Agent's capability to generate backend applications through adversarial testing methodology. It challenges the agent with complex scenarios and validates responses using AI-powered quality assessment.

## Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- OpenAI API key

## Setup

### 1. Install Dependencies

```bash
# Install dependencies
pnpm install

# Or using npm
npm install
```

### 2. Environment Configuration

Create a `.env` file in the project root or set environment variables:

```bash
# Required: OpenAI API key
CHATGPT_API_KEY=sk-your-openai-api-key-here

# Optional: Custom OpenAI base URL (for proxy or alternative endpoints)
CHATGPT_BASE_URL=https://api.openai.com/v1
```

**Environment Variables:**
- `CHATGPT_API_KEY` (required): Your OpenAI API key for both AutoBE agent and adversarial validation
- `CHATGPT_BASE_URL` (optional): Custom OpenAI endpoint URL
- `BENCHMARK_RUNS_PER_SCENARIO` (optional): Number of runs per scenario (default: 3)

### 3. Verify Setup

Check if TypeScript compiles correctly:

```bash
npx tsc --noEmit
```

## Usage

### Run Benchmarks

```bash
# Run adversarial benchmarks (default)
pnpm start
# or
pnpm run benchmark

# Show help
pnpm run help

# Development mode (watch for changes)
pnpm run dev

# Type checking
pnpm run typecheck

# Build TypeScript
pnpm run build
```

### Expected Output

The benchmark will:

1. **Execute Test Scenarios Multiple Times**: Run each scenario 3 times (configurable) for statistical reliability
2. **Monitor Flow Success**: Track whether each run completes all stages without errors
3. **Monitor Stage Completion**: Track Analysis → Prisma → Interface stages individually
4. **Challenge with Adversarial Questions**: Test agent robustness with difficult follow-ups
5. **Measure Completeness**: Use GPT-4 to assess technical accuracy and response quality
6. **Calculate Success Rates**: Measure flow completion success rate per scenario
7. **Generate Comprehensive Report**: Save detailed statistical analysis to `benchmark-report.md`

### Sample Console Output

```
🚀 Starting benchmark with 2 scenarios...

🔄 Running scenario "BBS System" 3 times...

📍 Run 1/3 for BBS System
🎯 Starting benchmark: BBS System (ID: bbs-system-1735123456789)
📝 Description: Political/Economic Discussion Board

🚀 Executing initial prompt...
✅ Analysis stage completed
🔄 Executing follow-up prompt 1...
✅ Prisma stage completed
🔄 Executing follow-up prompt 2...
✅ Interface stage completed

🔥 Starting adversarial questioning...
🤔 Adversarial question: What happens if a user tries to post without authentication?
✅ Response quality: Good
...

✅ Flow completed: BBS System
⏱️  Total duration: 45230ms
🔄 Flow success: Yes
📊 Completeness score: 85%

⏸️  Waiting 3 seconds before next run...

📍 Run 2/3 for BBS System
...

📊 Scenario "BBS System" Summary:
   Success Rate: 100.0% (3/3)
   Average Completeness: 87.3%
   Average Duration: 44500ms
   Total Scenario Duration: 142.5s

⏸️  Waiting 5 seconds before next scenario...

🔄 Running scenario "E-Commerce System" 3 times...
...

🏁 Benchmark completed in 320.8 seconds

============================================================
FINAL BENCHMARK SUMMARY
============================================================
Total Benchmark Duration: 320.8s (5.3 minutes)
Total Scenarios: 2
Runs Per Scenario: 3
Total Runs: 6
Overall Flow Success Rate: 83.3%
Overall Completeness Score: 85.5%

Scenario Breakdown:
  - BBS System:
    Flow Success: 100.0% (3/3)
    Completeness: 87.3%
    Avg Run Duration: 44500ms
    Total Scenario Time: 142.5s
  - E-Commerce System:
    Flow Success: 66.7% (2/3)
    Completeness: 83.7%
    Avg Run Duration: 52100ms
    Total Scenario Time: 163.2s

📊 Benchmark report saved to: benchmark-report.md
📊 Archived report saved to: ./benchmark-logs/2024-12-24/benchmark-1735123456789/benchmark-report.md
📋 Benchmark summary saved to: ./benchmark-logs/2024-12-24/benchmark-1735123456789/benchmark-summary.json
```

## Test Scenarios

### 1. BBS (Bulletin Board System)
- **Focus**: Political/Economic discussion board
- **Tests**: User authentication, content management, moderation
- **Adversarial Questions**: Security, spam handling, concurrent access

### 2. E-Commerce Platform  
- **Focus**: Online shopping system
- **Tests**: Product catalog, order processing, inventory management
- **Adversarial Questions**: Payment processing, stock conflicts, recommendations

## Benchmark Metrics

### Flow Success Rate
- **Definition**: Percentage of runs that complete all stages (Analysis → Prisma → Interface) without errors
- **Measurement**: Binary success/failure based on stage completion and absence of critical errors
- **Purpose**: Measures basic functional reliability of the AutoBE agent

### Completeness Score  
- **Definition**: Quality assessment from adversarial questioning (0-100%)
- **Measurement**: Percentage of adversarial questions that receive technically accurate, complete responses
- **Validation**: AI-powered evaluation using GPT-4 for technical accuracy, security considerations, and completeness
- **Purpose**: Measures depth and quality of generated solutions

### Statistical Reliability
- **Multiple Runs**: Each scenario runs 3 times by default (configurable via `BENCHMARK_RUNS_PER_SCENARIO`)
- **Success Rate**: Calculated across multiple runs to account for variability
- **Consistency Analysis**: Variance analysis in completeness scores across runs

### Performance Tracking
- **Duration**: Time taken for each stage and overall completion
- **Error Tracking**: Compilation errors, validation failures, runtime exceptions
- **Stage Analysis**: Individual success/failure tracking for Analysis, Prisma, and Interface stages

## Generated Reports and Logs

After running benchmarks, find detailed analysis in:

### Reports
- `benchmark-report.md` - Complete performance report (root directory)

### Detailed Logs and Data  
- `./benchmark-logs/[YYYY-MM-DD]/[benchmark-id]/` - Each benchmark gets its own directory:
  - `benchmark-report.md` - Archived copy of the performance report
  - `benchmark-summary.json` - Complete benchmark summary with timing data
  - `[run-id].log` - Detailed execution logs for each run
  - `[run-id]-data.json` - Complete run data including results, timings, and metadata
  - `[run-id]-files/` - Generated files from each stage (analysis, prisma, interface)
    - `analysis/` - Requirements analysis documents
    - `prisma/` - Database schema files
    - `interface/` - API specification and NestJS files

### Log Structure
Each benchmark run is isolated in its own directory with comprehensive logs:
- **Execution Logs**: Step-by-step execution with timestamps (saved to files only, not console)
- **Stage Outputs**: Generated files and compilation results
- **Error Details**: Detailed error messages and stack traces
- **Adversarial Q&A**: Complete question-response pairs with validation results
- **Performance Metrics**: Timing data for each stage and overall completion

### Directory Structure Example
```
benchmark-logs/
├── 2024-12-24/
│   ├── benchmark-1735123456789/
│   │   ├── benchmark-report.md                    # Archived report
│   │   ├── benchmark-summary.json                 # JSON summary
│   │   ├── bbs-system-1735123456790.log          # Execution logs
│   │   ├── bbs-system-1735123456790-data.json    # Run data
│   │   ├── bbs-system-1735123456790-files/       # Generated files
│   │   │   ├── analysis/
│   │   │   │   └── requirements.md
│   │   │   ├── prisma/
│   │   │   │   └── schema.prisma
│   │   │   └── interface/
│   │   │       ├── swagger.json
│   │   │       └── controllers/
│   │   └── e-commerce-system-1735123456800.log   # Second scenario
│   └── benchmark-1735123567890/                  # Second benchmark run
│       ├── benchmark-report.md
│       └── ...
```

### Timing Data
The system tracks multiple levels of timing:
- **Individual Run Duration**: Time for each run execution
- **Scenario Duration**: Total time for all runs in a scenario (including wait times)
- **Total Benchmark Duration**: Complete benchmark execution time
- **Overhead Analysis**: Difference between actual execution and waiting periods

## Troubleshooting

### Common Issues

**Missing API Key**
```
❌ CHATGPT_API_KEY environment variable is required
```
→ Set your OpenAI API key in environment variables

**Compilation Errors**
```
❌ TypeScript compilation failed
```
→ Run `npx tsc --noEmit` to check for type errors

**Network/API Issues**
```
❌ Benchmark failed: Request failed
```
→ Check your internet connection and API key validity

### Debug Mode

For detailed debugging, check:
1. Console output during execution
2. Generated `benchmark-report.md` for detailed analysis
3. Individual run logs in the benchmark directory:
   ```bash
   # View specific run logs
   cat ./benchmark-logs/[date]/[benchmark-id]/[run-id].log
   
   # Check generated files
   ls -la ./benchmark-logs/[date]/[benchmark-id]/[run-id]-files/
   
   # View prisma schemas
   cat ./benchmark-logs/[date]/[benchmark-id]/[run-id]-files/prisma/schema.prisma
   ```

## Development

### Project Structure
```
src/
├── index.ts              # Main entry point
├── adversarial-agent.ts  # Adversarial testing framework
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── CLAUDE.md            # Claude Code context file
```

### Adding New Test Scenarios

1. Edit `src/adversarial-agent.ts`
2. Add new scenario to `initializeScenarios()` method
3. Define validation criteria and adversarial questions
4. Test with `pnpm start`

## Related Projects

- [AutoBE](https://github.com/wrtnlabs/autobe) - Main AutoBE project
- [Agentica](https://github.com/wrtnlabs/agentica) - AI chatbot creation
- [AutoView](https://github.com/wrtnlabs/autoview) - Frontend generation

## Support

For issues and questions:
- Check the [AutoBE documentation](https://wrtnlabs.io/autobe/docs/)
- Review `benchmark-report.md` for detailed error analysis
- Ensure all prerequisites are properly installed