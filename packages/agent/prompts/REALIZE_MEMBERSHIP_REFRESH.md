# Authorization Type: Refresh Token

This is a **refresh** token operation for renewing expired access tokens.

## Implementation Guidelines for Refresh

### Refresh Token Operation Requirements
- This endpoint refreshes expired access tokens
- Must validate the refresh token first
- Should check if refresh token is not expired or revoked
- Must generate a new access token with THE SAME payload structure
- May also rotate the refresh token for security
- Should handle invalid/expired refresh tokens gracefully
- Typically requires the refresh token in request body or headers
- Must NOT require standard authentication (uses refresh token instead)

## Session Management Architecture

### Conceptual Foundation: Session Continuity and Security

The refresh token operation maintains **session continuity** while enhancing security through token rotation. This architectural pattern provides:

1. **Uninterrupted access**: Users remain authenticated without re-entering credentials
2. **Token rotation**: Minimizes risk by regularly replacing tokens
3. **Session validation**: Verifies the session is still valid and not revoked
4. **Attack detection**: Identifies potential token theft through session tracking

### Implementation Requirements for Refresh Operation

When implementing a refresh token operation, you MUST follow this validation and regeneration process:

#### Phase 1: Verify Refresh Token and Session
First, decode and verify the refresh token, then validate the associated session:

```typescript
// Example: Verify refresh token
const decoded = jwt.verify(
  props.body.refreshToken,
  MyGlobal.env.JWT_SECRET_KEY,
  { issuer: 'autobe' }
) as {
  id: string;
  session_id: string;
  type: "seller";
};

// Validate the session still exists and is active
const session = await MyGlobal.prisma.shopping_seller_sessions.findFirst({
  where: {
    id: decoded.session_id,
    shopping_seller_id: decoded.id,
  },
  ...ShoppingSellerSessionTransformer.select(),
});
if (!session) {
  throw new HttpException("Session expired or revoked", 401);
}

// Validate actor is still active
const seller = await MyGlobal.prisma.shopping_sellers.findUniqueOrThrow({
  where: { id: decoded.id },
  ...ShoppingSellerTransformer.select(),
});
if (seller.deleted_at !== null) {
  throw new HttpException("Account has been deleted", 403);
}
```

**Alternative: Without Transformer (Manual Query)**

If transformers are not available, query the session and actor directly without using `.select()`:

```typescript
// Validate the session still exists and is active (without transformer)
const session = await MyGlobal.prisma.shopping_seller_sessions.findFirst({
  where: {
    id: decoded.session_id,
    shopping_seller_id: decoded.id,
  },
});
if (!session) {
  throw new HttpException("Session expired or revoked", 401);
}

// Validate actor is still active (without transformer)
const seller = await MyGlobal.prisma.shopping_sellers.findUniqueOrThrow({
  where: { id: decoded.id },
});
if (seller.deleted_at !== null) {
  throw new HttpException("Account has been deleted", 403);
}
```

#### Phase 2: Generate New Tokens (Same Session)
After validation, generate NEW tokens using the **SAME session ID**:

```typescript
// Example: Generate new tokens maintaining the same session
const accessExpires: Date = new Date(Date.now() + 60 * 60 * 1000);
const refreshExpires: Date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
const token = {
  access: jwt.sign(
    {
      type: decoded.type,
      id: decoded.id,
      session_id: decoded.session_id,  // SAME session ID
      created_at: new Date().toISOString(),
    },
    MyGlobal.env.JWT_SECRET_KEY,
    {
      expiresIn: '1h',
      issuer: 'autobe'
    }
  ),
  refresh: jwt.sign(
    {
      type: decoded.type,
      id: decoded.id,
      session_id: decoded.session_id,  // SAME session ID
      tokenType: 'refresh',
      created_at: new Date().toISOString(),
    },
    MyGlobal.env.JWT_SECRET_KEY,
    {
      expiresIn: '7d',
      issuer: 'autobe'
    }
  ),
  expired_at: toISOStringSafe(accessExpires),
  refreshable_until: toISOStringSafe(refreshExpires),
};
```

#### Phase 3: Update Session Expiration
After generating new tokens, update the session's `expired_at` timestamp:

```typescript
// Update session expiration time
await MyGlobal.prisma.shopping_seller_sessions.update({
  where: {
    id: decoded.session_id,
  },
  data: {
    expired_at: refreshExpires,  // Update to new refresh token expiration
  },
});
```

**CRITICAL**: The refresh operation does NOT create a new session. It reuses the existing `session_id` from the decoded token. However, the session's `expired_at` field MUST be updated to reflect the new refresh token expiration time.

### Database Schema Pattern

Refresh operations interact with session and actor tables:

1. **Session Table** (e.g., `shopping_seller_sessions`): Validates session is active
   - Primary key: `id` (UUID) - This ID is maintained across token refreshes
   - Foreign key: `shopping_seller_id` (references actor)
   - Represents: "The ongoing authentication session"

2. **Actor Table** (e.g., `shopping_sellers`): Validates actor is still active
   - Primary key: `id` (UUID)
   - Contains: email, password_hash, profile information
   - Represents: "Who the user is"

Refer to **REALIZE_AUTHORIZATION.md** for detailed session architecture and relationship patterns.

## CRITICAL: Refresh Token Implementation

### Conceptual Foundation: Token Payload Structure

The JWT token payload serves as a **cryptographically signed credential** that identifies both the actor and their specific authentication session. During refresh operations:

1. **Session continuity**: The `session_id` remains unchanged across refreshes
2. **Actor identification**: The `id` field continues to identify the same user
3. **Token rotation**: New cryptographic signatures are generated
4. **Timestamp update**: The `created_at` field reflects the refresh time

### Token Payload Structure

**IMPORTANT**: When refreshing tokens, you MUST:
1. Decode and verify the refresh token
2. Extract the user information from the decoded token
3. Generate a new access token with THE SAME payload structure as the original

**CRITICAL**: Use the predefined payload structures for consistency:

```json
{{PAYLOAD}}
```

```typescript
interface IJwtSignIn {
  type: string;        // Actor type name (e.g., "seller", "user", "admin")
  id: string & tags.Format<"uuid">;         // Actor's primary ID
  session_id: string & tags.Format<"uuid">; // Session's primary ID (UNCHANGED)
  created_at: string & tags.Format<"date-time">; // Token creation timestamp (UPDATED)
}
```

### Implementation Example

```typescript
// JWT is already imported: import jwt from "jsonwebtoken";

// Step 1: Verify and decode the refresh token
const decoded = jwt.verify(
  props.body.refreshToken,
  MyGlobal.env.JWT_SECRET_KEY,
  { issuer: 'autobe' }
) as {
  id: string;
  session_id: string;
  type: "seller";
};

// Step 2: Validate session and get actor data
const session = await MyGlobal.prisma.shopping_seller_sessions.findFirst({
  where: {
    id: decoded.session_id,
    shopping_seller_id: decoded.id,
  },
  ...ShoppingSellerSessionTransformer.select(),
});
if (!session) {
  throw new HttpException("Session expired or revoked", 401);
}

const seller = await MyGlobal.prisma.shopping_sellers.findUniqueOrThrow({
  where: { id: decoded.id },
  ...ShoppingSellerTransformer.select(),
});
if (seller.deleted_at !== null) {
  throw new HttpException("Account has been deleted", 403);
}

// Step 3: Generate new access token with SAME session_id
// DO NOT use type annotations like: const payload: IJwtSignIn = {...}
// Just create the payload object directly in jwt.sign()
const accessExpires: Date = new Date(Date.now() + 60 * 60 * 1000);
const refreshExpires: Date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
const access = {
  access: jwt.sign(
    {
      type: decoded.type,
      id: decoded.id,
      session_id: decoded.session_id,  // CRITICAL: Reuse same session_id
      created_at: new Date().toISOString(),
    },
    MyGlobal.env.JWT_SECRET_KEY,
    {
      expiresIn: '1h',
      issuer: 'autobe'
    }
  ),
  refresh: jwt.sign(
    {
      type: decoded.type,
      id: decoded.id,
      session_id: decoded.session_id,  // CRITICAL: Reuse same session_id
      tokenType: 'refresh',
      created_at: new Date().toISOString(),
    },
    MyGlobal.env.JWT_SECRET_KEY,
    {
      expiresIn: '7d',
      issuer: 'autobe'
    }
  ),
  expired_at: toISOStringSafe(accessExpires),
  refreshable_until: toISOStringSafe(refreshExpires),
};

// Step 4: Update session expiration time
await MyGlobal.prisma.shopping_seller_sessions.update({
  where: {
    id: decoded.session_id,
  },
  data: {
    expired_at: refreshExpires,
  },
});
```

### Critical Rules for Token Refresh

1. **Session Preservation**: The `session_id` MUST remain the same as in the original token
2. **Payload Structure**: Use the exact structure - `type`, `id`, `session_id`, `created_at`
3. **Actor ID**: The `id` field MUST match the original token's actor ID
4. **Type Consistency**: The `type` field MUST match the original token's type
5. **No Type Annotations**: Do NOT use TypeScript type annotations in the payload object
6. **Issuer**: MUST use 'autobe' as the issuer for all tokens

**DO NOT**:
- Generate new access tokens with different payload structures
- Use random IDs like v4() in the payload
- Create tokens without verifying the refresh token first
- Use type annotations like: const payload: UserPayload = {...}
- Create a NEW session (this is NOT a login operation)
- Change the `session_id` value (this breaks session continuity)

## Complete Refresh Flow Example

```typescript
// Complete example for shopping_sellers token refresh
export async function postAuthSellerRefresh(props: {
  body: IShoppingSeller.IRefresh
}): Promise<IShoppingSeller.IRefreshOutput> {
  // 1. Verify and decode refresh token
  let decoded: {
    id: string;
    session_id: string;
    type: "seller";
  };
  try {
    decoded = jwt.verify(
      props.body.refreshToken,
      MyGlobal.env.JWT_SECRET_KEY,
      { issuer: 'autobe' }
    ) as {
      id: string;
      session_id: string;
      type: "seller";
    };
  } catch (error) {
    throw new UnauthorizedException("Invalid or expired refresh token");
  }

  // 2. Validate type matches expected actor type
  if (decoded.type !== "seller") {
    throw new ForbiddenException("Invalid token type");
  }

  // 3. Validate session exists and is active
  const session = await MyGlobal.prisma.shopping_seller_sessions.findFirst({
    where: {
      id: decoded.session_id,
      shopping_seller_id: decoded.id,
    },
    ...ShoppingSellerSessionTransformer.select(),
  });
  if (!session) {
    throw new HttpException("Session expired or revoked", 401);
  }

  // 4. Validate actor is still active
  const seller = await MyGlobal.prisma.shopping_sellers.findUniqueOrThrow({
    where: { id: decoded.id },
    ...ShoppingSellerTransformer.select(),
  });
  if (seller.deleted_at !== null) {
    throw new HttpException("Account has been deleted", 403);
  }

  // 5. Generate new access token (SAME session_id)
  const accessExpires: Date = new Date(Date.now() + 60 * 60 * 1000);
  const refreshExpires: Date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const token = {
    access: jwt.sign(
      {
        type: decoded.type,
        id: decoded.id,
        session_id: decoded.session_id,  // Reuse existing session
        created_at: new Date().toISOString(),
      },
      MyGlobal.env.JWT_SECRET_KEY,
      {
        expiresIn: '1h',
        issuer: 'autobe'
      }
    ),
    refresh: jwt.sign(
      {
        type: decoded.type,
        id: decoded.id,
        session_id: decoded.session_id,  // Reuse existing session
        tokenType: 'refresh',
        created_at: new Date().toISOString(),
      },
      MyGlobal.env.JWT_SECRET_KEY,
      {
        expiresIn: '7d',
        issuer: 'autobe'
      }
    ),
    expired_at: toISOStringSafe(accessExpires),
    refreshable_until: toISOStringSafe(refreshExpires),
  };

  // 6. Update session expiration time
  await MyGlobal.prisma.shopping_seller_sessions.update({
    where: {
      id: decoded.session_id,
    },
    data: {
      expired_at: refreshExpires,
    },
  });

  // 7. Return new tokens
  return {
    accessToken: token.access,
    refreshToken: token.refresh,
  };
}
```

**IMPORTANT**: The new access token MUST have the same payload structure as the original token from login/join operations, with the SAME `session_id` value to maintain session continuity.
