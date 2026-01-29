import { AutoBeDatabaseAuthorizationReviewProgrammer } from "@autobe/agent/src/orchestrate/prisma/programmers/AutoBeDatabaseAuthorizationReviewProgrammer";
import {
  AutoBeAnalyzeActor,
  AutoBeDatabaseComponent,
  AutoBeDatabaseComponentTableRevise,
} from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import { IValidation } from "@samchon/openapi";

export const test_database_authorization_review_programmer = (): void => {
  const actors: AutoBeAnalyzeActor[] = [
    { name: "user", kind: "member", description: "Regular user" },
    { name: "admin", kind: "admin", description: "Administrator" },
  ];

  const baseComponent: AutoBeDatabaseComponent = {
    kind: "authorization",
    namespace: "Actors",
    filename: "actors.prisma",
    thinking: "Authorization component",
    review: "",
    rationale: "Handles authentication",
    tables: [
      { name: "users", description: "User accounts" },
      { name: "user_sessions", description: "User sessions" },
      { name: "admins", description: "Admin accounts" },
      { name: "admin_sessions", description: "Admin sessions" },
    ],
  };

  // Test 1: validate - valid create revise
  {
    const revises: AutoBeDatabaseComponentTableRevise[] = [
      {
        type: "create",
        table: "user_profiles",
        description: "User profile details",
        reason: "Need profile storage",
      },
    ];
    const errors: IValidation.IError[] = [];

    AutoBeDatabaseAuthorizationReviewProgrammer.validate({
      errors,
      path: "$.revises",
      prefix: null,
      actors,
      revises,
      component: baseComponent,
    });

    TestValidator.equals("valid create should have no errors", errors.length, 0);
  }

  // Test 2: validate - create with non-actor prefix
  {
    const revises: AutoBeDatabaseComponentTableRevise[] = [
      {
        type: "create",
        table: "products",
        description: "Products table",
        reason: "Add products",
      },
    ];
    const errors: IValidation.IError[] = [];

    AutoBeDatabaseAuthorizationReviewProgrammer.validate({
      errors,
      path: "$.revises",
      prefix: null,
      actors,
      revises,
      component: baseComponent,
    });

    TestValidator.predicate(
      "non-actor table should add error",
      () => errors.some((e) => e.description?.includes("products") ?? false),
    );
  }

  // Test 3: validate - update to non-actor name
  {
    const revises: AutoBeDatabaseComponentTableRevise[] = [
      {
        type: "update",
        original: "user_profiles",
        updated: "profiles",
        description: "Renamed profiles",
        reason: "Simplify name",
      },
    ];
    const errors: IValidation.IError[] = [];

    AutoBeDatabaseAuthorizationReviewProgrammer.validate({
      errors,
      path: "$.revises",
      prefix: null,
      actors,
      revises,
      component: {
        ...baseComponent,
        tables: [
          ...baseComponent.tables,
          { name: "user_profiles", description: "User profiles" },
        ],
      },
    });

    TestValidator.predicate(
      "update to non-actor name should add error",
      () => errors.some((e) => e.description?.includes("profiles") ?? false),
    );
  }

  // Test 4: execute - create adds table
  {
    const revises: AutoBeDatabaseComponentTableRevise[] = [
      {
        type: "create",
        table: "user_profiles",
        description: "User profile details",
        reason: "Need profile storage",
      },
    ];

    const result = AutoBeDatabaseAuthorizationReviewProgrammer.execute({
      component: baseComponent,
      revises,
      actors,
      prefix: null,
    });

    TestValidator.equals("should have 5 tables after create", result.length, 5);
    TestValidator.predicate(
      "should include new table",
      () => result.some((t) => t.name === "user_profiles"),
    );
  }

  // Test 5: execute - erase removes table
  {
    const componentWithExtra: AutoBeDatabaseComponent = {
      ...baseComponent,
      tables: [
        ...baseComponent.tables,
        { name: "user_profiles", description: "User profiles" },
      ],
    };
    const revises: AutoBeDatabaseComponentTableRevise[] = [
      {
        type: "erase",
        table: "user_profiles",
        reason: "Not needed",
      },
    ];

    const result = AutoBeDatabaseAuthorizationReviewProgrammer.execute({
      component: componentWithExtra,
      revises,
      actors,
      prefix: null,
    });

    TestValidator.equals("should have 4 tables after erase", result.length, 4);
    TestValidator.predicate(
      "should not include erased table",
      () => result.every((t) => t.name !== "user_profiles"),
    );
  }

  // Test 6: execute - cannot erase core actor/session tables
  {
    const revises: AutoBeDatabaseComponentTableRevise[] = [
      {
        type: "erase",
        table: "users",
        reason: "Try to remove core table",
      },
    ];

    const result = AutoBeDatabaseAuthorizationReviewProgrammer.execute({
      component: baseComponent,
      revises,
      actors,
      prefix: null,
    });

    // Core tables should be protected
    TestValidator.predicate(
      "core actor table should still exist",
      () => result.some((t) => t.name === "users"),
    );
  }

  // Test 7: execute - update renames table
  {
    const componentWithExtra: AutoBeDatabaseComponent = {
      ...baseComponent,
      tables: [
        ...baseComponent.tables,
        { name: "user_profiles", description: "User profiles" },
      ],
    };
    const revises: AutoBeDatabaseComponentTableRevise[] = [
      {
        type: "update",
        original: "user_profiles",
        updated: "user_details",
        description: "User detail info",
        reason: "Better naming",
      },
    ];

    const result = AutoBeDatabaseAuthorizationReviewProgrammer.execute({
      component: componentWithExtra,
      revises,
      actors,
      prefix: null,
    });

    TestValidator.predicate(
      "should have renamed table",
      () => result.some((t) => t.name === "user_details"),
    );
    TestValidator.predicate(
      "original table should not exist",
      () => result.every((t) => t.name !== "user_profiles"),
    );
  }
};
