# AutoBE Project Context for Claude

## Project Overview
AutoBE is an AI-powered no-code agent that automatically generates complete backend applications using TypeScript, NestJS, and Prisma. The system follows a waterfall development model with compiler feedback validation to ensure 100% working code output.

## Core Architecture
The system consists of specialized agents working in sequence:

### Functional Agents
- **Analyze Agent**: Requirements analysis and specifications
- **Prisma Agent**: Database schema design (ERD) with Postgres/SQLite support - structured 3-step process (plan → review → models)
- **Interface Agent**: API design and OpenAPI specification generation
- **Test Agent**: End-to-end test code generation with scenario planning
- **Realize Agent**: Main program implementation and integration

### Compiler Validation
- Prisma Compiler: Validates database schemas
- OpenAPI Validator: Validates API specifications  
- TypeScript Compiler: Validates generated code quality

## Project Structure
```
/autobe/
   assets/                    # Compiler dependencies and repositories
      compiler-dependencies/  # Node modules for compiler
      repositories/           # Sample backend repositories (bbs, shopping)
   deploy/                    # Deployment scripts
      sync_dependencies.js    # Dependency synchronization
      sync_readme.js          # README synchronization
   internals/                 # Internal configurations and dependencies
      compiler-dependencies/  # Compiler node modules
      config/                 # Build configuration
      dependencies/           # NestJS and test dependencies
      filesystem/             # File system utilities
      nestjs-dependencies/    # NestJS specific dependencies
      repositories/           # Internal sample repositories
      template/               # Project templates for agents
      test-dependencies/      # Test-specific dependencies
      website-examples/       # Example code for website
   packages/                  # Core package modules (monorepo)
      agent/                  # Core agent implementation
      compiler/               # Compiler implementations
      filesystem/             # File system utilities
      interface/              # Interface definitions
      playground-server/      # Playground backend server
      playground-ui/          # Playground frontend UI
      rpc/                    # RPC service implementation
      utils/                  # Shared utilities
      vscode-extension/       # VSCode extension (planned)
   test/                      # Comprehensive test suite and results
      assets/                 # Test assets and histories
      benchmark-logs/         # Performance benchmark logs
      results/                # Test execution results
      scripts/                # Test scenario scripts
      src/                    # Test source code
   website/                   # Documentation website (Next.js)
      articles/               # Blog articles and documentation
      public/                 # Static assets
      src/                    # Website source code
   playground/                # Interactive demo environment
   playground-result/         # Playground execution results
   CLAUDE.md                  # This file
```

## Key Technologies
- **Backend Stack**: TypeScript + NestJS + Prisma
- **Database**: PostgreSQL (primary), SQLite (development)
- **API**: OpenAPI/Swagger specification
- **Testing**: Automated e2e test generation
- **Validation**: Multi-layer compiler feedback

## Package Architecture

### Core Packages (/packages/)
- **@autobe/agent**: Core agent implementation with orchestration logic
  - Analyze orchestration (requirements analysis)
  - Prisma orchestration (database schema generation)  
  - Interface orchestration (API design)
  - Test orchestration (test code generation)
  - Realize orchestration (implementation generation)
- **@autobe/compiler**: Compiler implementations for validation
  - Prisma compiler (schema validation)
  - Interface compiler (OpenAPI validation)
  - TypeScript compiler (code validation)
  - Test compiler (test code validation)
  - Realize compiler (implementation validation)
- **@autobe/filesystem**: File system management utilities
- **@autobe/interface**: Type definitions and interfaces
- **@autobe/playground-server**: WebSocket-based playground backend
- **@autobe/playground-ui**: React-based playground frontend  
- **@autobe/rpc**: RPC service for agent communication
- **@autobe/utils**: Shared utilities and helpers

## Development Phase
Currently in **Beta Phase** (2025-06-01 to 2025-08-31) focusing on:
- Test Agent refinement with compiler feedback
- Realize Agent development with runtime validation
- 100% autonomous backend development capability
- Ecosystem integration preparation

## Ecosystem Vision
Part of WrtnLabs' no-code ecosystem:
- **@autobe**: Backend application generation
- **@agentica**: AI chatbot creation from swagger.json
- **@autoview**: Frontend application generation from swagger.json

Mission: "Can you converse? Then you're a full-stack developer."

## Example Use Cases
1. **BBS (Bulletin Board System)**: Political/economic discussion platform
2. **E-Commerce Platform**: Shopping mall with voice-driven interactions
3. **Custom Business Applications**: Requirement-driven development

## Key Features
- **Waterfall Model**: Systematic phase-by-phase development
- **Compiler Feedback**: Real-time validation and error correction
- **Function Calling**: AI agent coordination and task distribution
- **WebSocket Support**: Real-time communication protocols
- **Schema-First Development**: Database-driven architecture

## Testing & Validation
- Automated test scenario generation
- Compiler-validated code output
- Benchmark performance testing
- End-to-end integration testing

## Instructions for Claude

### Communication Language
- **Write all code, comments, and documentation in English**
- **Communicate with the user in Korean (한국어)**
- Maintain professional yet conversational tone in Korean

### Development Guidelines
1. Follow the existing TypeScript/NestJS/Prisma patterns
2. Respect the waterfall development sequence when making changes
3. Ensure compiler validation passes for any generated code
4. Reference the test results in `/test/results/` for examples
5. Use the existing agent patterns found in `/packages/` directory

### Development Conventions

All commits, pull requests, and issues follow the same convention format.

#### Convention Format
**Format**: `<type>(<workspace>): <description>`

This format is used for:
- Commit messages
- Pull request titles
- Issue titles

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring without changing functionality
- `test`: Adding or modifying tests
- `chore`: Maintenance tasks, dependency updates
- `perf`: Performance improvements

**Workspaces** (from pnpm-workspace.yaml):
- `agent`, `compiler`, `filesystem`, `interface`, `playground-server`, `playground-ui`, `rpc`, `utils`, `vscode-extension` (in packages/)
- `test` 
- `website`
- `internals/website-examples`

**Examples**:
```
# Commits, PRs, and Issues all use the same format:
feat(agent): add partial modification support to analyze agent
fix(compiler): resolve TypeScript compilation error in realize agent
refactor(utils): remove console log from randomBackoffStrategy function
chore: release v0.14.6
```

#### Pull Request Guidelines
1. **PR Title**: Must follow the convention format above
2. **PR Description** must include:
   - Summary of changes
   - Related issue number (e.g., `Closes #123`, `Related to #456`)
   - Test plan or verification steps
   - Breaking changes (if any)

**PR Template**:
```markdown
## Summary
Brief description of what this PR does

## Related Issues
Closes #123

## Changes
- List of specific changes
- What was modified and why

## Test Plan
How to verify these changes work correctly

## Breaking Changes
Any breaking changes (or "None")
```

#### Issue Guidelines
1. **Issue Title**: Must follow the convention format above
2. **Issue Body** structure:

**For Bugs**:
```markdown
## Problem Description
What is broken and how it affects users

## Steps to Reproduce
1. Step one
2. Step two
3. Expected vs Actual behavior

## Environment
- Version: 
- OS: 
- Node version:
```

**For Features** (using EARS format):
```markdown
## Problem Statement
Current limitations and why this feature is needed

## Requirements (EARS Format)
WHEN [trigger]
THE SYSTEM SHALL [action]

WHERE [condition]
THE SYSTEM SHALL [behavior]

## Proposed Solution
How to implement this feature

## Expected Benefits
What improvements this brings
```

### Project Context Awareness
- This is a production-ready no-code agent system
- Code quality must be enterprise-grade
- All generated code should follow the established patterns
- Consider the multi-agent architecture when suggesting changes
- Be aware of the compiler feedback loop integration

### Claude's Responsibilities
- **IMPORTANT**: When project structure changes, update this CLAUDE.md file immediately to reflect the new structure
- Keep the Project Structure section accurate and up-to-date
- Document any new packages, directories, or major architectural changes

### Useful Commands
- `pnpm build`: Build all packages
- `pnpm playground`: Run interactive demo
- `pnpm test`: Run test suite
- Check `/test/scripts/` for specific testing scenarios

### Repository Information
- **License**: AGPL 3.0
- **Maintainer**: Wrtn Technologies
- **Repository**: https://github.com/wrtnlabs/autobe
- **Documentation**: https://wrtnlabs.io/autobe/docs/
- **Main Branch**: main