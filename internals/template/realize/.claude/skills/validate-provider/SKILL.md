---
name: validate-provider
description: Validate Providers against interfaces (read-only)
allowed-tools: Read, Grep, Glob
---

# Validate Providers

Validate that Providers, Collectors, and Transformers properly implement the interfaces. This skill only checks for discrepancies - it does NOT modify any files.

## Purpose

Compare interface definitions with provider implementations and report:
- ✅ Matching items
- ❌ Mismatching items (needs fix)
- ⚠️ Items requiring review

## Workflow

```
┌─────────────────────────────────────┐
│  Step 1: Read Interfaces            │
│  /src/api/structures/               │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│  Step 2: Read Providers             │
│  /src/providers/                    │
│  /src/collectors/                   │
│  /src/transformers/                 │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│  Step 3: Compare & Report           │
│  - Missing providers                │
│  - Missing collectors               │
│  - Missing transformers             │
│  - Type safety issues               │
└─────────────────────────────────────┘
```

---

## Step 1: Read Interfaces

```bash
find src/api/structures -name "I*.ts" -type f
```

For each interface, identify:
- Main entity type
- ICreate subtype
- IUpdate subtype
- ISummary subtype

---

## Step 2: Read Implementation Files

```bash
# Providers
find src/providers -name "*.ts" -type f

# Collectors
find src/collectors -name "*Collector.ts" -type f

# Transformers
find src/transformers -name "*Transformer.ts" -type f
```

---

## Step 3: Validation Checks

### 3.1 Provider Coverage
For each interface:
- ✅ POST provider exists (uses ICreate)
- ✅ GET provider exists (returns Interface)
- ✅ PATCH/PUT provider exists (uses IUpdate)
- ✅ DELETE provider exists
- ❌ Provider missing

### 3.2 Collector Coverage
For each interface with ICreate:
- ✅ Collector exists
- ✅ Collector returns Prisma.CreateInput
- ❌ Collector missing
- ❌ Wrong return type

### 3.3 Transformer Coverage
For each interface:
- ✅ Transformer exists
- ✅ transform() method defined
- ✅ toSummary() method defined
- ❌ Transformer missing
- ❌ Methods missing

### 3.4 Type Safety
Search for anti-patterns:
- ❌ `as any` usage
- ❌ `any` type annotations
- ❌ Type assertions (`as Type`)
- ⚠️ Inline transformations (should use Transformer)

---

## Output Format

```markdown
# Validation Report: Providers

## Summary
- Interfaces: X
- Providers found: Y
- Collectors found: Z
- Transformers found: W

## ✅ Valid Items
- [Provider] `postEntity` - Uses Collector, returns via Transformer
- [Collector] `EntityCollector` - Properly typed
- [Transformer] `EntityTransformer` - All methods present

## ❌ Issues Found
- [Missing Collector] `AnotherEntity` - No collector for ICreate
- [Missing Transformer] `AnotherEntity` - No transformer defined
- [Type Safety] `postEntity.ts:27` - Uses `as any`
- [Type Safety] `getEntity.ts:15` - Inline transformation instead of Transformer

## ⚠️ Warnings
- [Unused Import] `postEntity.ts` - Imports unused module
- [Missing Null Check] `getEntity.ts:20` - Should check for null before transform

## Recommendation
Run `/fix-provider` to fix the issues above.
```

---

## Important

**This skill is READ-ONLY.**

- Does NOT modify any files
- Does NOT run any build commands
- Only reports discrepancies

To fix issues, use `/fix-provider` skill.
