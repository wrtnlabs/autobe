# Authorization Type: Join (Registration)

This is a **join** operation for user registration.

## Implementation Guidelines for Join

### Join (Registration) Operation Requirements
- This is a user registration endpoint
- Must validate all required user information
- Should check for duplicate accounts (email, username, etc.)
- Must hash passwords before storing (NEVER store plain passwords)
- Must create the actor record (user/member) in the database
- Must create a session record for the newly registered actor
- Must generate JWT tokens with correct payload structure
- May include additional business logic as required by the API specification (e.g., creating related records, sending welcome emails, initializing user preferences)
- Must NOT require authentication decorator (public endpoint)

**IMPORTANT**: While the core requirements (actor creation, session creation, JWT generation) are mandatory, you should implement any additional business logic specified in the API requirements. The examples below show the mandatory flow, but your implementation may include additional steps before, between, or after these core operations.

## Session Management Architecture

### Conceptual Foundation: Actor and Session Separation

In production authentication systems, we separate **Actor** (the persistent user identity) from **Session** (the temporary authentication state). This architectural pattern provides several critical benefits:

1. **Security**: Sessions can be independently revoked without deleting the user account
2. **Multi-device support**: One actor can maintain multiple concurrent sessions across different devices
3. **Audit trail**: Session records track when and where authentication occurred
4. **Token rotation**: Sessions enable secure refresh token rotation strategies

### Implementation Requirements for Join Operation

When implementing a join (registration) operation, you MUST include these core phases. Additional business logic may be inserted at any point as needed:

#### Phase 1: Create Actor Record
First, create the primary actor record (e.g., `shopping_sellers`, `users`, `admins`). This is **mandatory**:

```typescript
// Example: Creating a seller actor
const hashedPassword: string = await PasswordUtil.hash(props.body.password);
const seller = await MyGlobal.prisma.shopping_sellers.create({
  data: {
    id: v4(),
    email: props.body.email,
    password_hash: hashedPassword,  // Never store plain passwords
    created_at: toISOStringSafe(new Date()),
    // ... other actor-specific fields
  }
});
```

#### Phase 2: Create Session Record
After creating the actor, create an associated session record (e.g., `shopping_seller_sessions`). This is **mandatory**:

```typescript
// Example: Creating a session for the newly registered seller
const accessExpires: Date = new Date(Date.now() + 60 * 60 * 1000);
const refreshExpires: Date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
const session = await MyGlobal.prisma.shopping_seller_sessions.create({
  data: {
    id: v4(),
    shopping_seller_id: seller.id,  // Foreign key to actor
    ip: props.body.ip ?? props.ip,  // IP is optional - use client-provided (SSR case) or server-extracted
    href: props.body.href,
    referrer: props.body.referrer,
    created_at: toISOStringSafe(new Date()),
    expired_at: toISOStringSafe(accessExpires),
  }
});
```

**CRITICAL**: Both the actor ID and session ID will be embedded in the JWT token payload (see JWT Token Generation section below).

#### Additional Business Logic (Optional)
Between or after the mandatory phases above, you may implement additional business logic as specified in the API requirements. Examples include:
- Creating related records in other tables (e.g., user profiles, preferences, initial data)
- Sending notification emails or SMS
- Initializing default settings or configurations
- Creating audit logs or tracking records
- Integrating with external services
- Any other domain-specific operations required by the business

**The key principle**: The mandatory phases (actor creation, session creation, JWT generation) must always be present, but you have complete flexibility to add necessary business logic around them.

### Database Schema Pattern

Registration operations typically involve two related tables:

1. **Actor Table** (e.g., `shopping_sellers`): Stores persistent user identity
   - Primary key: `id` (UUID)
   - Contains: email, password_hash, profile information
   - Represents: "Who the user is"

2. **Session Table** (e.g., `shopping_seller_sessions`): Stores authentication sessions
   - Primary key: `id` (UUID)
   - Foreign key: `shopping_seller_id` (references actor)
   - Represents: "An active authentication instance for this user"

Refer to **REALIZE_AUTHORIZATION.md** for detailed session architecture and relationship patterns.

## MANDATORY: Use PasswordUtil for Password Hashing

**CRITICAL**: You MUST use PasswordUtil utilities for password hashing to ensure consistency across all authentication operations:

```typescript
// Example: Password hashing in join/registration
const hashedPassword: string = await PasswordUtil.hash(props.body.password);

// Store the hashed password in database
await MyGlobal.prisma.users.create({
  data: {
    id: v4(),
    email: props.body.email,
    password_hash: hashedPassword,  // Store the hash, never plain password
    created_at: toISOStringSafe(new Date()),
    // ... other fields
  }
});
```

**DO NOT**:
- Store plain passwords in the database
- Use bcrypt, argon2, or any other hashing library directly
- Implement your own hashing logic

## JWT Token Generation After Registration

### Conceptual Foundation: Token Payload Structure

The JWT token payload serves as a **cryptographically signed credential** that identifies both the actor and their specific authentication session. This dual identification enables:

1. **Actor identification**: `id` field identifies which user is authenticated
2. **Session identification**: `session_id` field identifies which authentication instance is active
3. **Role-based access**: `type` field enables discriminated union patterns for authorization

### Token Payload Structure

**CRITICAL**: Use the predefined payload structures for consistency:

```json
{{PAYLOAD}}
```

**NOTE**: The jsonwebtoken library is automatically imported as jwt. After successful registration, generate tokens with the EXACT payload structure:

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

// After creating BOTH the actor and session records:
// Phase 1: Create actor
const hashedPassword: string = await PasswordUtil.hash(props.body.password);
const seller = await MyGlobal.prisma.shopping_sellers.create({
  data: {
    id: v4(),
    email: props.body.email,
    password_hash: hashedPassword,
    created_at: new Date().toISOString(),
    // ... other fields
  }
});

// Phase 2: Create session
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

## Complete Registration Flow Examples

### Example 1: Basic Registration (Minimal)

```typescript
// Minimal example showing only mandatory phases
export async function postAuthSellerJoin(props: {
  ip: string;
  body: IShoppingSeller.IJoin;
}): Promise<IShoppingSeller.IJoinOutput> {
  // 1. Check for duplicate account
  const existing = await MyGlobal.prisma.shopping_sellers.findFirst({
    where: { email: props.body.email }
  });
  if (existing) {
    throw new HttpException("Email already registered", 409);
  }

  // 2. Hash password (MANDATORY)
  const hashedPassword = await PasswordUtil.hash(props.body.password);

  // 3. Create actor record (MANDATORY)
  const seller = await MyGlobal.prisma.shopping_sellers.create({
    data: {
      id: v4(),
      email: props.body.email,
      password_hash: hashedPassword,
      created_at: new Date().toISOString(),
      // ... other fields
    }
  });

  // 4. Create session record (MANDATORY)
  const accessExpires = new Date(Date.now() + 60 * 60 * 1000);
  const refreshExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = await MyGlobal.prisma.shopping_seller_sessions.create({
    data: {
      id: v4(),
      shopping_seller_id: seller.id,
      ip: props.body.ip ?? props.ip,
      href: props.body.href,
      referrer: props.body.referrer,
      created_at: toISOStringSafe(new Date()),
      expired_at: toISOStringSafe(accessExpires),
    }
  });

  // 5. Generate JWT tokens (MANDATORY)
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

  // 6. Return with authorization token
  return {
    id: seller.id,
    email: seller.email,
    // ... other fields
    token,
  } satisfies IShoppingSeller.IAuthorized;
}
```

### Example 2: Registration with Additional Business Logic

```typescript
// Example showing additional business logic integrated with mandatory phases
export async function postAuthUserJoin(props: {
  ip: string;
  body: IUser.IJoin
}): Promise<IUser.IJoinOutput> {
  // 1. Validation and duplicate check
  const existing = await MyGlobal.prisma.users.findFirst({
    where: { email: props.body.email }
  });
  if (existing) {
    throw new HttpException("Email already registered", 409);
  }

  // 2. Hash password (MANDATORY)
  const hashedPassword = await PasswordUtil.hash(props.body.password);

  // 3. Create actor record (MANDATORY)
  const user = await MyGlobal.prisma.users.create({
    data: {
      id: v4(),
      email: props.body.email,
      password_hash: hashedPassword,
      created_at: new Date().toISOString(),
      // ... other fields
    }
  });

  // 4. ADDITIONAL BUSINESS LOGIC: Create user profile
  const profile = await MyGlobal.prisma.user_profiles.create({
    data: {
      id: v4(),
      user_id: user.id,
      nickname: props.body.nickname,
      avatar_url: props.body.avatar_url,
      created_at: new Date().toISOString(),
    }
  });

  // 5. ADDITIONAL BUSINESS LOGIC: Initialize user preferences
  await MyGlobal.prisma.user_preferences.create({
    data: {
      id: v4(),
      user_id: user.id,
      language: props.body.preferred_language ?? 'en',
      theme: 'light',
      notifications_enabled: true,
    }
  });

  // 6. ADDITIONAL BUSINESS LOGIC: Create audit log
  await MyGlobal.prisma.audit_logs.create({
    data: {
      id: v4(),
      user_id: user.id,
      action: 'USER_REGISTERED',
      ip_address: props.body.ip ?? props.ip,
      created_at: new Date().toISOString(),
    }
  });

  // 7. Create session record (MANDATORY)
  const accessExpires = new Date(Date.now() + 60 * 60 * 1000);
  const refreshExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = await MyGlobal.prisma.user_sessions.create({
    data: {
      id: v4(),
      user_id: user.id,
      ip: props.body.ip ?? props.ip,
      href: props.body.href,
      referrer: props.body.referrer,
      created_at: toISOStringSafe(new Date()),
      expired_at: toISOStringSafe(accessExpires),
    }
  });

  // 8. Generate JWT tokens (MANDATORY)
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

  // 9. ADDITIONAL BUSINESS LOGIC: Send welcome email (async, don't await)
  // EmailService.sendWelcomeEmail(user.email, user.nickname).catch(console.error);

  // 10. Return with authorization token and additional data
  return {
    id: user.id,
    email: user.email,
    profile: {
      nickname: profile.nickname,
      avatar_url: profile.avatar_url,
    },
    token,
  } satisfies IUser.IAuthorized;
}
```

**IMPORTANT**:
- The mandatory phases (password hashing, actor creation, session creation, JWT generation) must always be present
- Additional business logic can be inserted at any appropriate point in the flow
- Consider transaction boundaries if multiple database operations must succeed or fail together
- Since this is a registration operation, it must be publicly accessible
- Always hash passwords before storing
