---
name: validate-test
description: Validate test coverage against providers (read-only)
allowed-tools: Read, Grep, Glob
---

# Validate Test Infrastructure

Validate that test infrastructure properly covers providers and interfaces. This skill only checks for discrepancies - it does NOT modify any files.

## Purpose

Compare interface/provider implementations with test coverage and report:
- ✅ Matching items
- ❌ Mismatching items (needs fix)
- ⚠️ Items requiring review

## Workflow

```
┌─────────────────────────────────────┐
│  Step 1: Read Interfaces            │
│  /src/api/structures/ (ICreate)     │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│  Step 2: Read Test Files            │
│  /test/prepare/                     │
│  /test/generate/                    │
│  /test/features/api/                │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│  Step 3: Compare & Report           │
│  - Missing prepare functions        │
│  - Missing generate functions       │
│  - Missing test scenarios           │
│  - Empty implementations            │
└─────────────────────────────────────┘
```

---

## Step 1: Extract ICreate Interfaces

```bash
grep -r "export type ICreate\|\.ICreate" src/api/structures/ --include="*.ts"
```

List all interfaces that need test data generators.

---

## Step 2: Read Test Files

```bash
# Prepare functions
find test/prepare -name "prepare_random_*.ts" -type f

# Generate functions
find test/generate -name "generate_random_*.ts" -type f

# Feature tests
find test/features/api -name "*.ts" -type f
```

---

## Step 3: Validation Checks

### 3.1 prepare_random Coverage
For each ICreate interface:
- ✅ prepare_random_* function exists
- ❌ Function missing
- ❌ Function returns empty `{}`

### 3.2 generate_random Coverage
For each prepare_random function:
- ✅ generate_random_* function exists (1:1 mapping)
- ❌ Function missing
- ❌ Orphan generate without prepare

### 3.3 Test Scenario Coverage
For each entity:
- ✅ Create test exists
- ✅ Read test exists
- ✅ Update test exists
- ✅ Delete test exists
- ❌ Missing CRUD tests
- ⚠️ Missing edge case tests

### 3.4 Test Quality
- ✅ Uses prepare_random (not hardcoded data)
- ✅ Uses generate_random (not direct API calls)
- ❌ Uses typia.random with empty type
- ❌ Hardcoded UUIDs
- ⚠️ Missing assertions

---

## Output Format

```markdown
# Validation Report: Test Infrastructure

## Summary
- ICreate interfaces: X
- prepare_random functions: Y
- generate_random functions: Z
- Test files: W

## ✅ Valid Items
- [Prepare] `prepare_random_entity` - All fields generated
- [Generate] `generate_random_entity` - Properly calls API
- [Test] `test_entity_create` - Complete assertions

## ❌ Issues Found
- [Missing Prepare] `another_entity` - No prepare function for ICreate
- [Missing Generate] `another_entity` - No generate function
- [Empty Prepare] `prepare_random_thing.ts` - Returns `{}`
- [Orphan Generate] `generate_random_old.ts` - No matching prepare function

## ⚠️ Warnings
- [Missing Test] `entity` - No delete test scenario
- [Edge Case] `entity` - No validation error test
- [Edge Case] `entity` - No unauthorized access test

## Recommendation
Run `/fix-test` to fix the issues above.
```

---

## Important

**This skill is READ-ONLY.**

- Does NOT modify any files
- Does NOT run any build commands
- Only reports discrepancies

To fix issues, use `/fix-test` skill.
