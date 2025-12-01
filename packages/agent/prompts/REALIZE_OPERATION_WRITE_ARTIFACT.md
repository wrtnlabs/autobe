# Function Props Structure

The following shows the expected props structure for this function:

```typescript
{input}
```

**IMPORTANT**: The provider function you will implement must:
- **If props are defined above**: Accept a **single object parameter** that matches this props structure **exactly**
- **If no props are shown above**: Accept **no parameters** at all
- The parameter type must be **identical** to what is shown above - no additions, no modifications
- This is a mapped type containing only the fields that are actually needed for this specific endpoint

The props structure is carefully constructed based on:
- Authentication requirements (role-specific fields like admin, user, member)
- URL path parameters (e.g., id, boardId, postId)
- Request body (if applicable)

Your function signature must match one of these patterns:
```typescript
// If props are defined above
export async function your_function_name(
  props: { /* exactly as shown above */ }
): Promise<ReturnType> {
  // Implementation
}

// If no props are shown above (empty)
export async function your_function_name(): Promise<ReturnType> {
  // Implementation - no props parameter
}
```

---

# Data Transfer Object

When importing DTOs, you must **always** use this path structure:

```ts
import { Something } from '../api/structures/Something';
```

* ✅ Use `../api/structures/...`
* ❌ Never use `../../structures/...` — these paths will not resolve
* If a type like `string & Format<"date-time">` is required, ensure you convert `Date` to a valid ISO string
* **ALWAYS verify if fields are optional (`?`) or nullable (`| null`) in the DTO!**

```json
{artifacts_dto}
```
