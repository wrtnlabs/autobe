import { IAgenticaHistoryJson } from "@agentica/core";
import { AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { v7 } from "uuid";

export const transformRealizeWriteAuthorizationsHistories = (
  operation: AutoBeOpenApi.IOperation,
  payloads: Record<string, string>,
): Array<IAgenticaHistoryJson.ISystemMessage> => {
  // Login operation 가이드
  const loginGuide =
    operation.authorizationType === "login"
      ? [
          {
            id: v7(),
            created_at: new Date().toISOString(),
            type: "systemMessage" as const,
            text: StringUtil.trim`
              # Authorization Type: Login

              This is a **login** operation that authenticates users.

              ## Implementation Guidelines for Login:

              ### Login Operation Requirements
              - This is a login endpoint that authenticates users
              - Must validate credentials (username/email and password)
              - Should return authentication tokens (access and refresh tokens)
              - Must NOT require authentication decorator (this endpoint creates authentication)
              - Should check if user exists and password matches

              ### MANDATORY: Use MyGlobal.password for Password Verification
              
              **CRITICAL**: You MUST use MyGlobal.password utilities for password verification to ensure consistency with the join operation:

              \`\`\`typescript
              // Example: Password verification in login
              const isValid = await MyGlobal.password.verify(
                body.password,           // plain password from request
                user.password_hash       // hashed password from database
              );
              
              if (!isValid) {
                throw new Error("Invalid credentials");
              }
              \`\`\`

              ### JWT Token Generation
              
              **NOTE**: The jsonwebtoken library is automatically imported as jwt. Use it to generate tokens with the EXACT payload structure:

              **CRITICAL**: Use the predefined payload structures for consistency:

              \`\`\`json
              ${JSON.stringify(payloads)}
              \`\`\`

              // JWT is already imported: import jwt from "jsonwebtoken";
              
              // Generate access token with the EXACT payload structure for the user type
              // DO NOT use type annotations like: const payload: MemberPayload = {...}
              // Just create the payload object directly
              
              const accessToken = jwt.sign(
                {
                  userId: user.id,
                  email: user.email,
                  // ... other required fields from the payload structure above
                },
                MyGlobal.env.JWT_SECRET_KEY,
                {
                  expiresIn: '1h',
                  issuer: 'autobe'  // MUST use 'autobe' as issuer
                }
              );

              // Generate refresh token (optional)
              const refreshToken = jwt.sign(
                {
                  userId: user.id,
                  tokenType: 'refresh'
                },
                MyGlobal.env.JWT_SECRET_KEY,
                {
                  expiresIn: '7d',
                  issuer: 'autobe'  // MUST use 'autobe' as issuer
                }
              );

              // Decode tokens if needed (e.g., for verification)
              const decoded = jwt.verify(token, MyGlobal.env.JWT_SECRET_KEY, {
                issuer: 'autobe'  // Verify issuer is 'autobe'
              });

              **DO NOT**:
              - Implement your own password hashing logic
              - Use bcrypt, argon2, or any other hashing library directly
              - Try to hash and compare manually

              **IMPORTANT**: Since this is a login operation, it must be publicly accessible without authentication.
            `,
          },
        ]
      : [];

  // Join (registration) operation 가이드
  const joinGuide =
    operation.authorizationType === "join"
      ? [
          {
            id: v7(),
            created_at: new Date().toISOString(),
            type: "systemMessage" as const,
            text: StringUtil.trim`
              # Authorization Type: Join (Registration)

              This is a **join** operation for user registration.

              ## Implementation Guidelines for Join:

              ### Join (Registration) Operation Requirements
              - This is a user registration endpoint
              - Must validate all required user information
              - Should check for duplicate accounts (email, username, etc.)
              - Must hash passwords before storing (NEVER store plain passwords)
              - Should create a new user record in the database
              - Must NOT require authentication decorator (public endpoint)

              ### MANDATORY: Use MyGlobal.password for Password Hashing
              
              **CRITICAL**: You MUST use MyGlobal.password utilities for password hashing to ensure consistency across all authentication operations:

              \`\`\`typescript
              // Example: Password hashing in join/registration
              const hashedPassword = await MyGlobal.password.hash(body.password);
              
              // Store the hashed password in database
              await MyGlobal.prisma.users.create({
                data: {
                  email: body.email,
                  password_hash: hashedPassword,  // Store the hash, never plain password
                  // ... other fields
                }
              });
              \`\`\`

              **DO NOT**:
              - Store plain passwords in the database
              - Use bcrypt, argon2, or any other hashing library directly
              - Implement your own hashing logic

              ### JWT Token Generation After Registration
              
              **NOTE**: The jsonwebtoken library is automatically imported as jwt. After successful registration, generate tokens with the EXACT payload structure:

              **CRITICAL**: Use the predefined payload structures for consistency:

              \`\`\`json
              ${JSON.stringify(payloads)}
              \`\`\`

              // JWT is already imported: import jwt from "jsonwebtoken";
              
              // After creating the user, generate tokens with EXACT payload structure
              // DO NOT use type annotations like: const payload: UserPayload = {...}
              // Just create the payload object directly in jwt.sign()
              
              const accessToken = jwt.sign(
                {
                  userId: newUser.id,
                  email: newUser.email,
                  // ... other required fields from the payload structure above
                },
                MyGlobal.env.JWT_SECRET_KEY,
                {
                  expiresIn: '1h',
                  issuer: 'autobe'  // MUST use 'autobe' as issuer
                }
              );

              const refreshToken = jwt.sign(
                {
                  userId: newUser.id,
                  tokenType: 'refresh'
                },
                MyGlobal.env.JWT_SECRET_KEY,
                {
                  expiresIn: '7d',
                  issuer: 'autobe'  // MUST use 'autobe' as issuer
                }
              );

              **IMPORTANT**: Since this is a registration operation, it must be publicly accessible. Always hash passwords before storing.
            `,
          },
        ]
      : [];

  // Refresh token operation 가이드
  const refreshGuide =
    operation.authorizationType === "refresh"
      ? [
          {
            id: v7(),
            created_at: new Date().toISOString(),
            type: "systemMessage" as const,
            text: StringUtil.trim`
              # Authorization Type: Refresh Token

              This is a **refresh** token operation for renewing expired access tokens.

              ## Implementation Guidelines for Refresh:

              ### Refresh Token Operation Requirements
              - This endpoint refreshes expired access tokens
              - Must validate the refresh token first
              - Should check if refresh token is not expired or revoked
              - Must generate a new access token with THE SAME payload structure
              - May also rotate the refresh token for security
              - Should handle invalid/expired refresh tokens gracefully
              - Typically requires the refresh token in request body or headers
              - Must NOT require standard authentication (uses refresh token instead)

              ### CRITICAL: Refresh Token Implementation

              **IMPORTANT**: When refreshing tokens, you MUST:
              1. Decode and verify the refresh token
              2. Extract the user information from the decoded token
              3. Generate a new access token with THE SAME payload structure as the original

              **CRITICAL**: Use the predefined payload structures for consistency:

              \`\`\`json
              ${JSON.stringify(payloads)}
              \`\`\`

              // JWT is already imported: import jwt from "jsonwebtoken";
              
              // Step 1: Verify and decode the refresh token
              const decoded = jwt.verify(body.refreshToken, MyGlobal.env.JWT_SECRET_KEY, {
                issuer: 'autobe'
              });
              
              // Step 2: Get user data (from decoded token or database)
              const user = await MyGlobal.prisma.users.findUnique({
                where: { id: decoded.userId }
              });
              
              if (!user) {
                throw new Error("User not found");
              }
              
              // Step 3: Generate new access token with SAME payload structure as login/join
              const newAccessToken = jwt.sign(
                {
                  userId: user.id,
                  email: user.email,
                  // ... other required fields from the payload structure above
                  // MUST match the structure used in login/join operations
                },
                MyGlobal.env.JWT_SECRET_KEY,
                {
                  expiresIn: '1h',
                  issuer: 'autobe'
                }
              );
              
              // Optional: Rotate refresh token
              const newRefreshToken = jwt.sign(
                {
                  userId: user.id,
                  tokenType: 'refresh'
                },
                MyGlobal.env.JWT_SECRET_KEY,
                {
                  expiresIn: '7d',
                  issuer: 'autobe'
                }
              );

              **DO NOT**:
              - Generate new access tokens with different payload structures
              - Use random IDs like v4() in the payload
              - Create tokens without verifying the refresh token first
              - Use type annotations like: const payload: UserPayload = {...}

              **IMPORTANT**: The new access token MUST have the same payload structure as the original token from login/join operations.
            `,
          },
        ]
      : [];

  return [...loginGuide, ...joinGuide, ...refreshGuide];
};
