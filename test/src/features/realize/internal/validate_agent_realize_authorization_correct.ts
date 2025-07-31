import { orchestrateRealizeAuthorizationCorrect } from "@autobe/agent/src/orchestrate/realize/orchestrateRealizeAuthorizationCorrect";
import { InternalFileSystem } from "@autobe/agent/src/orchestrate/realize/utils/InternalFileSystem";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeEvent,
  AutoBeRealizeAuthorization,
  IAutoBeCompiler,
} from "@autobe/interface";

import { TestFactory } from "../../../TestFactory";
import { TestGlobal } from "../../../TestGlobal";
import { TestProject } from "../../../structures/TestProject";
import { prepare_agent_realize } from "./prepare_agent_realize";

export const validate_agent_realize_authorization_correct = async (
  factory: TestFactory,
  project: TestProject,
) => {
  if (TestGlobal.env.API_KEY === undefined) return false;

  // PREPARE AGENT
  const { agent } = await prepare_agent_realize(factory, project);

  const map = new Map<string, true>();
  const events: AutoBeEvent[] = [];
  const enroll = (event: AutoBeEvent) => {
    if (!map.has(event.type)) {
      map.set(event.type, true);
    }

    events.push(event);
  };

  agent.on("realizeStart", enroll);
  agent.on("realizeProgress", enroll);
  agent.on("realizeValidate", enroll);
  agent.on("realizeComplete", enroll);
  agent.on("realizeAuthorizationStart", enroll);
  agent.on("realizeAuthorizationWrite", enroll);
  agent.on("realizeAuthorizationValidate", enroll);
  agent.on("realizeAuthorizationCorrect", enroll);
  agent.on("realizeAuthorizationComplete", enroll);

  const ctx = agent.getContext();

  const template = await (await ctx.compiler()).realize.getTemplate();

  const templateFiles = InternalFileSystem.DEFAULT.map((el) => ({
    [el]: template[el],
  })).reduce((acc, cur) => Object.assign(acc, cur), {});

  const prisma = ctx.state().prisma?.compiled;
  const prismaClients: Record<string, string> =
    prisma?.type === "success" ? prisma.nodeModules : {};

  const authorizations: AutoBeRealizeAuthorization[] = [
    {
      role: "moderator",
      decorator: {
        location: "src/decorators/ModeratorAuth.ts",
        name: "ModeratorAuth",
        content:
          'import { createParamDecorator, ExecutionContext } from \'@nestjs/common\';\nimport { SwaggerCustomizer } from \'@autobe/swagger\';\nimport { moderatorAuthorize } from \'./moderatorAuthorize\';\nimport { Singleton } from \'tstl\';\nimport { ModeratorPayload } from \'./ModeratorPayload\';\n\n// Add Bearer auth to Swagger for endpoints decorated with @ModeratorAuth\nSwaggerCustomizer.addBearer("ModeratorAuth");\n\n/**\n * ModeratorAuth decorator.\n * Authenticates request, injects ModeratorPayload parameter.\n * Usage: (param: ModeratorPayload) in Controller method\n */\nexport const ModeratorAuth: ParameterDecorator =\n    Singleton.lazy(() =>\n        createParamDecorator(\n            async (_: any, ctx: ExecutionContext): Promise<ModeratorPayload> => {\n                const req = ctx.switchToHttp().getRequest();\n                const auth = req.headers["authorization"];\n                if (!auth || !auth.startsWith("Bearer ")) throw new Error("Missing or malformed Authorization header.");\n                const token = auth.replace("Bearer ", "").trim();\n                return moderatorAuthorize(token);\n            },\n        )(),\n    );\n',
      },
      payload: {
        location: "src/decorators/payload/ModeratorPayload.ts",
        name: "ModeratorPayload",
        content:
          'import { tags } from "typia";\n\n/**\n * Moderator account JWT payload structure for controller injection\n */\nexport interface ModeratorPayload {\n    /**\n     * @format uuid\n     * Moderator\'s user profile ID\n     */\n    id: string & tags.Format<"uuid">;\n    /**\n     * RBAC discriminator (const)\n     */\n    type: "moderator";\n} // Used by ModeratorAuth\n',
      },
      provider: {
        location: "src/providers/authorize/moderatorAuthorize.ts",
        name: "moderatorAuthorize",
        content:
          'import { ForbiddenException, UnauthorizedException } from "@nestjs/common";\nimport { jwtAuthorize } from "@autobe/jwt";\nimport { MyGlobal } from "@APP/core/MyGlobal";\nimport { ModeratorPayload } from "./ModeratorPayload";\n\n/**\n * Moderator Authorization Provider\n * Validates JWT, checks type, ensures user is current moderator.\n * Throws UnauthorizedException if JWT fails or no moderator match.\n * Throws ForbiddenException if type mismatch or revoked.\n * Returns ModeratorPayload with id, type.\n */\nexport async function moderatorAuthorize(token: string): Promise<ModeratorPayload> {\n    // 1. Verify JWT and extract payload.\n    const payload = await jwtAuthorize(token);\n    if (!payload || typeof payload !== "object") throw new UnauthorizedException("Invalid token or payload.");\n\n    // 2. Must be type \'moderator\' (RBAC discriminator).\n    if (payload.type !== "moderator") throw new ForbiddenException("Not a moderator account.");\n\n    // 3. Check DB for active moderator assignment and not revoked.\n    const moderator = await MyGlobal.prisma.discussion_board_moderators.findFirst({\n        where: {\n            discussion_board_user_profile_id: payload.id,\n            revoked_at: null,\n        },\n    });\n    if (!moderator) throw new ForbiddenException("Moderator privileges revoked or not assigned.");\n\n    // 4. Return authorized payload.\n    return {\n        id: payload.id,\n        type: "moderator",\n    };\n}\n',
      },
    },
    {
      role: "admin",
      decorator: {
        location: "src/decorators/AdminAuth.ts",
        name: "AdminAuth",
        content:
          'import { createParamDecorator, ExecutionContext } from "@nestjs/common";\nimport { SwaggerCustomizer } from "@samchon/nest-auth-helper";\nimport { Singleton } from "tstl";\nimport { adminAuthorize } from "./adminAuthorize";\nimport type { AdminPayload } from "./AdminPayload";\n\n/**\n * Parameter decorator for injecting authenticated admin user.\n * Adds Swagger Bearer auth marker automatically.\n */\nexport function AdminAuth(): ParameterDecorator {\n    // Use Singleton to prevent duplicate decorator instances\n    return Singleton.improvise(\n        "discussion-board-admin-auth-decorator",\n        () => {\n            SwaggerCustomizer.markBearer();\n            return createParamDecorator(async (_data: unknown, ctx: ExecutionContext): Promise<AdminPayload> => {\n                return await adminAuthorize(ctx);\n            })();\n        }\n    );\n}',
      },
      payload: {
        location: "src/decorators/payload/AdminPayload.ts",
        name: "AdminPayload",
        content:
          'import typia from "typia";\n\n/** Admin JWT payload structure */\nexport interface AdminPayload {\n    /** UUID of admin user */\n    id: string & typia.tags.Format<"uuid">;\n    /** Role type discriminator */\n    type: "admin";\n}\n',
      },
      provider: {
        location: "src/providers/authorize/adminAuthorize.ts",
        name: "adminAuthorize",
        content:
          'import { ExecutionContext, ForbiddenException, UnauthorizedException } from "@nestjs/common";\nimport { jwtAuthorize } from "@samchon/nest-auth-helper";\nimport typia from "typia";\n\n/**\n * Auth provider for admin role.\n * - Checks JWT, type, and database existence of admin user.\n */\nexport async function adminAuthorize(context: ExecutionContext): Promise<AdminPayload> {\n    // Extract bearer token from header\n    const request = context.switchToHttp().getRequest();\n    const authHeader: string = request.headers["authorization"];\n    if (!authHeader || !authHeader.startsWith("Bearer ")) {\n        throw new UnauthorizedException("Missing or invalid bearer token.");\n    }\n    const token = authHeader.slice(7);\n\n    // Verify JWT and its role type using jwtAuthorize helper\n    const payload = await jwtAuthorize(token);\n    if (!payload || typeof payload !== "object" || payload.type !== "admin") {\n        throw new ForbiddenException("Invalid admin access token or role type.");\n    }\n    // Validate token payload format\n    typia.assert<AdminPayload>(payload);\n\n    // Ensure admin exists in the DB and is not revoked\n    const admin = await MyGlobal.prisma.discussion_board_admins.findFirst({\n        where: {\n            discussion_board_user_profile_id: payload.id,\n            revoked_at: null\n        }\n    });\n    if (!admin) {\n        throw new ForbiddenException("Admin access revoked or user does not exist.");\n    }\n    return payload;\n}',
      },
    },
    {
      role: "guest",
      decorator: {
        location: "src/decorators/GuestAuth.ts",
        name: "GuestAuth",
        content:
          'import { createParamDecorator, ExecutionContext, UnauthorizedException } from "@nestjs/common";\nimport { SwaggerCustomizer } from "@samchon/autobe";\nimport { Singleton } from "tstl";\nimport { guestAuthorize } from "./guestAuthorize";\nimport type { GuestPayload } from "./GuestPayload";\n\n/**\n * Decorator that injects the authorized guest user payload into controller routes.\n * - Adds bearer/session_id security scheme to Swagger docs.\n * - Implements singleton for performance.\n */\nexport const GuestAuth: ParameterDecorator = Singleton.get(() => {\n    SwaggerCustomizer.setBearer("GuestAuth");\n    return createParamDecorator(\n        async (data: unknown, ctx: ExecutionContext): Promise<GuestPayload> => {\n            const request = ctx.switchToHttp().getRequest();\n            try {\n                return await guestAuthorize(request);\n            } catch (err) {\n                throw new UnauthorizedException(err.message);\n            }\n        }\n    )();\n});',
      },
      payload: {
        location: "src/decorators/payload/GuestPayload.ts",
        name: "GuestPayload",
        content:
          'import typia from "typia";\n\n/**\n * GuestPayload: Structure injected for guest authorization sessions.\n * @property id - The UUID of the guest session/actor.\n * @property type - Must always be \'guest\' as a role discriminator for authorization logic.\n */\nexport interface GuestPayload {\n    /** Guest actor/session UUID */\n    id: string & typia.tags.Format<"uuid">;\n    /** Role discriminator (always \'guest\') */\n    type: "guest";\n}\n',
      },
      provider: {
        location: "src/providers/authorize/guestAuthorize.ts",
        name: "guestAuthorize",
        content:
          'import { ForbiddenException, UnauthorizedException } from "@nestjs/common";\nimport { jwtAuthorize } from "@samchon/autobe";\nimport { MyGlobal } from "~/MyGlobal";\nimport typia from "typia";\n\n/**\n * Provider function to authorize guest users for the discussion board.\n * Steps:\n * 1. JWT presence is NOT mandatory; attempts to extract session_id from headers/cookies.\n * 2. Validates that a guest session exists in the DB for the session_id.\n * 3. Throws UnauthorizedException if session_id missing or not found, or ForbiddenException if session is expired.\n * 4. Returns GuestPayload structure for injection into controller methods.\n */\nexport async function guestAuthorize(request: any): Promise<GuestPayload> {\n    // Try to get the session ID from cookies or authorization header\n    let sessionId: string | undefined = undefined;\n    if (request.cookies && request.cookies["guest_session_id"]) {\n        sessionId = request.cookies["guest_session_id"];\n    } else if (request.headers && request.headers["authorization"]) {\n        const auth = request.headers["authorization"];\n        if (typeof auth === "string" && auth.startsWith("Bearer ")) {\n            sessionId = auth.substring(7);\n        }\n    }\n    if (!sessionId) throw new UnauthorizedException("Guest session ID required");\n\n    // Lookup guest by session id\n    const guest = await MyGlobal.prisma.discussion_board_guests.findUnique({\n        where: { session_id: sessionId }\n    });\n    if (!guest) throw new UnauthorizedException("Invalid or expired guest session");\n\n    return {\n        id: guest.id,\n        type: "guest"\n    };\n}',
      },
    },
    {
      role: "member",
      decorator: {
        location: "src/decorators/MemberAuth.ts",
        name: "MemberAuth",
        content:
          'import { createParamDecorator, ExecutionContext } from "@nestjs/common";\nimport { SwaggerCustomizer } from "@teamtrufa/swagger-custom";\nimport { memberAuthorize } from "../providers";\nimport typia from "typia";\nimport { Singleton } from "tstl";\nimport { MemberPayload } from "../payloads";\n/**\n * MemberAuth: NestJS decorator for authenticating \'member\' role in discussion board\n * - Injects MemberPayload into controller method parameter\n * - Adds Bearer security to Swagger via SwaggerCustomizer\n */\nexport const MemberAuth: ParameterDecorator = Singleton.lock(() => {\n  SwaggerCustomizer.addBearer("Authorization");\n  return createParamDecorator(async (data, ctx: ExecutionContext): Promise<MemberPayload> => {\n    const req = ctx.switchToHttp().getRequest();\n    const authHeader: string | undefined = req.headers["authorization"];\n    return await memberAuthorize(authHeader);\n  })();\n});\n',
      },
      payload: {
        location: "src/decorators/payload/MemberPayload.ts",
        name: "MemberPayload",
        content:
          "import typia from \"typia\";\n/**\n * MemberPayload: Authenticated JWT payload injected for 'member' role\n * - id: UUID of the discussion_board_members row (NOT user_profile id)\n * - type: constant string 'member' as discriminator\n */\nexport interface MemberPayload {\n  /**\n   * Member row UUID (discussion_board_members.id)\n   * @format uuid\n   * @typia.Required\n   * @typia.Format(\"uuid\")\n   */\n  id: string;\n  /**\n   * Role discriminator (must be exact value 'member')\n   */\n  type: \"member\";\n}\n",
      },
      provider: {
        location: "src/providers/authorize/memberAuthorize.ts",
        name: "memberAuthorize",
        content:
          'import { ForbiddenException, UnauthorizedException } from "@nestjs/common";\nimport { jwtAuthorize } from "@teamtrufa/jwt-auth";\nimport typia from "typia";\nimport { MyGlobal } from "~/MyGlobal";\nimport { MemberPayload } from "./payloads";\n/**\n * memberAuthorize: JWT provider for \'member\' role in discussion board.\n * - Validates JWT token, enforces \'member\' role, checks DB for membership and account status.\n * - Returns the MemberPayload if successful; else throws Forbidden/Unauthorized.\n */\nexport const memberAuthorize = async (authHeader: string | undefined): Promise<MemberPayload> => {\n  if (!authHeader) throw new UnauthorizedException("No Authorization header");\n  const token = authHeader.replace(/^Bearer /, "");\n  const payload = await jwtAuthorize(token);\n  if (payload.type !== "member") throw new ForbiddenException("Not a member");\n  // Lookup membership is still active\n  const member = await MyGlobal.prisma.discussion_board_members.findFirst({\n    where: {\n      id: payload.id,\n      left_at: null,\n      member_user_profile: { is_active: true },\n    },\n    include: { member_user_profile: true }\n  });\n  if (!member) throw new ForbiddenException("No active member found");\n  return { id: member.id, type: "member" };\n};\n',
      },
    },
  ];

  const results: AutoBeRealizeAuthorization[] = await Promise.all(
    authorizations.map(async (authorization) => {
      return await orchestrateRealizeAuthorizationCorrect(
        ctx,
        authorization,
        prismaClients,
        templateFiles,
      );
    }),
  );

  const histories = agent.getHistories();

  const files: Record<string, string> = {
    ...InternalFileSystem.DEFAULT.map((key) => ({
      [key]: templateFiles[key],
    })).reduce((acc, cur) => Object.assign(acc, cur), {}),
    ...prismaClients,
    ...results.reduce(
      (acc, curr) => {
        acc[curr.decorator.location] = curr.decorator.content;
        acc[curr.payload.location] = curr.payload.content;
        acc[curr.provider.location] = curr.provider.content;
        return acc;
      },
      {} as Record<string, string>,
    ),
  };

  const model: string = TestGlobal.getVendorModel();
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/${model}/${project}/realize/authorization-correct`,
    files: {
      ...(await agent.getFiles()),
      ...files,
      "logs/events.json": JSON.stringify(events),
      "logs/result.json": JSON.stringify(authorizations),
      "logs/histories.json": JSON.stringify(histories),
    },
  });

  const compiler: IAutoBeCompiler = await ctx.compiler();
  const compiled = await compiler.typescript.compile({ files });

  if (compiled.type !== "success") {
    console.error(JSON.stringify(compiled, null, 2));
    throw new Error(JSON.stringify(compiled));
  }
};
