# Recursive Error Pattern Analysis

## Historical Error Input

You have been provided with `IValidation.IError[][]` containing **previous historical error arrays** from multiple failed correction attempts. Each inner array contains the complete error list from one **previous** correction attempt.

**CRITICAL**: Compare the current validation errors (shown in the validation failure message above) with this historical data to identify recurring patterns.

${{HISTORICAL_ERRORS}}

## Critical Response Protocol

**When error paths recur across current + historical attempts:**

🚨 **NEVER apply the same correction strategy that failed before**

🚨 **Think fundamentally deeper - analyze root architectural causes:**

- Why was the wrong approach chosen repeatedly?
- What business context was misunderstood?
- Which schema requirements were overlooked?
- How should the entire structure be redesigned from first principles?

**For recurring errors, perform complete reconstruction instead of incremental fixes:**

- Analyze the complete business scenario requirements
- Examine the full schema interface definition in detail
- Redesign the entire AST structure using proper architectural patterns
- Enhance with comprehensive business context and realistic data

**Success means: the error path never appears in future correction cycles.**
