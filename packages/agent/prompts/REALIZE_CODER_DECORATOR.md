# 🔐 Realize Coder Decorator Instructions

When decoratorEvent is provided in the operation plan, authentication/authorization decorators are already pre-generated and must be used for the function implementation.

## 📁 Pre-Generated File Structure

### 1. Decorator Implementation
- **Location**: `decorators/${decorator.name}.ts`
- **Content**: NestJS parameter decorator implementation
- **Purpose**: Extracts and validates authenticated user from request
- **Import from providers**: `import { ${decorator.name} } from '../decorators/${decorator.name}';`

### 2. Authentication Provider  
- **Location**: `authentications/${provider.name}.ts`
- **Content**: Authentication/authorization logic implementation
- **Features**:
  - JWT token validation and decoding
  - Role-based access control
  - Database queries for user validation
  - Error handling for unauthorized access
- **Import from providers**: `import { ${provider.name} } from '../authentications/${provider.name}';`

### 3. Type Definition
- **Location**: `authentications/types/${decoratorType.name}.ts`
- **Content**: TypeScript interface for authenticated user payload
- **Purpose**: Strongly-typed user data structure
- **Import from providers**: `import { ${decoratorType.name} } from '../authentications/types/${decoratorType.name}';`

## 🎯 Required Implementation Pattern

When decoratorEvent is present, the decorator is handled at the controller level. The provider function receives the authenticated user as a regular parameter:

```typescript
// The type is auto-imported, DO NOT manually import it
// Auto-injected: import { ${decoratorType.name} } from '../authentications/types/${decoratorType.name}';

export async function ${functionName}(
  user: ${decoratorType.name},  // Pre-validated user from controller decorator
  parameters: Record<string, string>,
  body: Record<string, any>
) {
  // The 'user' parameter contains authenticated user data already validated by the controller
  // Access user properties: user.id, user.role, etc.
  
  // Your implementation logic here
  // The controller's decorator has already ensured only authenticated users with proper roles can access this function
}
```

**Note**: 
- The decorator (`@${decorator.name}()`) is applied at the controller level, NOT in the provider function
- The type import is **automatically injected** - do not manually import it

## ⚠️ Critical Rules

1. **DO NOT MANUALLY IMPORT** - The type is auto-injected, never manually import it
2. **USER TYPE IS MANDATORY** - When decoratorEvent exists, user parameter must use the provided type
3. **DO NOT recreate these files** - They are pre-generated and tested
4. **TYPE IS AUTO-IMPORTED** - The system automatically imports the correct type
5. **MAINTAIN type safety** - Use the provided type for the user parameter

## 🔍 Decorator Event Structure Reference

```typescript
decoratorEvent: {
  role: string;                    // The role this decorator validates (e.g., "admin", "user")
  provider: {
    name: string;                  // Provider function name (e.g., "adminAuthorize")
    code: string;                  // Full provider implementation
  };
  decorator: {
    name: string;                  // Decorator name (e.g., "AdminAuth")
    code: string;                  // Decorator implementation
  };
  decoratorType: {
    name: string;                  // Type name (e.g., "AdminPayload")
    code: string;                  // TypeScript interface definition
  };
}
```

## ⚠️ Authorization Check Decision Tree

```
Does the function have an authenticated user parameter (not Record<string, never>)?
├─ NO → No authorization needed (public endpoint)
└─ YES → AUTHORIZATION IS MANDATORY
    ├─ Is it a DELETE operation?
    │   └─ MUST check resource ownership (author_id === user.id)
    ├─ Is it an UPDATE operation?
    │   └─ MUST check ownership OR admin rights
    ├─ Is it a CREATE operation in nested resource?
    │   └─ MUST check parent resource access rights
    └─ Is it a READ operation?
        └─ MUST check if resource is private/public
```

## 📝 Example: Admin-Protected Function

If decoratorEvent indicates admin authentication:

```typescript
// AdminPayload is auto-imported, DO NOT manually import
// Auto-injected: import { AdminPayload } from '../authentications/types/AdminPayload';

export async function delete__users_$id(
  admin: AdminPayload,  // Controller has already validated this user via @AdminAuth() decorator
  parameters: Record<string, string>,
  body: Record<string, never>
) {
  // The controller's @AdminAuth() decorator has already ensured:
  // - Valid JWT token
  // - User has admin role
  // - admin object is properly populated
  
  const userId = parameters.id;
  
  await MyGlobal.prisma.users.delete({
    where: { id: userId }
  });
  
  return {
    success: true,
    deleted_by: admin.id
  };
}
```

**Function Naming Convention**: `${method}__${path}` (double underscore after method)

## 🛡️ MANDATORY Authorization Logic

**🚨 ABSOLUTE RULE**: When decoratorEvent exists and provides an authenticated user type, authorization checks are NOT OPTIONAL - they are MANDATORY.

**The authenticated user parameter is a CONTRACT that you MUST fulfill with authorization logic.**

### 1. 🔴 MANDATORY Resource Ownership Verification
**REQUIRED for ALL update/delete operations on user-owned resources**:

```typescript
// 🔴 STEP 1: ALWAYS fetch the resource to check ownership
const post = await MyGlobal.prisma.posts.findUniqueOrThrow({
  where: { id: parameters.id }
});

// 🔴 STEP 2: MANDATORY ownership verification
if (post.author_id !== user.id) {
  throw new Error("Unauthorized: You can only delete your own posts");
}

// ✅ STEP 3: Only then proceed with the operation
// ... actual delete/update logic here
```

**NEVER skip ownership checks - the user parameter exists SPECIFICALLY for this purpose**

### 2. Role-Based Access Control
For admin-only operations:
```typescript
// The decorator already verified the user has admin role
// But you may need additional checks for specific resources
if (sensitiveResource.protection_level === "super_admin" && admin.level !== "super") {
  throw new Error("Unauthorized: Super admin access required");
}
```

### 3. Combined Authorization Patterns
Allow multiple valid authorization paths:
```typescript
// Example: Post can be deleted by author OR admin
const post = await MyGlobal.prisma.posts.findUniqueOrThrow({
  where: { id: parameters.id }
});

const isAuthor = post.author_id === user.id;
const isAdmin = user.role === "admin";

if (!isAuthor && !isAdmin) {
  throw new Error("Unauthorized: Only post author or admin can delete");
}
```

### 4. Hierarchical Permissions
Check parent resource permissions:
```typescript
// Example: Check if user can modify items in a board
const board = await MyGlobal.prisma.boards.findUniqueOrThrow({
  where: { id: body.board_id },
  include: { members: true }
});

const isMember = board.members.some(m => m.user_id === user.id);
const isOwner = board.owner_id === user.id;

if (!isMember && !isOwner && user.role !== "admin") {
  throw new Error("Unauthorized: Not a member of this board");
}
```

## 🚫 Common Mistakes to Avoid

1. **Importing the decorator** - DO NOT import decorators in provider functions
2. **Wrong type import** - Import from `../authentications/types/`
3. **Using generic user type** - Must use the specific type from decoratorEvent
4. **Wrong parameter name** - Use the specific user type name (e.g., admin: AdminPayload)
5. **Creating duplicate auth logic** - Authentication is handled by controller
6. **🔴 CRITICAL: Ignoring the user parameter** - If user exists, it MUST be used for authorization
7. **🔴 CRITICAL: No authorization checks** - Operations without ownership/permission verification