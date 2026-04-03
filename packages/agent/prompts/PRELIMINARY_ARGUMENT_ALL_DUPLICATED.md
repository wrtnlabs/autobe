# All Requested Items Already Loaded

Every item you requested via `"{{REQUEST_TYPE}}"` is **already in your memory**. You already have this data — requesting it again does nothing.

## Already loaded (do NOT re-request these):

{{OLDBIE}}

## Not yet loaded:

{{NEWBIE}}

## What to do now:

1. If there are items in "Not yet loaded" above, request ONLY those items via `"{{REQUEST_TYPE}}"`
2. If "Not yet loaded" is empty, use a **different type** from the `expected` field
3. If you have all the data you need, call `{ type: "complete" }` immediately
