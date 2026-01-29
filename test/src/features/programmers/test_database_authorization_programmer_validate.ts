import { AutoBeDatabaseAuthorizationProgrammer } from "@autobe/agent/src/orchestrate/prisma/programmers/AutoBeDatabaseAuthorizationProgrammer";
import {
  AutoBeAnalyzeActor,
  AutoBeDatabaseComponentTableDesign,
} from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import { IValidation } from "@samchon/openapi";

export const test_database_authorization_programmer_validate = (): void => {
  const actors: AutoBeAnalyzeActor[] = [
    { name: "user", kind: "member", description: "Regular user" },
    { name: "admin", kind: "admin", description: "Administrator" },
  ];

  // Test 1: valid tables with all required actor and session tables
  {
    const tables: AutoBeDatabaseComponentTableDesign[] = [
      { name: "users", description: "User accounts" },
      { name: "user_sessions", description: "User sessions" },
      { name: "admins", description: "Admin accounts" },
      { name: "admin_sessions", description: "Admin sessions" },
    ];
    const errors: IValidation.IError[] = [];

    AutoBeDatabaseAuthorizationProgrammer.validate({
      errors,
      path: "$.tables",
      prefix: null,
      actors,
      tables,
    });

    TestValidator.equals("valid tables should have no errors", errors.length, 0);
  }

  // Test 2: missing actor table
  {
    const tables: AutoBeDatabaseComponentTableDesign[] = [
      { name: "user_sessions", description: "User sessions" },
      { name: "admins", description: "Admin accounts" },
      { name: "admin_sessions", description: "Admin sessions" },
    ];
    const errors: IValidation.IError[] = [];

    AutoBeDatabaseAuthorizationProgrammer.validate({
      errors,
      path: "$.tables",
      prefix: null,
      actors,
      tables,
    });

    TestValidator.predicate(
      "missing user table should add error",
      () => errors.some((e) => e.description?.includes("users") ?? false),
    );
  }

  // Test 3: missing session table
  {
    const tables: AutoBeDatabaseComponentTableDesign[] = [
      { name: "users", description: "User accounts" },
      { name: "admins", description: "Admin accounts" },
      { name: "admin_sessions", description: "Admin sessions" },
    ];
    const errors: IValidation.IError[] = [];

    AutoBeDatabaseAuthorizationProgrammer.validate({
      errors,
      path: "$.tables",
      prefix: null,
      actors,
      tables,
    });

    TestValidator.predicate(
      "missing session table should add error",
      () => errors.some((e) => e.description?.includes("user_sessions") ?? false),
    );
  }

  // Test 4: table not starting with actor name
  {
    const tables: AutoBeDatabaseComponentTableDesign[] = [
      { name: "users", description: "User accounts" },
      { name: "user_sessions", description: "User sessions" },
      { name: "admins", description: "Admin accounts" },
      { name: "admin_sessions", description: "Admin sessions" },
      { name: "products", description: "Products table" }, // invalid
    ];
    const errors: IValidation.IError[] = [];

    AutoBeDatabaseAuthorizationProgrammer.validate({
      errors,
      path: "$.tables",
      prefix: null,
      actors,
      tables,
    });

    TestValidator.predicate(
      "non-actor table should add error",
      () => errors.some((e) => e.description?.includes("products") ?? false),
    );
  }

  // Test 5: with prefix
  {
    const tables: AutoBeDatabaseComponentTableDesign[] = [
      { name: "mv_users", description: "User accounts" },
      { name: "mv_user_sessions", description: "User sessions" },
      { name: "mv_admins", description: "Admin accounts" },
      { name: "mv_admin_sessions", description: "Admin sessions" },
    ];
    const errors: IValidation.IError[] = [];

    AutoBeDatabaseAuthorizationProgrammer.validate({
      errors,
      path: "$.tables",
      prefix: "mv",
      actors,
      tables,
    });

    TestValidator.equals("prefixed tables should be valid", errors.length, 0);
  }

  // Test 6: prefix required but missing
  {
    const tables: AutoBeDatabaseComponentTableDesign[] = [
      { name: "users", description: "User accounts" },
      { name: "user_sessions", description: "User sessions" },
      { name: "admins", description: "Admin accounts" },
      { name: "admin_sessions", description: "Admin sessions" },
    ];
    const errors: IValidation.IError[] = [];

    AutoBeDatabaseAuthorizationProgrammer.validate({
      errors,
      path: "$.tables",
      prefix: "mv",
      actors,
      tables,
    });

    TestValidator.predicate(
      "missing prefix should add errors",
      () => errors.length > 0,
    );
  }

  // Test 7: singular table names should be pluralized
  {
    const tables: AutoBeDatabaseComponentTableDesign[] = [
      { name: "user", description: "User accounts" },
      { name: "user_session", description: "User sessions" },
      { name: "admin", description: "Admin accounts" },
      { name: "admin_session", description: "Admin sessions" },
    ];
    const errors: IValidation.IError[] = [];

    AutoBeDatabaseAuthorizationProgrammer.validate({
      errors,
      path: "$.tables",
      prefix: null,
      actors,
      tables,
    });

    // After validation, names should be pluralized
    TestValidator.equals("table names should be pluralized", tables[0].name, "users");
    TestValidator.equals("session table names should be pluralized", tables[1].name, "user_sessions");
  }
};
