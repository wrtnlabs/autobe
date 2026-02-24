---
name: validate-db
description: Validate Prisma schema against requirements specification (read-only)
allowed-tools: Read, Grep, Glob
---

# Validate Database Schema

Validate that Prisma schema matches the requirements specification. This skill only checks for discrepancies - it does NOT modify any files.

## Purpose

Compare requirements documents with Prisma schema and report:
- ✅ Matching items
- ❌ Mismatching items (needs fix)
- ⚠️ Items requiring review

## Workflow

```
┌─────────────────────────────────────┐
│  Step 1: Read Requirements          │
│  /docs/analysis/*.md                │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│  Step 2: Read Prisma Schema         │
│  /prisma/schema/*.prisma            │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│  Step 3: Compare & Report           │
│  - Missing tables                   │
│  - Missing columns                  │
│  - Type mismatches                  │
│  - Relationship issues              │
└─────────────────────────────────────┘
```

---

## Step 1: Read Requirements

```bash
find docs/analysis -name "*.md" -type f
```

Extract from each document:
- Entity definitions
- Field requirements (name, type, nullable, constraints)
- Relationship descriptions
- Business rules

---

## Step 2: Read Prisma Schema

```bash
find prisma/schema -name "*.prisma" -type f
```

Extract from schema:
- Model definitions
- Field types and attributes
- Relations and foreign keys
- Indexes

---

## Step 3: Validation Checks

### 3.1 Entity Coverage
For each entity in requirements:
- ✅ Model exists in schema
- ❌ Model missing from schema

### 3.2 Field Coverage
For each required field:
- ✅ Field exists with correct type
- ❌ Field missing
- ❌ Field has wrong type
- ⚠️ Nullable mismatch

### 3.3 Relationship Coverage
For each relationship:
- ✅ Relation properly defined
- ❌ Relation missing
- ❌ Wrong cardinality (1:1, 1:N, N:M)
- ⚠️ Missing onDelete cascade

### 3.4 Naming Convention
- ✅ Table names follow `{prefix}_{entities}` pattern
- ❌ Inconsistent naming
- ⚠️ Non-standard field names

**Boolean fields:**
- ✅ Boolean fields have `is_` prefix (e.g., `is_active`, `is_public`)
- ❌ Boolean field missing `is_` prefix (e.g., `active` → `is_active`)

**Field name consistency:**
- ✅ Same-purpose fields have consistent names across tables
- ❌ Inconsistent naming (e.g., `expires_at` in one table, `expired_at` in another)
- Common fields to check: `*_at` timestamps, `*_id` foreign keys, status fields

### 3.5 Table Necessity
Compare with requirements to identify unnecessary tables:

**Duplicate tables:**
- ❌ Multiple tables serving same purpose
- ⚠️ Tables with overlapping responsibilities

**Unnecessary snapshot/history tables:**
- ❌ Snapshot table exists but requirements say data should be directly editable
- ❌ History table without audit/versioning requirement
- ✅ Snapshot table exists and requirements specify versioning/history

---

## Output Format

```markdown
# Validation Report: Database Schema

## Summary
- Total entities in requirements: X
- Entities found in schema: Y
- Missing entities: Z

## ✅ Valid Items
- [Entity] `users` - All fields match
- [Entity] `posts` - All fields match

## ❌ Issues Found
- [Missing Entity] `comments` - Defined in requirements but not in schema
- [Missing Field] `users.phone` - Required but not defined
- [Type Mismatch] `posts.view_count` - Expected Int, found String
- [Naming] `users.active` - Boolean field should be `is_active`
- [Naming] `sessions.expired_at` - Inconsistent with `tokens.expires_at`
- [Unnecessary Table] `post_snapshots` - Requirements say posts are directly editable

## ⚠️ Warnings
- [Nullable] `users.bio` - Requirements say required, schema allows null
- [Index] `posts` - Consider adding index on `created_at`
- [Duplicate] `user_profiles` and `users` - May have overlapping responsibilities

## Recommendation
Run `/fix-db` to fix the issues above.
```

---

## Important

**This skill is READ-ONLY.**

- Does NOT modify any files
- Does NOT run any build commands
- Only reports discrepancies

To fix issues, use `/fix-db` skill.
