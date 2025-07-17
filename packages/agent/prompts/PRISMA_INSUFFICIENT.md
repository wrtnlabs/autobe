# Schema Generation Error: Target Component Tables Missing

## Problem Summary
Expected ALL **{{expectedCount}}** tables from target component `{{namespace}}` but only found **{{actualCount}}** tables for file: `{{filename}}`

## Component Analysis

### 🎯 Target Component: `{{namespace}}`
**YOU MUST CREATE ALL THESE TABLES:**
{{expectedTables}}

### ✅ What You Actually Created ({{actualCount}} tables):
{{actualTables}}

### 🚨 CRITICAL: Missing Required Tables ({{missingCount}}):
{{missingTables}}

**Severe Impact of Missing Tables:**
- **BUSINESS DOMAIN INCOMPLETE** - The `{{namespace}}` domain cannot function without these tables
- **BROKEN SCHEMA ARCHITECTURE** - Missing core entities will cause system failures
- **VIOLATED COMPONENT CONTRACT** - You failed to implement the assigned component specification
- **IMPOSSIBLE DEPLOYMENT** - Application cannot be deployed with missing required tables

### ℹ️ Additional Tables ({{extraCount}}):
{{extraTables}}

**About Additional Tables:**
- Additional tables are acceptable ONLY if they serve the `{{namespace}}` domain
- They must support normalization, junction relationships, or business logic within your assigned domain
- **NEVER create tables that belong to other components' domains**
- However, ALL target component tables must still be implemented

### 🚫 Domain Boundary Violations ({{violationCount}}):
{{domainViolations}}

**CRITICAL ERROR: Domain Invasion Detected:**
- You created tables that belong to OTHER components' business domains
- This violates the fundamental principle of domain-driven design
- These tables should be handled by their respective components
- **IMMEDIATELY REMOVE** these tables from your output

## Required Actions

### 1. **MANDATORY**: Implement ALL Missing Target Tables
{{missingActions}}

**NO EXCEPTIONS - EVERY TABLE MUST BE IMPLEMENTED:**
- These tables are specifically assigned to your component
- Each table serves critical business functionality in the `{{namespace}}` domain  
- Missing ANY table renders the entire component non-functional
- Your component contract requires 100% implementation

### 2. **MANDATORY**: Remove Domain Violations
{{violationActions}}

**DOMAIN BOUNDARIES ARE SACRED:**
- Each component owns its specific business domain
- Creating tables in other domains causes architectural chaos
- Other components will handle their own tables
- Stay within your assigned `{{namespace}}` domain

### 3. **OPTIONAL**: Review Additional Tables
{{extraActions}}

**Additional Tables Guidelines:**
- Keep additional tables that serve legitimate schema design purposes within `{{namespace}}`
- Ensure they support normalization, junction relationships, or business logic
- Remove any that don't clearly belong to your domain

### 4. **CRITICAL**: Perfect Component Implementation
- Your output must contain ALL {{expectedCount}} target component tables: {{expectedInline}}
- Use the exact filename: `{{filename}}`
- Use the exact namespace: `{{namespace}}`
- Additional tables are acceptable only within your domain
- Each required table must implement its corresponding business requirement
- All relationships between tables must be properly defined

## Validation Checkpoint
Before resubmitting, verify:
- [ ] ALL {{expectedCount}} target component tables are present: {{expectedInline}}
- [ ] Correct filename used: `{{filename}}`
- [ ] Correct namespace used: `{{namespace}}`
- [ ] NO tables from other components' domains are created
- [ ] Each required table follows the established naming conventions
- [ ] All relationships and constraints are properly implemented
- [ ] Additional tables (if any) serve legitimate purposes within `{{namespace}}` domain
- [ ] Zero tolerance for missing target tables

## Next Steps
1. **IMMEDIATELY implement missing tables** - Every single table from target component must be created
2. **REMOVE domain violations** - Delete any tables that belong to other components
3. **MAINTAIN domain focus** - Keep only tables that belong to `{{namespace}}` domain
4. **PERFECT the implementation** - Ensure all business requirements are fully implemented
5. **VALIDATE completeness** - Triple-check that all target component tables are present

## Final Warning

**THIS IS A CRITICAL ARCHITECTURAL ERROR.**

You have failed to implement the assigned component contract. The `{{namespace}}` component cannot function without its required tables. This is not a minor issue - it's a fundamental failure to follow the component-based architecture.

**ZERO TOLERANCE POLICY:**
- **EVERY target component table MUST be implemented**
- **NO domain boundary violations are acceptable**
- **Component contracts are non-negotiable**
- **Perfect implementation is required**

The database schema generation depends on each component being implemented completely and correctly. Your failure to implement the target component tables breaks the entire system architecture.

**REGENERATE IMMEDIATELY** with ALL target component tables implemented and NO domain violations.