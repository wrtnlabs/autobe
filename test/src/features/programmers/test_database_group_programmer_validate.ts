import { AutoBeDatabaseGroupProgrammer } from "@autobe/agent/src/orchestrate/prisma/programmers/AutoBeDatabaseGroupProgrammer";
import { AutoBeDatabaseGroup } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import { IValidation } from "@samchon/openapi";

export const test_database_group_programmer_validate = (): void => {
  // Test 1: valid groups - 1 authorization + 1 domain
  {
    const groups: AutoBeDatabaseGroup[] = [
      {
        kind: "authorization",
        namespace: "Actors",
        filename: "actors.prisma",
        thinking: "Authorization group",
        review: "",
        rationale: "Handles authentication",
      },
      {
        kind: "domain",
        namespace: "Products",
        filename: "products.prisma",
        thinking: "Product domain",
        review: "",
        rationale: "Product management",
      },
    ];
    const errors: IValidation.IError[] = [];

    AutoBeDatabaseGroupProgrammer.validate({
      errors,
      path: "$.groups",
      groups,
    });

    TestValidator.equals("valid groups should have no errors", errors.length, 0);
  }

  // Test 2: missing authorization group
  {
    const groups: AutoBeDatabaseGroup[] = [
      {
        kind: "domain",
        namespace: "Products",
        filename: "products.prisma",
        thinking: "Product domain",
        review: "",
        rationale: "Product management",
      },
    ];
    const errors: IValidation.IError[] = [];

    AutoBeDatabaseGroupProgrammer.validate({
      errors,
      path: "$.groups",
      groups,
    });

    TestValidator.equals("missing authorization should add error", errors.length, 1);
    TestValidator.predicate(
      "error should mention authorization",
      () => errors[0].description?.includes("authorization") ?? false,
    );
  }

  // Test 3: multiple authorization groups
  {
    const groups: AutoBeDatabaseGroup[] = [
      {
        kind: "authorization",
        namespace: "Actors",
        filename: "actors.prisma",
        thinking: "First authorization",
        review: "",
        rationale: "First auth",
      },
      {
        kind: "authorization",
        namespace: "Users",
        filename: "users.prisma",
        thinking: "Second authorization",
        review: "",
        rationale: "Second auth",
      },
      {
        kind: "domain",
        namespace: "Products",
        filename: "products.prisma",
        thinking: "Product domain",
        review: "",
        rationale: "Product management",
      },
    ];
    const errors: IValidation.IError[] = [];

    AutoBeDatabaseGroupProgrammer.validate({
      errors,
      path: "$.groups",
      groups,
    });

    TestValidator.equals("multiple authorization should add error", errors.length, 1);
    TestValidator.predicate(
      "error should mention merge",
      () => errors[0].description?.includes("Merge") ?? false,
    );
  }

  // Test 4: missing domain group
  {
    const groups: AutoBeDatabaseGroup[] = [
      {
        kind: "authorization",
        namespace: "Actors",
        filename: "actors.prisma",
        thinking: "Authorization group",
        review: "",
        rationale: "Handles authentication",
      },
    ];
    const errors: IValidation.IError[] = [];

    AutoBeDatabaseGroupProgrammer.validate({
      errors,
      path: "$.groups",
      groups,
    });

    TestValidator.equals("missing domain should add error", errors.length, 1);
    TestValidator.predicate(
      "error should mention domain",
      () => errors[0].description?.includes("domain") ?? false,
    );
  }

  // Test 5: no groups at all
  {
    const groups: AutoBeDatabaseGroup[] = [];
    const errors: IValidation.IError[] = [];

    AutoBeDatabaseGroupProgrammer.validate({
      errors,
      path: "$.groups",
      groups,
    });

    TestValidator.equals("empty groups should have 2 errors", errors.length, 2);
  }

  // Test 6: multiple domain groups (valid)
  {
    const groups: AutoBeDatabaseGroup[] = [
      {
        kind: "authorization",
        namespace: "Actors",
        filename: "actors.prisma",
        thinking: "Authorization group",
        review: "",
        rationale: "Handles authentication",
      },
      {
        kind: "domain",
        namespace: "Products",
        filename: "products.prisma",
        thinking: "Product domain",
        review: "",
        rationale: "Product management",
      },
      {
        kind: "domain",
        namespace: "Orders",
        filename: "orders.prisma",
        thinking: "Order domain",
        review: "",
        rationale: "Order management",
      },
    ];
    const errors: IValidation.IError[] = [];

    AutoBeDatabaseGroupProgrammer.validate({
      errors,
      path: "$.groups",
      groups,
    });

    TestValidator.equals("multiple domains should be valid", errors.length, 0);
  }
};
