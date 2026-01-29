import { AutoBeDatabaseComponentReviewProgrammer } from "@autobe/agent/src/orchestrate/prisma/programmers/AutoBeDatabaseComponentReviewProgrammer";
import {
  AutoBeDatabaseComponent,
  AutoBeDatabaseComponentTableRevise,
} from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import { IValidation } from "@samchon/openapi";

export const test_database_component_review_programmer = (): void => {
  const baseComponent: AutoBeDatabaseComponent = {
    kind: "domain",
    namespace: "Products",
    filename: "products.prisma",
    thinking: "Product domain",
    review: "",
    rationale: "Product management",
    tables: [
      { name: "products", description: "Product catalog" },
      { name: "categories", description: "Product categories" },
      { name: "product_reviews", description: "Product reviews" },
    ],
  };

  // Test 1: validate - create revise
  {
    const revises: AutoBeDatabaseComponentTableRevise[] = [
      {
        type: "create",
        table: "mv_tags",
        description: "Product tags",
        reason: "Need tagging",
      },
    ];
    const errors: IValidation.IError[] = [];

    AutoBeDatabaseComponentReviewProgrammer.validate({
      errors,
      path: "$.revises",
      prefix: "mv",
      revises,
      component: baseComponent,
    });

    TestValidator.equals("valid create should have no errors", errors.length, 0);
  }

  // Test 2: validate - create without required prefix
  {
    const revises: AutoBeDatabaseComponentTableRevise[] = [
      {
        type: "create",
        table: "tags",
        description: "Product tags",
        reason: "Need tagging",
      },
    ];
    const errors: IValidation.IError[] = [];

    AutoBeDatabaseComponentReviewProgrammer.validate({
      errors,
      path: "$.revises",
      prefix: "mv",
      revises,
      component: baseComponent,
    });

    TestValidator.equals("missing prefix should add error", errors.length, 1);
  }

  // Test 3: validate - erase non-existent table
  {
    const revises: AutoBeDatabaseComponentTableRevise[] = [
      {
        type: "erase",
        table: "non_existent",
        reason: "Remove unused",
      },
    ];
    const errors: IValidation.IError[] = [];

    AutoBeDatabaseComponentReviewProgrammer.validate({
      errors,
      path: "$.revises",
      prefix: null,
      revises,
      component: baseComponent,
    });

    TestValidator.equals("erase non-existent should add error", errors.length, 1);
    TestValidator.predicate(
      "error should mention table does not exist",
      () => errors[0].description?.includes("does not exist") ?? false,
    );
  }

  // Test 4: validate - update non-existent original
  {
    const revises: AutoBeDatabaseComponentTableRevise[] = [
      {
        type: "update",
        original: "non_existent",
        updated: "new_table",
        description: "Renamed table",
        reason: "Better naming",
      },
    ];
    const errors: IValidation.IError[] = [];

    AutoBeDatabaseComponentReviewProgrammer.validate({
      errors,
      path: "$.revises",
      prefix: null,
      revises,
      component: baseComponent,
    });

    TestValidator.equals("update non-existent should add error", errors.length, 1);
  }

  // Test 5: validate - pluralizes table names
  {
    const revises: AutoBeDatabaseComponentTableRevise[] = [
      {
        type: "create",
        table: "tag",
        description: "Product tags",
        reason: "Need tagging",
      },
    ];
    const errors: IValidation.IError[] = [];

    AutoBeDatabaseComponentReviewProgrammer.validate({
      errors,
      path: "$.revises",
      prefix: null,
      revises,
      component: baseComponent,
    });

    const createRevise = revises[0] as { type: "create"; table: string };
    TestValidator.equals("table should be pluralized", createRevise.table, "tags");
  }

  // Test 6: execute - create adds table
  {
    const revises: AutoBeDatabaseComponentTableRevise[] = [
      {
        type: "create",
        table: "tags",
        description: "Product tags",
        reason: "Need tagging",
      },
    ];

    const result = AutoBeDatabaseComponentReviewProgrammer.execute({
      component: baseComponent,
      revises,
    });

    TestValidator.equals("should have 4 tables after create", result.length, 4);
    TestValidator.predicate(
      "should include new table",
      () => result.some((t) => t.name === "tags"),
    );
  }

  // Test 7: execute - erase removes table
  {
    const revises: AutoBeDatabaseComponentTableRevise[] = [
      {
        type: "erase",
        table: "product_reviews",
        reason: "Not needed",
      },
    ];

    const result = AutoBeDatabaseComponentReviewProgrammer.execute({
      component: baseComponent,
      revises,
    });

    TestValidator.equals("should have 2 tables after erase", result.length, 2);
    TestValidator.predicate(
      "should not include erased table",
      () => result.every((t) => t.name !== "product_reviews"),
    );
  }

  // Test 8: execute - update renames table
  {
    const revises: AutoBeDatabaseComponentTableRevise[] = [
      {
        type: "update",
        original: "product_reviews",
        updated: "product_feedbacks",
        description: "Product feedback",
        reason: "Better naming",
      },
    ];

    const result = AutoBeDatabaseComponentReviewProgrammer.execute({
      component: baseComponent,
      revises,
    });

    TestValidator.equals("should have 3 tables after update", result.length, 3);
    TestValidator.predicate(
      "should have renamed table",
      () => result.some((t) => t.name === "product_feedbacks"),
    );
    TestValidator.predicate(
      "original should not exist",
      () => result.every((t) => t.name !== "product_reviews"),
    );
  }

  // Test 9: execute - multiple revises
  {
    const revises: AutoBeDatabaseComponentTableRevise[] = [
      {
        type: "create",
        table: "tags",
        description: "Product tags",
        reason: "Need tagging",
      },
      {
        type: "erase",
        table: "product_reviews",
        reason: "Not needed",
      },
      {
        type: "update",
        original: "categories",
        updated: "product_categories",
        description: "Product categories",
        reason: "Better naming",
      },
    ];

    const result = AutoBeDatabaseComponentReviewProgrammer.execute({
      component: baseComponent,
      revises,
    });

    TestValidator.equals("should have 3 tables after multiple revises", result.length, 3);
    TestValidator.predicate(
      "should have tags",
      () => result.some((t) => t.name === "tags"),
    );
    TestValidator.predicate(
      "should have product_categories",
      () => result.some((t) => t.name === "product_categories"),
    );
    TestValidator.predicate(
      "should not have product_reviews",
      () => result.every((t) => t.name !== "product_reviews"),
    );
  }
};
