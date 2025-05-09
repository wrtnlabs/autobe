export interface IAutoBeTypeScriptCompilerProps {
  /**
   * List of TypeScript files.
   */
  files: Record<string, string>;

  /**
   * Prisma compiler output.
   */
  prisma?: Record<string, string>;

  /**
   * Package name of the SDK.
   *
   * @default @ORGANIZATION/PROJECT-api
   */
  package?: string;
}
