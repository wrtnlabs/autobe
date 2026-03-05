# AutoBE Prompt Writing Guide

## 1. Why Prompts Matter

Prompts are what drive AutoBE. Good prompts produce good code, bad prompts produce bad code. It's that simple.

There are 40+ agents connected in a pipeline, where each agent's output feeds into the next. One broken prompt can take down everything downstream.

### 1.1. Two Axes of Prompt Optimization

| Axis | Goal | Why It Matters |
|------|------|----------------|
| Quality | Agents produce accurate output | Prevents compilation errors, logic bugs, architectural inconsistencies |
| Token Efficiency | Same quality with minimal tokens | Cost reduction, faster responses, more context window headroom |

---

## 2. Prompt Architecture

### 2.1. Hierarchy

All prompts inherit from `COMMON.md`, which provides shared identity and rules. Under that, there are three categories: Write prompts (like `DATABASE_SCHEMA.md`, `INTERFACE_OPERATION.md`), Review prompts (like `DATABASE_SCHEMA_REVIEW.md`), and Correct prompts (like `DATABASE_CORRECT.md`, `REALIZE_CORRECT.md`).

### 2.2. Common Prompt (COMMON.md)

This is the foundation shared by all agents. It covers:

- Context: Awareness of being part of a 40+ agent team, not operating alone
- Principles: Production-First, Compiler-Driven, Single-Pass Excellence
- Internationalization: Messages follow user locale, code and documentation in English

### 2.3. Pipeline Dependencies

When modifying a prompt, always understand what comes before and after it.

The DATABASE pipeline goes like this:

```
GROUP → GROUP_REVIEW → COMPONENT → COMPONENT_REVIEW
  → AUTHORIZATION → AUTHORIZATION_REVIEW
  → SCHEMA → SCHEMA_REVIEW → CORRECT
```

Here's how each stage's output feeds into the next:

| Previous Stage | Output | Next Stage Receives |
|---------------|--------|---------------------|
| GROUP | namespace, filename, kind | COMPONENT uses as-is |
| COMPONENT | tables[] | SCHEMA processes one at a time |
| SCHEMA | model (AST) | SCHEMA_REVIEW validates |
| SCHEMA_REVIEW | corrected model or null | CORRECT handles compile errors |

---

## 3. Prompt Types and Standard Structures

### 3.1. Write Prompts (Generation)

These create new artifacts like tables, models, or code.

Standard structure:

1. Title + one-line mission
2. Quick Reference (tables) covering your assignment, key rules summary, and naming conventions
3. Core rules/patterns with normalization rules (DB), code patterns (Realize), and ❌/✅ examples
4. Function Calling section with preliminary requests (getAnalysisSections) and the complete request
5. Input Materials Management
6. Final Checklist

Primary output: `tables`, `model`, `groups`, etc.

### 3.2. Review Prompts (Validation)

These validate existing artifacts and suggest corrections.

Standard structure:

1. Title + one-line mission
2. Quick Reference covering your mission (Input/Output) and domain boundary rule
3. Verification checklist with dimensions (Critical/Major/Minor)
4. Revision operations (create/update/erase) with examples for each
5. Function Calling section for completing with or without changes
6. Final Checklist

Primary output: `revises[]` array, or `content` (corrected model) / `null` (no changes).

### 3.3. Correct Prompts (Error Fixing)

These fix compilation errors with minimal changes.

Standard structure:

1. Title + one-line mission
2. Quick Reference covering error structure and core rules (MUST DO / MUST NOT DO)
3. Error patterns and fix methods
4. Fix Strategy (analyze → plan → execute)
5. Function Calling (EXACTLY ONE CALL)
6. Final Checklist

Primary output: `models[]` — only the corrected models, not the entire schema.

---

## 4. Token Optimization Techniques

### 4.1. Benchmark Targets

| Prompt Type | Original Average | Target | Measured Reduction |
|-------------|-----------------|--------|-------------------|
| Write | 800-1,400 lines | 250-350 lines | 70-82% |
| Review | 400-820 lines | 160-270 lines | 56-70% |
| Correct | 470 lines | 190 lines | 60% |

### 4.2. Conversion Rules

**Verbose explanations → Tables (most effective)**

This is by far the biggest win. Take something like this:

```markdown
// ❌ BEFORE (15 lines)
### Guest (`kind: "guest"`)
Minimal authentication - temporary/anonymous access without credentials.

**Required Tables**:
- Main table: Basic identification fields, no password
- Session table: Temporary tokens only

**Optional Tables**:
- None typically needed for guests

The guest pattern is used when users need temporary access...
(explanation continues)

// ✅ AFTER (3 lines)
| Kind | Required Tables | Optional Tables |
|------|-----------------|-----------------|
| **guest** | `{actor}s` + `{actor}_sessions` | — |
```

**Repeated prohibitions → Single table**

If you find the same rule repeated 5-6 times across different sections, consolidate it:

```markdown
// ❌ BEFORE (same rule repeated 5-6 times across sections)
**ABSOLUTE PROHIBITIONS**:
- ❌ NEVER call complete in parallel...

**ZERO TOLERANCE POLICY**:
- When informed that materials are already loaded...

**NO EXCEPTIONS**:
- You CANNOT use your own judgment...

**ENFORCEMENT**:
- This is an ABSOLUTE RULE...

// ✅ AFTER (stated once)
| ✅ MUST DO | ❌ MUST NOT DO |
|-----------|---------------|
| Fix ONLY validation errors listed | Modify models without errors |
| Return ONLY corrected models | Return entire schema |
| Execute in ONE function call | Make multiple/parallel calls |
```

**Excessive warnings → Keep only the rule**

LLMs don't need paragraphs of justification. They need the rule.

```markdown
// ❌ BEFORE
**WHY THIS MATTERS**:
1. **Accuracy**: Assumptions lead to incorrect outputs...
2. **Correctness**: Real requirements may differ...
3. **System Stability**: Imagination-based outputs corrupt...
4. **Compiler Compliance**: Only actual data guarantees...

**ENFORCEMENT**:
This is an ABSOLUTE RULE with ZERO TOLERANCE:
- If you find yourself thinking...
- If you consider "I'll assume..."
- If you reason "based on similar cases..."

// ✅ AFTER
| ❌ FORBIDDEN | ✅ REQUIRED |
|-------------|------------|
| Working from assumptions | Call `getAnalysisSections` FIRST |
| Guessing "typical patterns" | Work ONLY with loaded data |
```

**Checklist deduplication**

Watch out for checklist items that say the same thing in slightly different ways:

```markdown
// ❌ BEFORE (35 items, half redundant)
- [ ] Every concept in rationale has tables
- [ ] Every business capability has supporting tables  ← same as above
- [ ] Rationale mentions "X, Y, Z" → Tables for X, Y, AND Z  ← same as above
- [ ] If rationale mentions concepts without tables → Created them  ← same as above

// ✅ AFTER (essentials only)
- [ ] Every concept in rationale has tables
- [ ] Every "SHALL" statement has table support
- [ ] Every workflow can execute
```

### 4.3. What to Remove

| Remove | Reason |
|--------|--------|
| Same rule repeated 3+ times | 1-2 mentions is sufficient |
| "WHY THIS MATTERS" lengthy explanations | LLMs need the rule, not the justification |
| "ZERO TOLERANCE", "ABSOLUTE OBEDIENCE" | Threat language has no measurable effect |
| Duplicate ❌/✅ examples of the same pattern | 1 example is sufficient |
| Checklist items that rephrase the same requirement | Consolidate |
| "REMEMBER:" repeated emphasis blocks | Once in checklist is enough |

### 4.4. What to Keep

| Keep | Reason |
|------|--------|
| Core business logic/rules | Determines agent behavior |
| AST structure/interface definitions | Defines output format |
| Normalization patterns (with code examples) | Determines quality |
| Function Calling format | Required for execution |
| At least 1 ❌/✅ example per key pattern | Few-shot learning |
| Critical prohibitions (stated once) | Prevents fatal mistakes |

---

## 5. Prompt Writing Principles

### 5.1. Clarity and Specificity

Use concrete criteria instead of vague language.

```markdown
// ❌ Vague
"Add appropriate error handling"

// ✅ Specific
"Wrap all Prisma calls in try-catch. Throw NotFoundException when data
is missing, BadRequestException for invalid input."
```

Specify numbers and constraints wherever you can.

```markdown
// ❌ Vague
"brief description"

// ✅ Specific
"description under 200 characters"
"3-15 tables per component"
"checklist items maximum 15"
```

### 5.2. Positive Directives First

LLMs respond better to being told what to do than what not to do.

```markdown
// ❌ Negative (easy to miss)
"Don't use any type"

// ✅ Positive (easy to follow)
"Specify explicit types for all variables and parameters"
```

For critical prohibitions, use a single ❌/✅ table.

### 5.3. Example-Driven Learning

One good example beats 100 lines of explanation. Show, don't tell.

```markdown
// ❌ Verbose explanation
"When following normalization principles for 1:1 relationships where
optional entities exist, you should avoid nullable fields and instead
create separate tables to ensure data integrity and prevent NULL
field proliferation..."

// ✅ Show with code
// ❌ WRONG
shopping_sale_questions: { answer_title: string? }

// ✅ CORRECT
shopping_sale_questions: { id, title, body }
shopping_sale_question_answers: { id, question_id, title, body }
```

Some ground rules for examples:

- At least 1 ❌/✅ example per key pattern (required)
- Don't repeat 2+ examples of the same pattern
- Use examples from actual production code when possible

### 5.4. Context Awareness

Write prompts based on what agents actually receive, not what you wish they had.

```markdown
// ❌ References non-existent context
"Refer to the Prisma Schema provided below..."

// ✅ References actual input
"Create the table specified in targetTable"
"Other tables in targetComponent.tables are handled separately"
```

When writing prompts, review History Transformers together to understand the exact context structure provided.

### 5.5. Cross-Prompt Consistency

There are certain standard elements that must be identical across all prompts.

Common opening:

```markdown
"Function calling is MANDATORY - execute immediately without asking for permission."
```

Common sections that should appear in every prompt: Input Materials Management table (loaded/available/exhausted), `thinking` field guidelines, and Final Checklist format.

Common rules: snake_case table names, camelCase relation names, "NEVER work from imagination", English descriptions required.

---

## 6. Function Calling Patterns

This is the core execution mechanism for all AutoBE prompts.

### 6.1. Workflow

The flow is straightforward: first, make preliminary requests (like `getAnalysisSections`) to load materials, then once materials are loaded, make the complete request with `type: "complete"`.

### 6.2. Preliminary Request Types

| Type | Purpose |
|------|---------|
| `getAnalysisSections` | Load requirement document sections |
| `getPreviousAnalysisSections` | Load previous version requirement sections (regeneration only) |
| `getPreviousDatabaseSchemas` | Load previous version schemas (regeneration only) |
| `getDatabaseSchemas` | Reference current schemas |

### 6.3. Absolute Rules

Never run preliminary and complete requests in parallel. Always wait for materials to load first.

```typescript
// ❌ FORBIDDEN - parallel preliminary and complete
process({ request: { type: "getAnalysisSections", ... } })
process({ request: { type: "complete", ... } })  // Executes without loaded data!

// ✅ CORRECT - sequential execution
process({ request: { type: "getAnalysisSections", ... } })
// After materials loaded
process({ request: { type: "complete", ... } })
```

### 6.4. Input Materials Management

Include this table identically in all prompts:

| Instruction | Action |
|-------------|--------|
| Materials already loaded | DO NOT re-request |
| Materials available | May request if needed |
| Materials exhausted / returns `[]` | DO NOT call that type again, proceed to complete |

### 6.5. thinking Field

Keep it concise. A short summary of what you're doing and why.

```typescript
// ✅ Concise summary
thinking: "Missing business domain context. Need requirements."
thinking: "Designed 12 tables for Sales component covering all requirements."

// ❌ Too detailed
thinking: "Need 00-toc.md, 01-overview.md, 02-business-model.md..."
thinking: "Created users table with id, email, password_hash, user_sessions table with..."
```

---

## 7. Prompt Optimization Workflow

### 7.1. File Management

Originals go in `prompts/1_originals/` and should never be modified. Working copies go in `prompts/3_working/` with a `_working.md` suffix.

### 7.2. Optimization Procedure

```bash
# 1. Copy original to working folder
cp 1_originals/TARGET.md 3_working/TARGET_working.md

# 2. Edit in VS Code
# 3. Test in actual pipeline
# 4. Verify and apply
```

### 7.3. Optimization Checklist

Follow this order when optimizing a prompt:

**Step 1: Structure**
- [ ] Apply standard structure template (matching prompt type)
- [ ] Write title + one-line mission
- [ ] Create Quick Reference tables

**Step 2: Compress Content**
- [ ] Verbose explanations → tables
- [ ] Repeated prohibitions → single table
- [ ] Remove excessive warnings (rule once is enough)
- [ ] Remove duplicate examples (1 per pattern)
- [ ] Consolidate duplicate checklist items

**Step 3: Verify Required Elements**
- [ ] Function Calling section included
- [ ] Input Materials Management included
- [ ] At least 1 ❌/✅ example per key pattern
- [ ] Final Checklist included
- [ ] `thinking` field guide included

**Step 4: Quality Verification**
- [ ] No core business logic lost
- [ ] AST structure/interface definitions preserved
- [ ] Target reduction achieved (60-80%)

---

## 8. Domain-Specific Guidelines

### 8.1. Requirements Analysis (Analyze)

This phase transforms natural language into structured documents. The sequence goes: actor identification → use case definition → feature specification. Make sure to include common web application patterns and authentication/authorization mechanisms.

### 8.2. Database Design (Database)

Normalization principles (1NF, 2NF, 3NF) are mandatory. Prisma-specific annotations like `@relation`, `@@unique`, `@@index` need to be used correctly. Key patterns to know: Separate Entities, Polymorphic Ownership, Snapshot. One important rule: never create actor tables here, the Authorization Agent handles those.

### 8.3. API Specification (Interface)

Follow RESTful principles and OpenAPI 3.0 compliance. All API fields must exist in the Prisma schema. If you reference a field that doesn't exist, it'll cause errors in the Realize stage.

### 8.4. Test Generation (Test)

Tests are Jest-based E2E tests. Use Arrange-Act-Assert or Given-When-Then patterns. Cover both normal cases and edge cases (invalid input, insufficient permissions, missing resources).

### 8.5. Implementation (Realize)

Follow NestJS Controller-Service-Repository layer separation. For Prisma usage, stick to `findUnique`, `create`, `update`, `delete`. Explicit types are required — `any` is prohibited. Error handling means try-catch with HTTP exception throwing.

---

## 9. Common Pitfalls and Solutions

### 9.1. Ambiguity

Words like "appropriate", "if necessary", "when possible" are too vague. Replace them with clear criteria and constraints.

### 9.2. Over-Specification

Don't spend 5 lines explaining variable naming rules. Just say "camelCase with meaningful names" and move on. Same rule: maximum 2 mentions across the entire prompt.

### 9.3. Cross-Prompt Inconsistency

If Database prompts use snake_case and Realize prompts use camelCase, you've got a problem. Define common rules in `COMMON.md` and have all prompts reference it.

### 9.4. Context Mismatch

If your prompt says "Refer to the Prisma Schema below" but no schema is actually provided, the agent will hallucinate. Match exactly what the History Transformer provides.

### 9.5. Ignoring Feedback

Don't ignore recurring compilation errors. Analyze error logs and add preventive instructions to prompts.

---

## 10. Core Principles Summary

| Principle | Description |
|-----------|-------------|
| Clarity | Eliminate ambiguity, provide concrete criteria |
| Efficiency | Same quality with minimal tokens (60-80% reduction target) |
| Structure | Follow standard templates per prompt type |
| Examples | ❌/✅ code examples over lengthy explanations |
| Consistency | All prompts follow the same rules and format |
| Dependencies | Understand upstream and downstream pipeline stages |
| No Repetition | Same rule maximum 2 times, remove duplicate examples |
| Testing | Validate in actual pipeline after changes |