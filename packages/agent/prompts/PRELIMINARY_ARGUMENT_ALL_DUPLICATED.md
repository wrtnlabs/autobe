# Critical: All Requested Items Already Loaded

## System Constraint Violation

You attempted to request items from `"{{REQUEST_TYPE}}"`, but **EVERY SINGLE ITEM you requested is ALREADY in your conversation history**.

**System-Level Constraint:** The type `"{{REQUEST_TYPE}}"` has been **PERMANENTLY REMOVED from the discriminated union**. It is **PHYSICALLY IMPOSSIBLE** to call it again—the TypeScript compiler will reject it.

---

## This Is Not Optional

This is an **ABSOLUTE, MANDATORY, NON-NEGOTIABLE SYSTEM CONSTRAINT**.

You have NO discretion here. You have NO choice. You CANNOT use your judgment.

### What You MUST Do Right Now:

1. **IMMEDIATELY STOP** trying to call `type: "{{REQUEST_TYPE}}"`
2. **READ the `expected` field** in the validation error—it contains the ONLY valid type names you can use
3. **CHOOSE ONE** of the types listed in `expected`, OR
4. **CALL `type: "complete"`** if you have finished your task

---

## Forbidden Actions

### ❌ Calling the Same Type Name
```typescript
// ⛔ COMPILER ERROR - Type removed from union
process({
  request: {
    type: "{{REQUEST_TYPE}}",  // ❌ DOES NOT EXIST IN UNION
    ...
  }
})
```

### ❌ Changing Parameters but Keeping Same Type
```typescript
// ⛔ ALL FORBIDDEN - Same type name "{{REQUEST_TYPE}}":
process({ request: { type: "{{REQUEST_TYPE}}", items: ["a"] } })      // ❌
process({ request: { type: "{{REQUEST_TYPE}}", items: ["b", "c"] } }) // ❌
process({ request: { type: "{{REQUEST_TYPE}}", items: ["X", "Y"] } }) // ❌
```

**Changing the `items` array DOES NOT MATTER.** The type NAME is what matters, and `"{{REQUEST_TYPE}}"` is BANNED.

### ❌ Thinking You Know Better
- "But I really need those items..." → NO, they're already in your history
- "But I want to request them differently..." → NO, type is removed from union
- "But maybe if I try one more time..." → NO, system constraint, not a suggestion
- "But I think the system made a mistake..." → NO, the system is correct

---

## Correct Actions
```typescript
// ✅ Correct - Use a type name from the 'expected' field
process({
  request: {
    type: "different-type-from-expected-field",
    ...
  }
})

// ✅ Correct - Mark task complete if done
process({
  request: {
    type: "complete"
  }
})
```

---

## Why This Is Non-Negotiable

This is a TypeScript discriminated union constraint enforced at the TYPE LEVEL:
```typescript
// Before your request:
type AvailableTypes = "{{REQUEST_TYPE}}" | "other-type" | "another-type"

// After your request (items now in history):
type AvailableTypes = "other-type" | "another-type"  // ← "{{REQUEST_TYPE}}" REMOVED
```

The type `"{{REQUEST_TYPE}}"` **NO LONGER EXISTS in the union**. It is **COMPILE-TIME INVALID**.

You cannot argue with the type system. You cannot negotiate with the compiler.

---

## If You Attempt to Call This Type Again

1. ❌ The TypeScript compiler will **REJECT** your request
2. ❌ The validation will **FAIL**
3. ❌ You will receive this **EXACT SAME ERROR** again
4. ❌ You will have **WASTED** tokens, time, and compute resources
5. ❌ The system will **NOT CHANGE**—the constraint remains

---

## Summary

| Question | Answer |
|----------|--------|
| Can I call `"{{REQUEST_TYPE}}"` again? | **NO** - Removed from union |
| What if I change the parameters? | **NO** - Type name matters, not parameters |
| What if I really need it? | **Items are already in your history** - use them |
| What should I do instead? | **Check `expected` field** → use different type OR call `"complete"` |
| Is this negotiable? | **NO** - System constraint, not a suggestion |

**This is your ONLY warning. Act accordingly.**