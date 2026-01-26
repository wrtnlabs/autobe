import { AutoBeDatabaseGroup } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { IValidation } from "typia";

export namespace AutoBeDatabaseGroupProgrammer {
  /**
   * Validates the group kind counts.
   *
   * Enforces the following rules:
   *
   * - Exactly 1 authorization group required
   * - At least 1 domain group required
   *
   * @param props Validation context with errors array and groups to validate
   */
  export const validate = (props: {
    errors: IValidation.IError[];
    path: string;
    groups: AutoBeDatabaseGroup[];
  }): void => {
    const authorizationGroups = props.groups.filter(
      (g) => g.kind === "authorization",
    );
    const domainGroups = props.groups.filter((g) => g.kind === "domain");

    // Validation: exactly 1 authorization group required
    if (authorizationGroups.length !== 1) {
      props.errors.push({
        path: props.path,
        expected: 'exactly 1 group with kind: "authorization"',
        value: authorizationGroups,
        description: StringUtil.trim`
          Found ${authorizationGroups.length} authorization group(s), but exactly 1 is required.

          All actor/authentication tables must be in a SINGLE authorization group.

          ${
            authorizationGroups.length === 0
              ? `Fix: Add one group with kind: "authorization" for actor tables (e.g., Actors namespace).`
              : `Fix: Merge all authorization groups into a single group. Current authorization groups: ${authorizationGroups.map((g) => `"${g.namespace}"`).join(", ")}`
          }
        `,
      });
    }

    // Validation: at least 1 domain group required
    if (domainGroups.length < 1) {
      props.errors.push({
        path: props.path,
        expected: 'at least 1 group with kind: "domain"',
        value: domainGroups,
        description: StringUtil.trim`
          Found ${domainGroups.length} domain group(s), but at least 1 is required.

          Business domain tables must be organized into domain groups.

          Fix: Add at least one group with kind: "domain" for business tables
          (e.g., Systematic, Products, Orders, Sales).
        `,
      });
    }
  };
}
