# Agent System Prompts

## Critical Importance

System Prompt editing is **the most critical and sensitive task** in AutoBE development. System Prompts define AI agent behavior and directly determine generated code quality. Poor prompts cause compilation errors, logical bugs, and architectural inconsistencies.

**Absolute Rule**: User instructions are absolute. If unclear, ask questions. If clear, execute exactly as specified. Never modify, reduce, or omit user commands based on your own judgment.

**CRITICAL - Scope Limitation**: When user asks to edit system prompts, do ONLY the editing. Do NOT:
- Run `pnpm run build:prompt` unless explicitly requested
- Run `pnpm run build`, `pnpm run test`, or ANY other commands
- Execute `git commit` or any git operations
- Perform ANY actions beyond the editing itself

The user will decide when to build, test, and commit. Your role is to edit ONLY.

When editing System Prompts, you must:
1. **Completely** read and understand the target prompt file
2. Review related Orchestrator, Tool, and History code
3. Integrate changes naturally into the existing storyline
4. **STOP** after completing the edit - do not proceed with any other actions
5. Let the user decide whether to validate in actual pipeline

## Prompt Architecture

AutoBE's System Prompts are hierarchically structured.

### Common Prompt

`COMMON.md` defines the foundational identity shared by all agents. It begins with "You are an integral part of AutoBE" and explains the agent's role, principles, and architectural context.

The Common Prompt provides **context**. It makes agents aware they are not operating alone, but as members of a team of 40+ agents. This helps agents understand that their output becomes input for other agents, maintaining consistent formats.

The Common Prompt emphasizes **principles**. It codifies principles like Production-First, Compiler-Driven, and Single-Pass Excellence, ensuring agents maintain high quality standards. The message "you must produce perfect results in one attempt" encourages agents to work carefully.

The Common Prompt handles **multilingualization**. Messages are localized according to user locale, but code and documentation are written in English. This maintains international compatibility and industry standards.

### Stage-Specific Prompts

Each pipeline stage has specialized prompts: `ANALYZE_WRITE.md`, `PRISMA_SCHEMA.md`, `INTERFACE_OPERATION.md`, `TEST_WRITE.md`, `REALIZE_WRITE.md`, etc.

Stage-Specific Prompts build upon the Common Prompt. They inherit general principles from Common and add stage-specific requirements. For example, `REALIZE_WRITE.md` includes specific instructions like "generate NestJS Controllers", "use Prisma for database access".

Stage-Specific Prompts provide **rich examples**. They show examples of good code, bad code, and edge case handling. Since LLMs excel at few-shot learning, more examples improve output quality.

Stage-Specific Prompts codify **conventions**. They precisely specify naming rules (PascalCase, camelCase), file structure, import order, and comment style. This ensures generated code maintains consistent style.

### Review and Correction Prompts

Review and Correction tasks use special prompts: `ANALYZE_REVIEW.md`, `PRISMA_CORRECT.md`, `REALIZE_CORRECT.md`, etc.

Review Prompts demand **critical thinking**. They include instructions like "don't just approve - actually find problems", "verify that requirements match implementation". This prevents Review Agents from becoming rubber stamps.

Correction Prompts specialize in **compiler error interpretation**. They guide agents to understand TypeScript error messages, identify root causes, and fix with minimal changes. The principle is emphasized: "don't rewrite everything - fix only the error".

Correction Prompts encourage **learning**. They promote analyzing error patterns to avoid repeating the same mistakes, maximizing compiler feedback to make accurate corrections.

## Prompt Design Principles

Effective System Prompts follow these principles.

### Clarity and Specificity

Prompts must be clear and specific. Ambiguous instructions produce inconsistent output. Instead of "write good code", say "generate a NestJS controller class with @Controller() decorator, where each method has HTTP method decorators like @Get(), @Post()".

Specify numbers and constraints. Instead of "brief description", write "description under 200 characters". Instead of "some examples", write "3-5 examples". Clear constraints help the LLM understand expectations precisely.

Prioritize positive directives. Instead of "don't do X", say "do Y". Negative commands are often missed by LLMs, but positive commands are more effective. For example, instead of "don't use `any` type", say "specify explicit types for all variables and parameters".

### Contextual Awareness

Prompts must be designed with understanding of the context agents will receive. Since Realize Agents receive Prisma schema and OpenAPI documents, use expressions like "referring to the provided Prisma schema". Referencing non-existent context confuses agents.

Collaborate with History Transformers. Design prompts so History Transformers provide the context structure the prompt expects. If the prompt expects a "Requirements Analysis Report" section, the History Transformer must generate a section with that exact name.

Explain before-and-after context. Describe where the current task sits in the overall pipeline, what was completed in previous stages, and how the current output will be used in next stages. This helps agents understand their role precisely.

### Example-Driven Learning

Good examples beat a thousand words of description. Include rich examples in prompts to help LLMs learn patterns.

Show both normal cases and edge cases. Provide not just simple CRUD API examples, but also examples with complex relationships, conditional logic, and exception handling. Agents learn diverse scenarios and apply them to similar situations.

Use Before/After examples. Show "don't do this" (Before) and "do this" (After) side by side. Clearly contrast the problems with bad code and the benefits of good code.

Reference actual production code. Find good examples from AutoBE's own codebase and include them in prompts. Agents learn AutoBE's coding style and generate consistent code.

### Iterative Refinement

Prompts cannot be perfect on first try. They must be refined iteratively.

Collect user feedback. Identify problems that frequently appear in generated code and update prompts to prevent them. For example, if agents frequently use `any` type, emphasize "never use any type, always specify explicit types".

Analyze error logs. When compilation errors or schema validation errors repeat, codify them in prompts. Add "common errors from previous versions" to prompts so agents avoid the same mistakes.

Perform A/B testing. Quantitatively measure the impact of prompt changes. Use metrics like compilation success rate, retry count, and user satisfaction. Apply changes when improvement is confirmed, rollback when performance degrades.

Maintain rigorous version control. When changing prompts, specify the reason and expected effect in commit messages. This enables easy rollback to previous versions if problems occur.

## Prompt Components

Effective System Prompts consist of multiple components.

### Identity and Role

Prompts clearly define agent identity. Declare roles like "You are a Requirements Analysis Specialist", "You are a NestJS API Implementation Expert". Agents recognize themselves as experts and apply domain best practices.

Specify scope of responsibility. Clarify what to do and what not to do. Draw boundaries like "you are responsible only for API implementation, do not modify database schema". This prevents agents from overstepping their domain.

Emphasize expertise. Set agent capability high with phrases like "You are a world-class expert", "You have decades of experience". Research shows assigning expert roles to LLMs improves output quality.

### Task Description

Describe tasks concretely. Instead of "implement API endpoints", write in detail: "implement the given OpenAPI Operation as a NestJS Controller method, process business logic in the Service layer, and perform database access using Prisma".

List steps. Break complex tasks into sequential steps. Guide the process like "1. Analyze OpenAPI Operation, 2. Define DTO types, 3. Write Controller method, 4. Implement Service logic, 5. Verify compilation".

Specify output format. Precisely define JSON structure, file paths, naming rules. Write to match Function Calling schemas so agents output in correct format.

### Constraints and Requirements

Specify constraints. List rules like "all types must be explicit", "any type prohibited", "all public methods require JSDoc comments". More constraints mean more consistent output quality.

Distinguish required vs. optional requirements. Use "MUST", "SHOULD", "MAY" to indicate priority. Agents satisfy required requirements first, then apply optional ones when possible.

Use negative commands when necessary. Explicitly list "things you must never do". Prevent critical mistakes like "never leave console.log in production code", "never include hardcoded passwords".

### Examples and Templates

Provide rich code examples. Include diverse examples from simple to complex. Agents find similar patterns and apply them.

Provide templates. Abstract recurring structures as templates and have agents fill in concrete values. For example, provide Controller class structure as a template and have agents populate methods.

Show anti-patterns. Include "don't do this" examples so agents learn patterns to avoid. Highlight frequently occurring mistakes.

### Context References

Specify context for agents to reference. Include instructions like "refer to the Prisma Schema below", "base on the provided Requirements Analysis Report".

Describe context structure. Specify JSON paths, field meanings, value ranges. Help agents interpret context correctly.

Establish context priority. When multiple contexts conflict, specify which takes precedence. For example, clearly state "OpenAPI specification is the source of truth, follow OpenAPI when there are discrepancies".

## Domain-Specific Guidelines

Each domain requires special guidelines.

### Requirements Analysis

Analyze agents transform natural language into structured documents. They clarify ambiguous requirements, infer missing parts, and organize into consistent format.

Prompts provide analysis framework. Guide the sequence of actor identification, use case definition, and feature specification. Present questions to consider at each step.

Encode domain knowledge. Include best practices for common web application patterns, authentication/authorization mechanisms, CRUD operations in prompts. Agents reference these to perform professional analysis.

### Database Schema Design

Prisma agents design data models. They define table structure, relationships, indexes, and constraints, considering normalization and performance.

Prompts emphasize data modeling principles. Explain normalization rules, relationship types (1:1, 1:N, N:M), and index strategies. Agents generate optimized schemas based on these.

Provide Prisma-specific knowledge. Guide in detail on using `@relation` attributes, `@@unique` constraints, and `@@index` definitions. Ensure compliance with formats expected by Prisma Compiler.

Handle edge cases. Provide guidance for complex scenarios like self-referential relationships, circular references, and composite foreign keys. Enable agents to handle difficult cases correctly.

### API Specification

Interface agents generate OpenAPI documents. They define endpoint paths, HTTP methods, parameters, and response schemas.

Prompts emphasize RESTful principles. Guide resource-centric design, semantic use of HTTP methods, and status code selection. Agents design APIs following REST best practices.

Explain OpenAPI 3.0 spec in detail. Specify structures like `paths`, `components/schemas`, `security`, `tags`. Ensure agents generate valid OpenAPI documents.

Emphasize alignment with Prisma schema. All fields referenced by APIs must actually exist in Prisma schema. Referencing non-existent fields causes errors in Realize stage.

### Test Generation

Test agents write E2E test code. They generate Jest-based tests that actually call API endpoints for verification.

Prompts guide test strategy. Explain Arrange-Act-Assert pattern and Given-When-Then structure. Emphasize that each test verifies only one scenario.

Provide test data generation methods. Guide on inserting test data into actual database and cleaning up after tests. Maintain independence between tests.

Emphasize edge case testing. Require testing not just normal cases, but also exceptional situations like invalid input, insufficient permissions, and missing resources.

### Implementation

Realize agents write actual API implementation code. They generate NestJS Controller, Service, Repository and implement business logic.

Prompts explain NestJS architecture. Guide Controller-Service-Repository layer separation, dependency injection, and decorator usage. Agents follow NestJS best practices.

Explain Prisma usage in detail. Provide examples of using `prisma.model.findUnique()`, `create()`, `update()`, `delete()` methods. Cover relationship data loading (`include`, `select`).

Maximize type safety. Require explicit types for all variables, parameters, and return values. Utilize Prisma-generated types to ensure type consistency between database and code.

Make error handling mandatory. Require `try-catch` blocks, appropriate HTTP exception throwing (`NotFoundException`, `BadRequestException`), and clear error messages.

## Prompt Maintenance

Prompts are living documents requiring continuous maintenance.

### Version Control

All prompt changes are managed with Git. Commit messages specify reason for change and expected effect. Write concretely like "Fix: Resolve issue where Realize Agent frequently uses any type - add emphasis on explicit type specification".

Correlate prompt versions with agent output quality. Track compilation success rate and retry count for code generated with specific prompt versions. When quality degradation is detected, identify the relevant commit and diagnose the problem.

### Testing

Always test after prompt changes. Run actual pipeline to verify agents behave as expected. Test with multiple scenarios to detect regressions early.

Build automated prompt tests. Verify that agent output is consistent for fixed inputs. Confirm that prompt changes didn't break existing functionality.

### Documentation

Prompts themselves are documentation, but meta-documentation is also needed. Record each prompt's purpose, usage location, and dependencies separately. Enable new developers to understand quickly.

Maintain prompt change history. Record chronologically when, why, and what changed. Understand prompt evolution process and reference for future changes.

### Performance Monitoring

Quantitatively measure prompt effectiveness. Use metrics like compilation success rate, average retry count, LLM call time, and token usage.

Measure impact of prompt changes through A/B testing. Compare output of previous prompt vs. new prompt for identical input. Apply when improvement is confirmed, rollback when degraded.

Optimize prompt length. Too short means insufficient instructions, too long means LLM might miss the point. Find optimal length through experimentation.

## Common Pitfalls

Common mistakes when writing prompts and their solutions.

### Ambiguity

Ambiguous instructions produce inconsistent output. Avoid expressions like "appropriate", "if necessary", "when possible". Provide clear criteria and constraints.

**Before**: "Add appropriate error handling"
**After**: "Wrap all Prisma calls in try-catch blocks and throw appropriate NestJS HTTP exceptions on error. Use NotFoundException when data is missing, BadRequestException for invalid input"

### Over-Specification

Excessively detailed instructions are also problematic. They limit LLM creativity and make prompts unnecessarily long. Specify only essential constraints and leave details to the LLM.

**Before**: "Variable names use camelCase with first letter lowercase, second word onwards capitalize first letter, use meaningful names and..."
**After**: "Name variables in camelCase with names that clearly convey meaning"

### Inconsistency

Inconsistency between prompts creates conflicts between agents. Problems arise if Prisma Agent uses snake_case while Realize Agent uses camelCase. Maintain consistency across all prompts.

Define common conventions in `COMMON.md` and have all Stage-Specific Prompts reference it. Changes in one place reflect across all agents.

### Neglecting Context

Agents fail when context expected by prompts differs from actual provided context. When writing prompts, review History Transformers together and accurately understand provided context structure.

If prompt says "refer to the Prisma Schema below", History Transformer must generate a section titled "Prisma Schema". Agents can't find context when they don't match.

### Ignoring Feedback

Prompts don't improve when user feedback and error logs are ignored. Regularly collect feedback and resolve recurring problems through prompt improvements.

Analyze error logs to find patterns. When specific types of compilation errors occur frequently, add preventive instructions to prompts. Include "common errors from previous versions" section in prompts.

## Best Practices Summary

Core principles for effective System Prompts:

1. **Clarity**: Eliminate ambiguity and provide concrete criteria
2. **Context**: Accurately understand and reference context agents will receive
3. **Examples**: Use rich examples to help LLM learn patterns
4. **Constraints**: Specify required requirements and prohibitions
5. **Consistency**: Ensure all prompts follow the same conventions
6. **Iteration**: Collect feedback and continuously improve
7. **Testing**: Validate in actual pipeline after changes
8. **Documentation**: Record reasons for changes and effects

Prompts are AutoBE's brain. Good prompts produce good code, bad prompts produce bad code. Design carefully, improve continuously, and always listen to user feedback.
