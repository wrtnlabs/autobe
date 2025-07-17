export interface AutoBeAnalyzeRole {
  /**
   * Role name representing user types that can authenticate via API. These are
   * user roles that can register and login to the service. This will be used as
   * reference when creating Prisma schema for user authentication.
   */
  name: string;

  /**
   * Description of what this user role can do in the system. Describes the
   * permissions and capabilities of this authenticated user type.
   */
  description: string;
}
