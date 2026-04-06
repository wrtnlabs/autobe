import {
  extractDidYouMeanHints,
  generateMissingPropertyHints,
  generateTS2339Hints,
} from "@autobe/agent/src/orchestrate/realize/utils/generateTS2339Hints";
import { printErrorHints } from "@autobe/agent/src/orchestrate/realize/utils/printErrorHints";
import { IAutoBeTypeScriptCompileResult } from "@autobe/interface";

const CODE = `export async function postRedditCloneAuthModeratorJoin(props: {
  ip: string;
  body: IRedditCloneModerator.IJoin;
}): Promise<IRedditCloneModerator.IAuthorized> {
  // 1. Check if email already exists
  const existing = await MyGlobal.prisma.reddit_clone_moderators.findFirst({
    where: {
      email: props.body.email,
      deleted_at: null,
    },
  });
  if (existing) {
    throw new HttpException("Email already registered", 409);
  }
  // 2. Hash password
  const passwordHash = await PasswordUtil.hash(props.body.password);
  // 3. Create user profile first (moderator-only, omit reddit_clone_member_id entirely)
  const now = new Date();
  const userProfile = await MyGlobal.prisma.reddit_clone_user_profiles.create({
    data: {
      id: v4(),
      display_name: props.body.display_name,
      bio: props.body.bio ?? null,
      avatar: props.body.avatar ?? null,
      karma: 0,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    } satisfies Prisma.reddit_clone_user_profilesUncheckedCreateInput,
    ...RedditCloneUserProfileAtSummaryTransformer.select(),
  });
  // 4. Create moderator with user profile FK
  const moderator = await MyGlobal.prisma.reddit_clone_moderators.create({
    data: {
      id: v4(),
      email: props.body.email,
      password_hash: passwordHash,
      created_at: now,
      updated_at: now,
      deleted_at: null,
      reddit_clone_user_profile_id: userProfile.id,
    } satisfies Prisma.reddit_clone_moderatorsUncheckedCreateInput,
    select: {
      id: true,
      email: true,
      reddit_clone_user_profile_id: true,
      created_at: true,
      updated_at: true,
      deleted_at: true,
      userProfile: RedditCloneUserProfileAtSummaryTransformer.select(),
    },
  });
  // 5. Create session
  const accessExpires = new Date(Date.now() + 15 * 60 * 1000);
  const refreshExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = await MyGlobal.prisma.reddit_clone_moderator_sessions.create({
    data: {
      id: v4(),
      reddit_clone_moderator_id: moderator.id,
      ip: props.ip,
      href: props.body.href,
      referrer: props.body.referrer,
      created_at: now,
      expired_at: refreshExpires,
    },
  });
  // 6. Generate JWT tokens
  const token: IAuthorizationToken = {
    access: jwt.sign(
      {
        type: "moderator",
        id: moderator.id,
        session_id: session.id,
        created_at: toISOStringSafe(now),
      },
      MyGlobal.env.JWT_SECRET_KEY,
      { expiresIn: "15m", issuer: "autobe" },
    ),
    refresh: jwt.sign(
      {
        type: "moderator",
        id: moderator.id,
        session_id: session.id,
        tokenType: "refresh",
        created_at: toISOStringSafe(now),
      },
      MyGlobal.env.JWT_SECRET_KEY,
      { expiresIn: "7d", issuer: "autobe" },
    ),
    expired_at: toISOStringSafe(accessExpires),
    refreshable_until: toISOStringSafe(refreshExpires),
  };
  // 7. Return IAuthorized
  return {
    id: moderator.id,
    email: moderator.email,
    reddit_clone_user_profile_id: moderator.reddit_clone_user_profile_id,
    created_at: toISOStringSafe(moderator.created_at),
    updated_at: toISOStringSafe(moderator.updated_at),
    deleted_at: moderator.deleted_at
      ? toISOStringSafe(moderator.deleted_at)
      : null,
    userProfile: await RedditCloneUserProfileAtSummaryTransformer.transform(
      moderator.userProfile,
    ),
    token,
  };
}`;

const computeStart = (code: string, line: number, col: number): number => {
  const lines = code.split("\n");
  let pos = 0;
  for (let i = 0; i < line - 1 && i < lines.length; i++) {
    pos += lines[i]!.length + 1;
  }
  return pos + col - 1;
};

const DIAGNOSTICS: IAutoBeTypeScriptCompileResult.IDiagnostic[] = [
  {
    file: "src/providers/postRedditCloneAuthModeratorJoin.ts",
    category: "error",
    code: 2322,
    start: computeStart(CODE, 20, 5), // "data: {" (line 20 in CODE = line 36 in original)
    length: 4,
    messageText:
      "Type '{ id: string; display_name: string & tags.MinLength<1>; bio: string | null; avatar: (string & tags.MaxLength<80000> & tags.Format<\"url\">) | null; karma: number; created_at: Date; updated_at: Date; deleted_at: null; }' is not assignable to type '(Without<reddit_clone_user_profilesCreateInput, reddit_clone_user_profilesUncheckedCreateInput> & reddit_clone_user_profilesUncheckedCreateInput) | (Without<...> & reddit_clone_user_profilesCreateInput)'.\n  Type '{ id: string; display_name: string & tags.MinLength<1>; bio: string | null; avatar: (string & tags.MaxLength<80000> & tags.Format<\"url\">) | null; karma: number; created_at: Date; updated_at: Date; deleted_at: null; }' is not assignable to type 'Without<reddit_clone_user_profilesUncheckedCreateInput, reddit_clone_user_profilesCreateInput> & reddit_clone_user_profilesCreateInput'.\n    Property 'member' is missing in type '{ id: string; display_name: string & tags.MinLength<1>; bio: string | null; avatar: (string & tags.MaxLength<80000> & tags.Format<\"url\">) | null; karma: number; created_at: Date; updated_at: Date; deleted_at: null; }' but required in type 'reddit_clone_user_profilesCreateInput'.",
  },
  {
    file: "src/providers/postRedditCloneAuthModeratorJoin.ts",
    category: "error",
    code: 1360,
    start: computeStart(CODE, 29, 7), // "} satisfies" (line 29 in CODE = line 45 in original)
    length: 9,
    messageText:
      "Type '{ id: string; display_name: string & tags.MinLength<1>; bio: string | null; avatar: (string & tags.MaxLength<80000> & tags.Format<\"url\">) | null; karma: number; created_at: Date; updated_at: Date; deleted_at: null; }' does not satisfy the expected type 'reddit_clone_user_profilesUncheckedCreateInput'.\n  Property 'reddit_clone_member_id' is missing in type '{ id: string; display_name: string & tags.MinLength<1>; bio: string | null; avatar: (string & tags.MaxLength<80000> & tags.Format<\"url\">) | null; karma: number; created_at: Date; updated_at: Date; deleted_at: null; }' but required in type 'reddit_clone_user_profilesUncheckedCreateInput'.",
  },
];

const main = (): void => {
  console.log("=== Error Annotated Code ===");
  console.log(printErrorHints(CODE, DIAGNOSTICS));

  const ts2339 = generateTS2339Hints(DIAGNOSTICS);
  if (ts2339) {
    console.log("\n=== TS2339 Hints ===");
    console.log(ts2339);
  }

  const missingProp = generateMissingPropertyHints(DIAGNOSTICS);
  if (missingProp) {
    console.log("\n=== Missing Property Hints ===");
    console.log(missingProp);
  }

  const didYouMean = extractDidYouMeanHints(DIAGNOSTICS);
  if (didYouMean.length > 0) {
    console.log("\n=== Did You Mean Hints ===");
    didYouMean.forEach((h) =>
      console.log(`- Replace \`${h.wrong}\` with \`${h.suggested}\``),
    );
  }
};
main();
