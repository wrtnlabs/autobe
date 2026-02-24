# Phase 3: Test Loop Flow

Iterate until all tests pass (100% success rate).

---

## Loop Algorithm

```
iteration = 0
max_iterations = 10

WHILE iteration < max_iterations:
    iteration += 1

    # Step 1: Build
    result = run("npm run build:test")
    IF result.failed:
        analyze_build_error(result)
        fix_build_error()
        CONTINUE

    # Step 2: Run Tests
    result = run("npm run test -- --include '{feature}'")

    IF result.all_passed:
        PRINT "✅ All tests passed!"
        BREAK

    # Step 3: Analyze Failures
    failures = parse_failures(result)

    FOR each failure in failures:
        cause = diagnose(failure)

        IF cause.is_test_code_issue:
            fix_test_code(failure)
        ELSE IF cause.is_business_logic_issue:
            fix_business_logic(failure)
        ELSE:
            PRINT "⚠️ Manual intervention required"
            BREAK

IF iteration >= max_iterations:
    PRINT "❌ Max iterations reached. Manual intervention required."
```

---

## Step 3.1: Run Build

```bash
npm run build:test 2>&1
```

If build fails:
- Parse error message
- Identify affected file
- Fix syntax/type errors
- Re-run build

---

## Step 3.2: Run Tests

```bash
npm run test 2>&1
```

Or for specific feature:
```bash
npm run test -- --include "{feature_name}"
```

---

## Step 3.3: Analyze Failures

### Failure Types

| Symptom | Likely Cause | Fix Location |
|---------|--------------|--------------|
| `Expected 200, got 400` | Invalid test input | Test code |
| `Expected 200, got 404` | Entity not created | Test setup |
| `Expected 200, got 500` | Provider bug | Provider code |
| `Property mismatch` | Transformer bug | Transformer code |
| `Unauthorized` | Missing auth | Test setup |
| `Type error` | Interface mismatch | Interface/Provider |

### Diagnosis Process

1. **Read error message carefully**
   - What was expected?
   - What was received?
   - Which assertion failed?

2. **Check test code**
   - Is the test setup correct?
   - Are inputs valid?
   - Is the auth token present?

3. **Check business logic**
   - Is the provider logic correct?
   - Is the transformer mapping correct?
   - Is the collector generating correct data?

4. **Check interface**
   - Do types match?
   - Are required fields present?
   - Are typia tags correct?

---

## Step 3.4: Fix Strategies

### Test Code Issues

```typescript
// Issue: Test expects wrong status code
// Before
await TestValidator.httpError("not found", 400, async () => { ... });
// After
await TestValidator.httpError("not found", 404, async () => { ... });

// Issue: Missing auth setup
// Before
const result = await api.functional.{prefix}.admin.{entities}.create(
  connection,  // No auth!
  input,
);
// After
const admin = await authorize_admin(connection);
const result = await api.functional.{prefix}.admin.{entities}.create(
  admin.connection,  // With auth
  input,
);

// Issue: Wrong assertion
// Before
TestValidator.equals("name", result.name, "hardcoded");
// After
TestValidator.equals("name", result.name, input.name);
```

### Business Logic Issues

```typescript
// Issue: Missing null check
// Before
return {Prefix}{Entity}Transformer.transform(record);
// After
if (!record) throw new HttpException("Not found", 404);
return {Prefix}{Entity}Transformer.transform(record);

// Issue: Wrong status code
// Before
throw new HttpException("Not found", 400);
// After
throw new HttpException("Not found", 404);

// Issue: Missing validation
// Before
const data = Collector.collect({ body: props.body });
// After
if (!props.body.name) {
  throw new HttpException("Name is required", 400);
}
const data = Collector.collect({ body: props.body });
```

### Interface Issues

```typescript
// Issue: Missing nullable annotation
// Before
description: string;
// After
description: string | null;

// Issue: Missing typia tag
// Before
id: string;
// After
id: string & tags.Format<"uuid">;
```

---

## Step 3.5: Verify Fix

After each fix:

```bash
# Quick check - just the failing test
npm run test -- --include "{specific_test_name}"

# Full check - all feature tests
npm run test -- --include "{feature_name}"
```

---

## Step 3.6: Exit Conditions

### Success ✅
```
All tests passed!
- Total: X tests
- Passed: X
- Failed: 0
- Pass rate: 100%
```

### Failure ❌ (Requires Manual Intervention)
- Max iterations (10) reached
- Circular dependency detected
- External service required
- Database migration needed
- Requirements unclear

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Tests timing out | Increase timeout or optimize queries |
| Flaky tests | Add retry logic or fix race condition |
| Database state | Ensure test isolation, clean up after tests |
| Auth token expired | Refresh token in test setup |
| Port conflict | Use unique ports or wait for cleanup |

### Debug Commands

```bash
# Run single test with verbose output
npm run test -- --include "test_name" --verbose

# Check test logs
cat test/logs/*.log
```
