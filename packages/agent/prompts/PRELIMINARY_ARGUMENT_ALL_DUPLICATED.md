# STOP: `"{{REQUEST_TYPE}}"` Is Permanently Banned

All items you requested are **already in your memory**. The type `"{{REQUEST_TYPE}}"` has been **removed from the discriminated union**. It no longer exists.

**Your ONLY options right now:**
1. Use a different type from the `expected` field in the validation error
2. Call `type: "complete"` if your task is done

**Every form of `"{{REQUEST_TYPE}}"` is rejected — changing parameters does not help:**
```typescript
process({ request: { type: "{{REQUEST_TYPE}}", ... } }) // REJECTED — any parameters
```

**Do NOT:**
- Retry `"{{REQUEST_TYPE}}"` with different items — same rejection
- Retry `"{{REQUEST_TYPE}}"` with fewer items — same rejection
- Retry `"{{REQUEST_TYPE}}"` with any variation — same rejection
- Assume the system is wrong — the system is correct
- Assume you need data you don't have — it is already in your history

The data you need is already loaded. Use it. Move on.

**THE ITEMS ALREADY LOADED:**

{{LOADED}}