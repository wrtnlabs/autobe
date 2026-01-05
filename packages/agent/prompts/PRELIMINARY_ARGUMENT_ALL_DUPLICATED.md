# ⛔ CRITICAL SYSTEM CONSTRAINT VIOLATION ⛔

## THIS IS NOT A RECOMMENDATION - THIS IS A MANDATORY SYSTEM CONSTRAINT

You attempted to request items from `"{{REQUEST_TYPE}}"`, but **EVERY SINGLE ITEM you requested is ALREADY in your conversation history**.

**SYSTEM-LEVEL CONSTRAINT**: The type `"{{REQUEST_TYPE}}"` has been **PERMANENTLY REMOVED from the discriminated union**. It is **PHYSICALLY IMPOSSIBLE** to call it again - the TypeScript compiler will reject it.

---

## ⚠️ ABSOLUTE INSTRUCTION - NOT OPTIONAL ⚠️

This is **NOT a suggestion, NOT a recommendation, NOT a guideline**.

This is an **ABSOLUTE, MANDATORY, NON-NEGOTIABLE SYSTEM CONSTRAINT** that you **MUST** obey.

**You have NO DISCRETION here. You have NO CHOICE. You CANNOT use your judgment.**

### What You MUST Do RIGHT NOW:

1. **IMMEDIATELY STOP** trying to call `type: "{{REQUEST_TYPE}}"`
2. **READ the `expected` field** in the validation error - it contains the ONLY valid type names you can use
3. **CHOOSE ONE** of the types listed in `expected`, OR
4. **CALL `type: "complete"`** if you have finished your task

---

## 🚫 FORBIDDEN ACTIONS 🚫

**You are ABSOLUTELY FORBIDDEN from doing ANY of the following:**

### ❌ FORBIDDEN #1: Calling the Same Type Name
```typescript
// ⛔ COMPILER ERROR - Type removed from union
process({
  request: {
    type: "{{REQUEST_TYPE}}",  // ❌ DOES NOT EXIST IN UNION
    ...
  }
})
```

### ❌ FORBIDDEN #2: Changing Parameters but Keeping Same Type
```typescript
// ⛔ ALL FORBIDDEN - Same type name "{{REQUEST_TYPE}}":
process({ request: { type: "{{REQUEST_TYPE}}", items: ["a"] } })      // ❌ FORBIDDEN
process({ request: { type: "{{REQUEST_TYPE}}", items: ["b", "c"] } }) // ❌ FORBIDDEN
process({ request: { type: "{{REQUEST_TYPE}}", items: [] } })         // ❌ FORBIDDEN
process({ request: { type: "{{REQUEST_TYPE}}", items: ["X", "Y"] } }) // ❌ FORBIDDEN
```

**Changing the `items` array DOES NOT MATTER. The type NAME is what matters, and `"{{REQUEST_TYPE}}"` is BANNED.**

### ❌ FORBIDDEN #3: Thinking You Know Better
```
"But I really need those items..."           ❌ NO - They're already in your history
"But I want to request them differently..."  ❌ NO - Type is removed from union
"But maybe if I try one more time..."        ❌ NO - System constraint, not a suggestion
"But I think the system made a mistake..."   ❌ NO - The system is correct, you must adapt
```

---

## ✅ CORRECT BEHAVIOR - DO THIS

```typescript
// ✅ CORRECT - Use a type name from the 'expected' field
process({
  request: {
    type: "different-type-from-expected-field",  // ✅ Valid type from union
    ...
  }
})

// ✅ CORRECT - Mark task complete if done
process({
  request: {
    type: "complete"  // ✅ Finish the task
  }
})
```

---

## 🔒 WHY THIS IS NON-NEGOTIABLE

This is not about your judgment or decision-making. This is a **type system constraint**.

### TypeScript Discriminated Union Mechanics:

When you successfully request items from `"{{REQUEST_TYPE}}"`, those items are added to your local history. The system **removes that type from the union** to prevent duplicate requests.

**This is enforced at the TYPE LEVEL:**

```typescript
// Before your request:
type AvailableTypes = "{{REQUEST_TYPE}}" | "other-type" | "another-type"

// After your request (items now in history):
type AvailableTypes = "other-type" | "another-type"  // ← "{{REQUEST_TYPE}}" REMOVED
```

The type `"{{REQUEST_TYPE}}"` **NO LONGER EXISTS in the union**. It is **COMPILE-TIME INVALID**.

**You cannot argue with the type system. You cannot negotiate with the compiler.**

---

## 📋 MANDATORY ACTION CHECKLIST

You **MUST** complete these steps **IMMEDIATELY**:

- [ ] **STOP** attempting to call `type: "{{REQUEST_TYPE}}"`
- [ ] **READ** the `expected` field in the validation error
- [ ] **VERIFY** that `"{{REQUEST_TYPE}}"` is NOT in the `expected` field
- [ ] **UNDERSTAND** that the items you need are ALREADY in your conversation history
- [ ] **CHOOSE** one of the following:
  - **Option A**: Call a **different type** from the `expected` field
  - **Option B**: Call `type: "complete"` to finish your task
- [ ] **NEVER AGAIN** attempt to call `type: "{{REQUEST_TYPE}}"` in this session

---

## 🎯 FINAL WARNING

**If you attempt to call `type: "{{REQUEST_TYPE}}"` again:**

1. ❌ The TypeScript compiler will **REJECT** your request (type error)
2. ❌ The validation will **FAIL** (discriminated union violation)
3. ❌ Your function call will be **INVALID** (schema mismatch)
4. ❌ You will receive this **EXACT SAME ERROR** again
5. ❌ You will have **WASTED** tokens, time, and compute resources
6. ❌ The system will **NOT MAGICALLY CHANGE** - the constraint remains

---

## 📝 SUMMARY - READ THIS IF NOTHING ELSE

| Question | Answer |
|----------|--------|
| Can I call `"{{REQUEST_TYPE}}"` again? | **NO** - Removed from union |
| What if I change the parameters? | **NO** - Type name matters, not parameters |
| What if I really need it? | **Items are already in your history** - use them |
| What should I do instead? | **Check `expected` field** → use different type OR call `"complete"` |
| Is this negotiable? | **NO** - System constraint, not a suggestion |
| Can I use my judgment here? | **NO** - You must obey the type system |

---

**This is your ONLY warning. Act accordingly.**
