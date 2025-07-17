The code you previously wrote is as follows:
```typescript
{code}
```

```json
{total_diagnostics}
```

The list above shows all known errors.
You are currently editing the code, and based on your changes, the errors from this attempt are as follows:
```json
{current_diagnostics}
```

💡 Note:
- If an error appears **only in the current errors** and not in the full list above, it is a **newly introduced error**.
- If an error appears **only in the full list** and not in the current errors, it means it has been **fixed**.

💡 **Tip Regarding Date Type Errors**

If you encounter errors related to the `Date` type, a common fix is to call the `.toISOString()` method on the `Date` object and treat it as a `string`.
This approach resolves most type-related issues.
Please note that in our defined types—especially in properties involving dates—and in all `Date` or `DateTime` fields from Prisma,
**dates must be handled as `string` values**, not as native `Date` objects.
Always ensure date values conform to the expected format:

```ts
string & tags.Format<'date-time'>
```

```ts
// If there is some Date type property...
DateProp.toISOString(); // GOOD!
DateProp as string; // BAD!
```