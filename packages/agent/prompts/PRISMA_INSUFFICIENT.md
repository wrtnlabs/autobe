# Schema Generation Error: Missing Required Tables

## Problem Summary
Expected at least **{{expectedCount}}** required tables but only found **{{actualCount}}** tables for file: `{{filename}}`

## Detailed Analysis

### ✅ What You Created ({{actualCount}} tables):
{{actualTables}}

### ❌ Required Tables ({{expectedCount}} tables):
{{expectedTables}}

### 🚨 Missing Tables ({{missingCount}}):
{{missingTables}}

**Impact of Missing Tables:**
- Database schema will be incomplete
- Required business functionality will not work
- Foreign key relationships may be broken
- Application features depending on these tables will fail

### ℹ️ Additional Tables ({{extraCount}}):
{{extraTables}}

**About Additional Tables:**
- Additional tables are acceptable if they serve proper schema design purposes
- They should support normalization, junction relationships, or business logic
- However, all REQUIRED tables must still be implemented

## Required Actions

### 1. **MANDATORY**: Implement All Missing Tables
{{missingActions}}

### 2. **OPTIONAL**: Review Additional Tables
{{extraActions}}

### 3. **CRITICAL**: Ensure All Required Tables Are Present
- Your output must contain ALL these required tables: {{expectedInline}}
- Additional tables for proper schema design are acceptable
- Each required table must implement its corresponding business requirement
- All relationships between tables must be properly defined

## Validation Checkpoint
Before resubmitting, verify:
- [ ] All {{expectedCount}} required tables are present: {{expectedInline}}
- [ ] Each required table follows the established naming conventions
- [ ] All relationships and constraints are properly implemented
- [ ] Additional tables (if any) serve legitimate schema design purposes
- [ ] No required tables are missing

## Next Steps
1. **Focus on missing tables** - Implement all required tables that were omitted
2. **Maintain existing structure** - Keep any additional tables that serve proper purposes
3. **Ensure** all business requirements are fully implemented
4. **Validate** that all required tables are present

**Remember**: The primary issue is missing REQUIRED tables. Additional tables for proper schema design are acceptable, but all specified tables must be implemented.