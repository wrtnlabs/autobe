---
name: add-feature
description: Implement new feature with self-testing loop until 100% pass
argument-hint: "[feature-description]"
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Add Feature

Implement a new feature and iterate until all tests pass (100% success rate).

## FORBIDDEN

**NEVER use:**
- `as` keyword (type assertion)
- `any` type

---

## Feature Description

$ARGUMENTS

---

## Workflow Overview

```
┌─────────────────────────────────────┐
│  Phase 1: Implementation            │
│  - Controller                       │
│  - Provider                         │
│  - Collector/Transformer            │
│  - Interface                        │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│  Phase 2: Test Design               │
│  - Happy path tests                 │
│  - Error case tests                 │
│  - Edge case tests                  │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│  Phase 3: Test Loop                 │
│  while (pass_rate < 100%) {         │
│    run tests                        │
│    analyze failures                 │
│    fix code                         │
│  }                                  │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│  Complete                           │
│  All tests pass!                    │
└─────────────────────────────────────┘
```

---

## Phase 1: Implementation

See: `flow-implement.md`

1. **Analyze Requirements**
   - Understand the feature from `$ARGUMENTS`
   - Identify affected entities
   - Determine API endpoints needed

2. **Create/Update Interface**
   - Define DTOs (ICreate, IUpdate, ISummary, IRequest)
   - Add typia tags for validation

3. **Create/Update Collector**
   - Transform ICreate → Prisma.CreateInput

4. **Create/Update Transformer**
   - Transform Prisma record → Interface

5. **Create/Update Provider**
   - Implement business logic
   - Use Collector for create operations
   - Use Transformer for responses

6. **Create/Update Controller**
   - Define routes with TypedRoute
   - Add authentication decorators
   - Connect to Provider

7. **Verify Build**
   ```bash
   npm run build:main
   ```

---

## Phase 2: Test Design

See: `flow-test-design.md`

Design comprehensive test scenarios including:

### Happy Path (Normal Cases)
- ✅ Create entity successfully
- ✅ Read entity successfully
- ✅ Update entity successfully
- ✅ Delete entity successfully
- ✅ List entities with pagination

### Error Cases
- ❌ Create with missing required fields
- ❌ Create with invalid field format
- ❌ Read non-existent entity (404)
- ❌ Update non-existent entity (404)
- ❌ Delete non-existent entity (404)
- ❌ Unauthorized access (401)
- ❌ Forbidden action (403)

### Edge Cases
- ⚠️ Empty string input
- ⚠️ Null values for optional fields
- ⚠️ Maximum length strings
- ⚠️ Minimum/maximum numeric values
- ⚠️ Special characters in strings
- ⚠️ Duplicate creation attempt
- ⚠️ Concurrent modification
- ⚠️ Parent entity doesn't exist
- ⚠️ Circular reference attempt
- ⚠️ Soft-deleted entity access

---

## Phase 3: Test Loop

See: `flow-test-loop.md`

```
REPEAT:
  1. Build tests
     npm run build:test

  2. Run tests
     npm run test -- --include "{feature}"

  3. If all pass → DONE

  4. If failures:
     a. Analyze failure reason
     b. Determine if test code issue or business logic issue
     c. Fix the appropriate code
     d. Go to step 1

UNTIL: 100% pass rate
```

---

## Exit Conditions

✅ **Success Criteria:**
- `npm run build:main` passes
- `npm run build:test` passes
- `npm run test` passes with 100% success rate
- All happy path tests pass
- All error case tests pass
- All edge case tests pass

❌ **Failure (requires manual intervention):**
- Circular dependency detected
- External service unavailable
- Database schema change required
- Requirements ambiguity

---

## Output

When complete, provide:

```markdown
## Feature Implementation Complete

### Summary
- Feature: {description}
- Files created/modified: X
- Test scenarios: Y
- Pass rate: 100%

### Files Changed
- src/api/structures/I{Entity}.ts
- src/controllers/{path}/{Controller}.ts
- src/providers/{provider}.ts
- src/collectors/{Collector}.ts
- src/transformers/{Transformer}.ts
- test/prepare/prepare_random_{entity}.ts
- test/generate/generate_random_{entity}.ts
- test/features/api/{entity}/*.ts

### Test Results
- Total: X tests
- Passed: X
- Failed: 0
```
