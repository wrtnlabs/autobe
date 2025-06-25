# AutoBE Benchmarks

This directory contains comprehensive benchmark tests for the AutoBE project - an AI-powered no-code agent that builds backend applications using adversarial testing methodology.

## Project Overview

AutoBE is a no-code AI agent that analyzes user requirements and automatically generates backend applications using TypeScript, NestJS, and Prisma (Postgres/SQLite). The agent follows a waterfall development model with compiler feedback validation to ensure 100% working code.

## Benchmarks Directory

This directory (`@autobe/benchmarks`) implements an adversarial testing framework to measure AutoBE agent performance across various scenarios and stress-test its capabilities with challenging questions.

### Structure
- `src/index.ts` - Main benchmark entry point with multiple execution modes
- `src/adversarial-agent.ts` - Adversarial testing agent implementation
- `package.json` - Project configuration with dependencies on core AutoBE packages
- `tsconfig.json` - TypeScript configuration
- `benchmark-report.md` - Generated benchmark report (created after running tests)

### Key Features

#### Adversarial Testing Framework
The `AdversarialAgent` class implements a comprehensive testing methodology:

1. **E2E Testing**: Tests complete AutoBE workflows from requirements analysis to API generation
2. **Stage Validation**: Validates each development stage (Analysis, Prisma, Interface) independently
3. **Adversarial Questioning**: Challenges the agent with difficult follow-up questions to test robustness
4. **Response Validation**: Uses GPT-4 to validate response quality and technical accuracy
5. **Performance Metrics**: Measures success rates, duration, and error tracking

#### Test Scenarios
- **BBS System**: Political/Economic discussion board with user authentication and content management
- **E-Commerce Platform**: Online shopping system with inventory, orders, and payment processing

#### Benchmark Metrics
- **Stage Success Rate**: Percentage of successfully completed development stages
- **Adversarial Response Quality**: Quality assessment of responses to challenging questions
- **Overall Success Rate**: Weighted combination (70% stage completion, 30% adversarial responses)
- **Performance Timing**: Duration tracking for each stage and overall completion

### Dependencies
- `@autobe/agent` - Core agent functionality
- `@autobe/compiler` - Compiler feedback system
- `openai` - AI model integration for both AutoBE and adversarial validation

### Commands
- `pnpm start` or `pnpm run benchmark` - Run full adversarial benchmark suite (default)
- `pnpm run help` - Show usage information
- `pnpm run dev` - Development mode with file watching
- `pnpm run typecheck` - Type checking without compilation
- `pnpm run build` - Build TypeScript to JavaScript

### Environment Variables
- `CHATGPT_API_KEY` - OpenAI API key (required)
- `CHATGPT_BASE_URL` - Custom OpenAI base URL (optional)

### Benchmark Report
After running benchmarks, a detailed report is generated at `benchmark-report.md` containing:
- Overall success rates and performance metrics
- Detailed results for each test scenario
- Stage-by-stage performance analysis
- Adversarial questioning results and response quality assessments

## Development Context

The benchmarks are part of AutoBE's comprehensive development roadmap (2025-06-01 through 2025-08-31) focused on:
- **Testing agent performance and reliability** through adversarial scenarios
- **Validating code generation accuracy** across different project types
- **Measuring system stability** under challenging conditions
- **Ensuring 100% reliable No-Code Agent platform functionality**
- **Continuous improvement** through systematic performance monitoring

## Usage Examples

```bash
# Run comprehensive benchmarks (default)
pnpm start

# Run comprehensive benchmarks (explicit)
pnpm start benchmark

# View help
pnpm start help
```

## Related Projects
- [`@agentica`](https://github.com/wrtnlabs/agentica) - AI chatbot creation from swagger.json
- [`@autoview`](https://github.com/wrtnlabs/autoview) - Frontend generation from swagger.json

## Development Guidelines

### Code Standards
- **Language**: All code, comments, and documentation must be written in English
- **TypeScript**: Use proper type definitions and avoid `any` types
- **Comments**: Write clear, descriptive comments explaining complex logic
- **Functions**: Use descriptive function names and document parameters
- **Error Handling**: Implement comprehensive error handling with meaningful error messages

### Code Quality
- Follow TypeScript best practices
- Use async/await for asynchronous operations
- Implement proper logging for debugging and analysis
- Write modular, reusable code components
- Maintain consistent code formatting and style
- **Prefer early returns** over nested conditionals to improve readability
- **Write immutable code** - avoid mutating existing objects, prefer creating new ones
- Use `const` by default, `let` only when reassignment is necessary
- Prefer functional programming patterns (map, filter, reduce) over imperative loops
- **Extract complex conditions** - if statements with multiple conditions should use descriptive variable names

For more information about AutoBE, visit the [official documentation](https://wrtnlabs.io/autobe/docs/).