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
// The collector handles password hashing internally via PasswordUtil.hash()
const seller = await MyGlobal.prisma.shopping_sellers.create({
  data: await ShoppingSellerCollector.collect({
    body: props.body,
  }),
  ...ShoppingSellerTransformer.select(),
});
```

#### Phase 2: Create Session Record
After creating the actor, create an associated session record (e.g., `shopping_seller_sessions`). This is **mandatory**:

```typescript
// Example: Creating a session for the newly registered seller
const accessExpires: Date = new Date(Date.now() + 60 * 60 * 1000);
const refreshExpires: Date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
const session = await MyGlobal.prisma.shopping_seller_sessions.create({
  data: await ShoppingSellerSessionCollector.collect({
    body: props.body,
    shoppingSeller: { id: seller.id },
    ip: props.body.ip ?? props.ip,
  }),
  ...ShoppingSellerSessionTransformer.select(),
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

## CRITICAL: Password Hashing is Handled by Collectors

**IMPORTANT**: Password hashing is **automatically handled by the Collector** - you do NOT need to hash passwords manually.

The Collector internally uses `PasswordUtil.hash()` to securely hash passwords before storing them in the database. This ensures:
- **Consistency**: All password hashing uses the same algorithm across the application
- **Security**: Passwords are NEVER stored in plain text
- **Simplicity**: You don't need to manage hashing logic in operation code

```typescript
// ✅ CORRECT - Collector handles password hashing internally
const user = await MyGlobal.prisma.users.create({
  data: await UserCollector.collect({
    body: props.body,  // Contains password field
  }),
  ...UserTransformer.select(),
});
// The collector automatically calls: await PasswordUtil.hash(props.body.password)
```

**DO NOT**:
- ❌ Manually hash passwords before passing to collector
- ❌ Pass `password_hash` as a separate parameter to collector
- ❌ Store plain passwords in the database
- ❌ Use bcrypt, argon2, or any other hashing library directly

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
// Phase 1: Create actor (collector handles password hashing internally)
const seller = await MyGlobal.prisma.shopping_sellers.create({
  data: await ShoppingSellerCollector.collect({
    body: props.body,
  }),
  ...ShoppingSellerTransformer.select(),
});

// Phase 2: Create session
const accessExpires: Date = new Date(Date.now() + 60 * 60 * 1000);
const refreshExpires: Date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
const session = await MyGlobal.prisma.shopping_seller_sessions.create({
  data: await ShoppingSellerSessionCollector.collect({
    body: props.body,
    shoppingSeller: { id: seller.id },
    ip: props.body.ip ?? props.ip,
  }),
  ...ShoppingSellerSessionTransformer.select(),
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

  // 2. Create actor record (MANDATORY - collector handles password hashing)
  const seller = await MyGlobal.prisma.shopping_sellers.create({
    data: await ShoppingSellerCollector.collect({
      body: props.body,
    }),
    ...ShoppingSellerTransformer.select(),
  });

  // 3. Create session record (MANDATORY)
  const accessExpires = new Date(Date.now() + 60 * 60 * 1000);
  const refreshExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = await MyGlobal.prisma.shopping_seller_sessions.create({
    data: await ShoppingSellerSessionCollector.collect({
      body: props.body,
      shoppingSeller: { id: seller.id },
      ip: props.body.ip ?? props.ip,
    }),
    ...ShoppingSellerSessionTransformer.select(),
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
  // IShoppingSeller.IAuthorized = IShoppingSeller & { token: IAuthorizationToken }
  // This pattern adds the token field to the seller data
  return {
    ...await ShoppingSellerTransformer.transform(seller),
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

  // 2. Create actor record (MANDATORY - collector handles password hashing)
  const user = await MyGlobal.prisma.users.create({
    data: await UserCollector.collect({
      body: props.body,
    }),
    ...UserTransformer.select(),
  });

  // 3. ADDITIONAL BUSINESS LOGIC: Create user profile
  const profile = await MyGlobal.prisma.user_profiles.create({
    data: {
      id: v4(),
      user_id: user.id,
      nickname: props.body.nickname,
      avatar_url: props.body.avatar_url,
      created_at: new Date().toISOString(),
    }
  });

  // 4. ADDITIONAL BUSINESS LOGIC: Initialize user preferences
  await MyGlobal.prisma.user_preferences.create({
    data: {
      id: v4(),
      user_id: user.id,
      language: props.body.preferred_language ?? 'en',
      theme: 'light',
      notifications_enabled: true,
    }
  });

  // 5. ADDITIONAL BUSINESS LOGIC: Create audit log
  await MyGlobal.prisma.audit_logs.create({
    data: {
      id: v4(),
      user_id: user.id,
      action: 'USER_REGISTERED',
      ip_address: props.body.ip ?? props.ip,
      created_at: new Date().toISOString(),
    }
  });

  // 6. Create session record (MANDATORY)
  const accessExpires = new Date(Date.now() + 60 * 60 * 60 * 1000);
  const refreshExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = await MyGlobal.prisma.user_sessions.create({
    data: await UserSessionCollector.collect({
      body: props.body,
      user: { id: user.id },
      ip: props.body.ip ?? props.ip,
    }),
    ...UserSessionTransformer.select(),
  });

  // 7. Generate JWT tokens (MANDATORY)
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

  // 8. ADDITIONAL BUSINESS LOGIC: Send welcome email (async, don't await)
  // EmailService.sendWelcomeEmail(user.email, user.nickname).catch(console.error);

  // 9. Return with authorization token and additional data
  // IUser.IAuthorized = IUser & { token: IAuthorizationToken }
  // This pattern adds the token field to the user data, along with the profile
  return {
    ...await UserTransformer.transform(user),
    profile: await UserProfileTransformer.transform(profile),
    token,
  } satisfies IUser.IAuthorized;
}
```

**IMPORTANT**:
- The mandatory phases (actor creation, session creation, JWT generation) must always be present
- Password hashing is handled automatically by the collector - do NOT hash manually
- Additional business logic can be inserted at any appropriate point in the flow
- Consider transaction boundaries if multiple database operations must succeed or fail together
- Since this is a registration operation, it must be publicly accessible

## Understanding the IAuthorized Pattern

The `IAuthorized` interface pattern is a TypeScript type composition that combines actor data with authentication tokens:

```typescript
// Type definition pattern
interface IShoppingSeller {
  id: string & tags.Format<"uuid">;
  email: string & tags.Format<"email">;
  name: string;
  // ... other seller fields
}

namespace IShoppingSeller {
  export interface IAuthorized extends IShoppingSeller {
    token: IAuthorizationToken;  // Only adds this field
  }
}
```

**Why this pattern exists**:
1. **Type Safety**: Enforces that login/join responses MUST include both actor data and tokens
2. **Code Clarity**: Makes it explicit that this is an authenticated response
3. **Reusability**: The same actor type is used across authenticated and non-authenticated contexts

**Implementation**:
```typescript
// Spread the transformed actor data, then add the token field
return {
  ...await ShoppingSellerTransformer.transform(seller),  // All IShoppingSeller fields
  token,  // Adds the IAuthorizationToken field
} satisfies IShoppingSeller.IAuthorized;
```

This is why we use the spread operator with transformer - it ensures we return ALL actor fields plus the token, satisfying the `IAuthorized` interface contract.
