import { AutoBeDatabaseComponentProgrammer } from "@autobe/agent/src/orchestrate/prisma/programmers/AutoBeDatabaseComponentProgrammer";
import {
  AutoBeDatabaseComponent,
  AutoBeDatabaseComponentTableDesign,
} from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import { IValidation } from "@samchon/openapi";

export const test_database_component_programmer = (): void => {
  // Test 1: validate - no prefix required
  {
    const tables: AutoBeDatabaseComponentTableDesign[] = [
      { name: "products", description: "Product catalog" },
      { name: "categories", description: "Product categories" },
    ];
    const errors: IValidation.IError[] = [];

    AutoBeDatabaseComponentProgrammer.validate({
      errors,
      path: "$.tables",
      prefix: null,
      tables,
    });

    TestValidator.equals("no prefix should have no errors", errors.length, 0);
  }

  // Test 2: validate - prefix required and present
  {
    const tables: AutoBeDatabaseComponentTableDesign[] = [
      { name: "mv_products", description: "Product catalog" },
      { name: "mv_categories", description: "Product categories" },
    ];
    const errors: IValidation.IError[] = [];

    AutoBeDatabaseComponentProgrammer.validate({
      errors,
      path: "$.tables",
      prefix: "mv",
      tables,
    });

    TestValidator.equals("valid prefix should have no errors", errors.length, 0);
  }

  // Test 3: validate - prefix required but missing
  {
    const tables: AutoBeDatabaseComponentTableDesign[] = [
      { name: "products", description: "Product catalog" },
      { name: "mv_categories", description: "Product categories" },
    ];
    const errors: IValidation.IError[] = [];

    AutoBeDatabaseComponentProgrammer.validate({
      errors,
      path: "$.tables",
      prefix: "mv",
      tables,
    });

    TestValidator.equals("missing prefix should add error", errors.length, 1);
    TestValidator.predicate(
      "error should mention prefix",
      () => errors[0].description?.includes("mv_") ?? false,
    );
  }

  // Test 4: validate - pluralizes table names
  {
    const tables: AutoBeDatabaseComponentTableDesign[] = [
      { name: "product", description: "Product catalog" },
      { name: "category", description: "Product categories" },
    ];
    const errors: IValidation.IError[] = [];

    AutoBeDatabaseComponentProgrammer.validate({
      errors,
      path: "$.tables",
      prefix: null,
      tables,
    });

    TestValidator.equals("table should be pluralized", tables[0].name, "products");
    TestValidator.equals("table should be pluralized", tables[1].name, "categories");
  }

  // Test 5: removeDuplicatedTable - removes duplicates within component
  {
    const components: AutoBeDatabaseComponent[] = [
      {
        kind: "domain",
        namespace: "Products",
        filename: "products.prisma",
        thinking: "Product domain",
        review: "",
        rationale: "Product management",
        tables: [
          { name: "products", description: "Products" },
          { name: "products", description: "Duplicate products" },
          { name: "categories", description: "Categories" },
        ],
      },
    ];

    const result = AutoBeDatabaseComponentProgrammer.removeDuplicatedTable(components);

    TestValidator.equals("should have 1 component", result.length, 1);
    TestValidator.equals("should have 2 tables", result[0].tables.length, 2);
  }

  // Test 6: removeDuplicatedTable - removes duplicates across components
  {
    const components: AutoBeDatabaseComponent[] = [
      {
        kind: "domain",
        namespace: "Products",
        filename: "products.prisma",
        thinking: "Product domain",
        review: "",
        rationale: "Product management",
        tables: [
          { name: "products", description: "Products" },
          { name: "categories", description: "Categories" },
        ],
      },
      {
        kind: "domain",
        namespace: "Inventory",
        filename: "inventory.prisma",
        thinking: "Inventory domain",
        review: "",
        rationale: "Inventory management",
        tables: [
          { name: "products", description: "Duplicate products" },
          { name: "warehouses", description: "Warehouses" },
        ],
      },
    ];

    const result = AutoBeDatabaseComponentProgrammer.removeDuplicatedTable(components);

    // Products should only appear in one component
    const allTables = result.flatMap((c) => c.tables.map((t) => t.name));
    const productCount = allTables.filter((n) => n === "products").length;

    TestValidator.equals("products should appear only once", productCount, 1);
  }

  // Test 7: removeDuplicatedTable - removes empty components
  {
    const components: AutoBeDatabaseComponent[] = [
      {
        kind: "domain",
        namespace: "Products",
        filename: "products.prisma",
        thinking: "Product domain",
        review: "",
        rationale: "Product management",
        tables: [{ name: "products", description: "Products" }],
      },
      {
        kind: "domain",
        namespace: "Empty",
        filename: "empty.prisma",
        thinking: "Empty domain",
        review: "",
        rationale: "Should be removed",
        tables: [{ name: "products", description: "Duplicate" }],
      },
    ];

    const result = AutoBeDatabaseComponentProgrammer.removeDuplicatedTable(components);

    // Empty component should be filtered out
    TestValidator.predicate(
      "empty components should be removed",
      () => result.every((c) => c.tables.length > 0),
    );
  }

  // Test 8: removeDuplicatedTable - keeps smaller component's table
  {
    const components: AutoBeDatabaseComponent[] = [
      {
        kind: "domain",
        namespace: "Large",
        filename: "large.prisma",
        thinking: "Large domain",
        review: "",
        rationale: "Large component",
        tables: [
          { name: "shared", description: "Shared table" },
          { name: "table1", description: "Table 1" },
          { name: "table2", description: "Table 2" },
        ],
      },
      {
        kind: "domain",
        namespace: "Small",
        filename: "small.prisma",
        thinking: "Small domain",
        review: "",
        rationale: "Small component",
        tables: [{ name: "shared", description: "Shared duplicate" }],
      },
    ];

    const result = AutoBeDatabaseComponentProgrammer.removeDuplicatedTable(components);

    // Smaller component gets the shared table
    const smallComponent = result.find((c) => c.namespace === "Small");
    TestValidator.predicate(
      "smaller component should have shared table",
      () => smallComponent?.tables.some((t) => t.name === "shared") ?? false,
    );
  }
};
