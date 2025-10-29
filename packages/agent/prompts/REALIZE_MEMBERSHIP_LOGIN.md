# Authorization Type: Login

This is a **login** operation that authenticates users.

## Implementation Guidelines for Login

### Login Operation Requirements
- This is a login endpoint that authenticates users
- Must validate credentials (username/email and password)
- Must verify password using PasswordUtil
- Must create a new session record for this login
- Must generate JWT tokens with correct payload structure
- Should return authentication tokens (access and refresh tokens)
- May include additional business logic as required by the API specification (e.g., updating last login timestamp, creating audit logs, checking account status)
- Must NOT require authentication decorator (this endpoint creates authentication)

**IMPORTANT**: While the core requirements (credential validation, session creation, JWT generation) are mandatory, you should implement any additional business logic specified in the API requirements. The examples below show the mandatory flow, but your implementation may include additional steps before, between, or after these core operations.

## Session Management Architecture

### Conceptual Foundation: Actor and Session Separation

In production authentication systems, we separate **Actor** (the persistent user identity) from **Session** (the temporary authentication state). This architectural pattern provides several critical benefits:

1. **Security**: Sessions can be independently revoked without deleting the user account
2. **Multi-device support**: One actor can maintain multiple concurrent sessions across different devices
3. **Audit trail**: Session records track when and where authentication occurred
4. **Token rotation**: Sessions enable secure refresh token rotation strategies

### Implementation Requirements for Login Operation

When implementing a login operation, you MUST include these core phases. Additional business logic may be inserted at any point as needed:

#### Phase 1: Validate Actor Credentials
First, verify the actor's credentials and retrieve the actor record. This is **mandatory**:

```typescript
// Example: Validating seller credentials
const seller = await MyGlobal.prisma.shopping_sellers.findFirst({
  where: { email: props.body.email }
});
if (!seller) {
  throw new HttpException("Invalid credentials", 401);
}

// Verify password using PasswordUtil
const isValid = await PasswordUtil.verify(
  props.body.password,        // plain password from request
  seller.password_hash  // hashed password from database
);
if (!isValid) {
  throw new HttpException("Invalid credentials", 401);
}
```

#### Phase 2: Create Session Record
After successful authentication, create a NEW session record for this login. This is **mandatory**:

```typescript
// Example: Creating a new session for the authenticated seller
const accessExpires: Date = new Date(Date.now() + 60 * 60 * 1000);
const refreshExpires: Date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
const session = await MyGlobal.prisma.shopping_seller_sessions.create({
  data: {
    id: v4(),
    shopping_seller_id: seller.id,  // Foreign key to actor
    ip: props.body.ip ?? props.ip,  // IP is optional - use client-provided (SSR case) or server-extracted
    href: props.body.href,
    referrer: props.body.referrer,
    created_at: new Date().toISOString(),
    expired_at: toISOStringSafe(accessExpires),
  }
});
```

**CRITICAL**: Each login creates a NEW session. Both the actor ID and session ID will be embedded in the JWT token payload (see JWT Token Generation section below).

#### Additional Business Logic (Optional)
Between or after the mandatory phases above, you may implement additional business logic as specified in the API requirements. Examples include:
- Updating last login timestamp on the actor record
- Creating audit logs or login history records
- Checking account status (e.g., banned, suspended, email verified)
- Enforcing rate limiting or login attempt tracking
- Invalidating old sessions if needed (e.g., single device policy)
- Sending login notification emails or SMS
- Tracking login analytics or metrics
- Any other domain-specific operations required by the business

**The key principle**: The mandatory phases (credential validation, session creation, JWT generation) must always be present, but you have complete flexibility to add necessary business logic around them.

### Database Schema Pattern

Login operations interact with two related tables:

1. **Actor Table** (e.g., `shopping_sellers`): Stores persistent user identity
   - Primary key: `id` (UUID)
   - Contains: email, password_hash, profile information
   - Represents: "Who the user is"

2. **Session Table** (e.g., `shopping_seller_sessions`): Stores authentication sessions
   - Primary key: `id` (UUID)
   - Foreign key: `shopping_seller_id` (references actor)
   - Represents: "An active authentication instance for this user"

Refer to **REALIZE_AUTHORIZATION.md** for detailed session architecture and relationship patterns.

## MANDATORY: Use PasswordUtil for Password Verification

**CRITICAL**: You MUST use PasswordUtil utilities for password verification to ensure consistency with the join operation:

```typescript
// Example: Password verification in login
const isValid = await PasswordUtil.verify(
  props.body.password,           // plain password from request
  user.password_hash       // hashed password from database
);
if (!isValid) {
  throw new HttpException("Invalid credentials", 401);
}
```

## JWT Token Generation

### Conceptual Foundation: Token Payload Structure

The JWT token payload serves as a **cryptographically signed credential** that identifies both the actor and their specific authentication session. This dual identification enables:

1. **Actor identification**: `id` field identifies which user is authenticated
2. **Session identification**: `session_id` field identifies which authentication instance is active
3. **Role-based access**: `type` field enables discriminated union patterns for authorization

### Token Payload Structure

**CRITICAL**: Use the predefined payload structures for consistency:

```json
${PAYLOAD}
```

**NOTE**: The jsonwebtoken library is automatically imported as jwt. Use it to generate tokens with the EXACT payload structure:

```typescript
interface IJwtSignIn {
  type: string;        // Actor type name (e.g., "seller", "user", "admin")
  id: string & tags.Format<"uuid">;         // Actor's primary ID
  session_id: string & tags.Format<"uuid">; // Session's primary ID
  created_at: string & tags.Format<"date-time">; // Token creation timestamp
}
```

### Implementation Example

```typescript
// JWT is already imported: import jwt from "jsonwebtoken";

// After validating credentials and creating a NEW session:
// Phase 1: Validate actor
const seller = await MyGlobal.prisma.shopping_sellers.findFirst({
  where: { email: props.body.email }
});
const isValid = await PasswordUtil.verify(props.body.password, seller.password_hash);
if (!isValid) {
  throw new HttpException("Invalid credentials", 401);
}

// Phase 2: Create NEW session
const accessExpires: Date = new Date(Date.now() + 60 * 60 * 1000);
const refreshExpires: Date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
const session = await MyGlobal.prisma.shopping_seller_sessions.create({
  data: {
    id: v4(),
    shopping_seller_id: seller.id,
    ip: props.body.ip ?? props.ip,
    href: props.body.href,
    referrer: props.body.referrer,
    created_at: new Date().toISOString(),
    expired_at: toISOStringSafe(accessExpires),
  }
});

// Phase 3: Generate JWT token with EXACT payload structure
// DO NOT use type annotations like: const payload: IJwtSignIn = {...}
// Just create the payload object directly in jwt.sign()
const token = {
  access: jwt.sign(
    {
      type: "seller",           // Actor type discriminator
      id: seller.id,            // Actor's ID (NOT session.id!)
      session_id: session.id,   // Session's ID
      created_at: new Date().toISOString(),
    },
    MyGlobal.env.JWT_SECRET_KEY,
    {
      expiresIn: "1h",
      issuer: "autobe",  // MUST use 'autobe' as issuer
    }
  ),
  refresh: jwt.sign(
    {
      type: "seller",
      id: seller.id,
      session_id: session.id,
      tokenType: "refresh",
      created_at: new Date().toISOString(),
    },
    MyGlobal.env.JWT_SECRET_KEY,
    {
      expiresIn: "7d",
      issuer: "autobe",  // MUST use 'autobe' as issuer
    },
  ),
  expired_at: toISOStringSafe(accessExpires),
  refreshable_until: toISOStringSafe(refreshExpires),
};
```

### Critical Rules for Token Generation

1. **Payload Structure**: Use the exact structure shown above - `type`, `id`, `session_id`, `created_at`
2. **Actor ID**: The `id` field MUST contain the actor's primary key (e.g., `seller.id`), NOT the session's ID
3. **Session ID**: The `session_id` field MUST contain the session's primary key (e.g., `session.id`)
4. **Type Discriminator**: The `type` field MUST match the actor type (e.g., "seller", "user", "admin")
5. **No Type Annotations**: Do NOT use TypeScript type annotations in the payload object passed to `jwt.sign()`
6. **Issuer**: MUST use 'autobe' as the issuer for all tokens

**DO NOT**:
- Implement your own password hashing logic
- Use bcrypt, argon2, or any other hashing library directly
- Try to hash and compare manually

## Token Decoding and Verification

```typescript
// Decode tokens if needed (e.g., for verification)
const decoded = jwt.verify(token, MyGlobal.env.JWT_SECRET_KEY, {
  issuer: 'autobe'  // Verify issuer is 'autobe'
});
```

## Complete Login Flow Examples

### Example 1: Basic Login (Minimal)

```typescript
// Minimal example showing only mandatory phases
export async function postAuthSellerLogin(props: {
  body: IShoppingSeller.ILogin
}): Promise<IShoppingSeller.ILoginOutput> {
  // 1. Find actor by credentials (MANDATORY)
  const seller = await MyGlobal.prisma.shopping_sellers.findFirst({
    where: { email: props.body.email }
  });
  if (!seller) {
    throw new HttpException("Invalid credentials", 401);
  }

  // 2. Verify password (MANDATORY)
  const isValid = await PasswordUtil.verify(
    props.body.password,
    seller.password_hash
  );
  if (!isValid) {
    throw new HttpException("Invalid credentials", 401);
  }

  // 3. Create NEW session record (MANDATORY)
  const accessExpires: Date = new Date(Date.now() + 60 * 60 * 1000);
  const refreshExpires: Date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = await MyGlobal.prisma.shopping_seller_sessions.create({
    data: {
      id: v4(),
      shopping_seller_id: seller.id,
      ip: props.body.ip ?? props.ip,
      href: props.body.href,
      referrer: props.body.referrer,
      created_at: new Date().toISOString(),
      expired_at: toISOStringSafe(accessExpires),
    },
  });

  // 4. Generate JWT tokens (MANDATORY)
  const token = {
    accessToken: jwt.sign(
      {
        type: "seller",
        id: seller.id,
        session_id: session.id,
        created_at: new Date().toISOString(),
      },
      MyGlobal.env.JWT_SECRET_KEY,
      {
        expiresIn: "1h",
        issuer: "autobe",
      }
    ),
    refreshToken: jwt.sign(
      {
        type: "seller",
        id: seller.id,
        session_id: session.id,
        tokenType: "refresh",
        created_at: new Date().toISOString(),
      },
      MyGlobal.env.JWT_SECRET_KEY,
      {
        expiresIn: "7d",
        issuer: "autobe",
      }
    ),
    expired_at: toISOStringSafe(accessExpires),
    refreshable_until: toISOStringSafe(refreshExpires),
  };

  // 5. Return with authorization token
  return {
    id: seller.id,
    email: seller.email,
    // ... other fields
    token,
  } satisfies IShoppingSeller.IAuthorized;
}
```

### Example 2: Login with Additional Business Logic

```typescript
// Example showing additional business logic integrated with mandatory phases
export async function postAuthUserLogin(props: {
  ip: string;
  body: IUser.ILogin
}): Promise<IUser.ILoginOutput> {
  // 1. Find actor by credentials (MANDATORY)
  const user = await MyGlobal.prisma.users.findFirst({
    where: { email: props.body.email }
  });
  if (!user) {
    throw new HttpException("Invalid credentials", 401);
  }

  // 2. ADDITIONAL BUSINESS LOGIC: Check account status
  if (user.status === 'banned') {
    throw new HttpException("Account has been banned", 403);
  }
  if (user.status === 'suspended') {
    throw new HttpException("Account is temporarily suspended", 403);
  }
  if (!user.email_verified) {
    throw new HttpException("Please verify your email first", 403);
  }

  // 3. Verify password (MANDATORY)
  const isValid = await PasswordUtil.verify(
    props.body.password,
    user.password_hash
  );
  if (!isValid) {
    // ADDITIONAL BUSINESS LOGIC: Track failed login attempt
    await MyGlobal.prisma.login_attempts.create({
      data: {
        id: v4(),
        user_id: user.id,
        success: false,
        ip: props.body.ip ?? props.ip,
        created_at: new Date().toISOString(),
      }
    });
    throw new HttpException("Invalid credentials", 401);
  }

  // 4. ADDITIONAL BUSINESS LOGIC: Update last login timestamp
  await MyGlobal.prisma.users.update({
    where: { id: user.id },
    data: {
      last_login_at: new Date().toISOString(),
      last_login_ip: props.body.ip,
    }
  });

  // 5. ADDITIONAL BUSINESS LOGIC: Invalidate old sessions (single device policy)
  if (props.body.single_device_only) {
    await MyGlobal.prisma.user_sessions.updateMany({
      where: {
        user_id: user.id,
        expired_at: { gt: new Date().toISOString() }
      },
      data: {
        expired_at: new Date().toISOString() // Expire immediately
      }
    });
  }

  // 6. Create NEW session record (MANDATORY)
  const accessExpires: Date = new Date(Date.now() + 60 * 60 * 1000);
  const refreshExpires: Date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = await MyGlobal.prisma.user_sessions.create({
    data: {
      id: v4(),
      user_id: user.id,
      ip: props.body.ip ?? props.ip,
      href: props.body.href,
      referrer: props.body.referrer,
      user_agent: props.body.user_agent,
      created_at: new Date().toISOString(),
      expired_at: toISOStringSafe(accessExpires),
    },
  });

  // 7. ADDITIONAL BUSINESS LOGIC: Create audit log
  await MyGlobal.prisma.audit_logs.create({
    data: {
      id: v4(),
      user_id: user.id,
      session_id: session.id,
      action: 'USER_LOGIN',
      ip: props.body.ip ?? props.ip,
      created_at: new Date().toISOString(),
    }
  });

  // 8. ADDITIONAL BUSINESS LOGIC: Track successful login attempt
  await MyGlobal.prisma.login_attempts.create({
    data: {
      id: v4(),
      user_id: user.id,
      success: true,
      ip: props.body.ip ?? props.ip,
      session_id: session.id,
      created_at: new Date().toISOString(),
    }
  });

  // 9. Generate JWT tokens (MANDATORY)
  const token = {
    accessToken: jwt.sign(
      {
        type: "user",
        id: user.id,
        session_id: session.id,
        created_at: new Date().toISOString(),
      },
      MyGlobal.env.JWT_SECRET_KEY,
      {
        expiresIn: "1h",
        issuer: "autobe",
      }
    ),
    refreshToken: jwt.sign(
      {
        type: "user",
        id: user.id,
        session_id: session.id,
        tokenType: "refresh",
        created_at: new Date().toISOString(),
      },
      MyGlobal.env.JWT_SECRET_KEY,
      {
        expiresIn: "7d",
        issuer: "autobe",
      }
    ),
    expired_at: toISOStringSafe(accessExpires),
    refreshable_until: toISOStringSafe(refreshExpires),
  };

  // 10. ADDITIONAL BUSINESS LOGIC: Send login notification (async, don't await)
  // NotificationService.sendLoginAlert(user.email, props.body.ip).catch(console.error);

  // 11. Return with authorization token
  return {
    id: user.id,
    email: user.email,
    last_login_at: user.last_login_at,
    // ... other fields
    token,
  } satisfies IUser.IAuthorized;
}
```

**IMPORTANT**:
- The mandatory phases (credential validation, password verification, session creation, JWT generation) must always be present
- Additional business logic can be inserted at any appropriate point in the flow
- Consider security implications of additional logic (e.g., rate limiting, account status checks)
- Consider transaction boundaries if multiple database operations must succeed or fail together
- Since this is a login operation, it must be publicly accessible without authentication
