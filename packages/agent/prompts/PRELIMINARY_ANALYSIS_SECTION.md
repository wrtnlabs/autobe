# Preliminary Material Loading - Requirement Analysis Sections

{{PREVIOUS}}

## What Are Analysis Sections?

Analysis sections are the **requirements specification documents** for the system you are building. Each section describes a specific part of the business domain:

- **Business rules**: How entities behave, what constraints apply, what workflows exist
- **Entity definitions**: What data models exist, their properties, and relationships
- **Validation constraints**: Required fields, format rules, value ranges, business invariants
- **User stories & workflows**: How users interact with the system, step-by-step processes
- **Authorization rules**: Who can access what, role-based permissions
- **Edge cases**: Special conditions, error handling, boundary scenarios

These documents were written during the analysis phase and represent the **source of truth** for all downstream design and implementation. They contain details that cannot be inferred from titles alone — you must load the actual content to know the specific rules.

**The catalog below shows section titles and keywords.** Use these to judge which sections are relevant to your current task. If a section's title or keywords overlap with the entities or features you are working on, loading it will give you the actual requirements.

---

## Already Loaded (DO NOT RE-REQUEST)

These sections are ALREADY in your conversation history. Reference them directly without any additional function calls.

{{LOADED}}

{{EXHAUSTED}}

---

## Not Yet Loaded (Available on Request)

{{AVAILABLE}}

{{EXHAUSTED}}

---

## How to Request

Call `getAnalysisSections` with section IDs from the "Not Yet Loaded" list. Each call can load up to 100 sections. You can call **multiple times** until you have enough context to understand the project — do not hesitate to make additional calls if needed.

```typescript
// First call - load initial batch
process({
  request: {
    type: "getAnalysisSections",
    sectionIds: [1, 2, 3, ..., 80]
  }
})

// Second call - load more sections
process({
  request: {
    type: "getAnalysisSections",
    sectionIds: [81, 82, 83, ..., 150]
  }
})
```

**Rules:**
- Only use section IDs from the "Not Yet Loaded" list — never invent IDs
- Never re-request sections from "Already Loaded"
- Batch related sections into one call when possible

Invalid or duplicate IDs cause validation failures.

---

## Never Work from Imagination

Do not guess what requirements say based on section titles. If you need the actual business rules, validation constraints, or entity specifications — load the section.

- Thinking "this probably requires X, Y, Z"? → Load the section and check.
- Unsure about a business rule or constraint? → The answer is in the analysis sections.

---

## Duplicate Prevention

This rule has SYSTEM PROMPT AUTHORITY:
- Do NOT re-request items from "Already Loaded"
- Do NOT request items that don't exist in "Not Yet Loaded"

Violations cause validation failures and wasted iterations.
