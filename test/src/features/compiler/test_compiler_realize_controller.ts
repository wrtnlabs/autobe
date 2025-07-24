import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeOpenApi,
  AutoBeRealizeDecoratorPayload,
  IAutoBeCompiler,
} from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import { TestFactory } from "../../TestFactory";
import { TestGlobal } from "../../TestGlobal";

export const test_compiler_realize_controller = async (
  factory: TestFactory,
): Promise<void> => {
  const compiler: IAutoBeCompiler = factory.createCompiler();
  const files: Record<string, string> = await compiler.realize.controller({
    document,
    functions: [
      {
        name: "createShoppingSale",
        location: "src/providers/createShoppingSale.ts",
        content: "",
        role: "customer",
        endpoint: {
          method: "post",
          path: "/shopping/sale",
        },
      },
    ],
    decorators: [
      {
        name: "CustomerAuth",
        location: "src/decorators/CustomerAuth.ts",
        role: "customer",
        payload: typia.random<AutoBeRealizeDecoratorPayload>(),
      },
    ],
  });
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/compiler/realize/controller`,
    files,
  });

  const content: string | undefined =
    files["src/controllers/shopping/sale/ShoppingSaleController.ts"];
  TestValidator.predicate("content")(
    () =>
      content !== undefined &&
      content.includes(
        `import { createShoppingSale } from "../../../providers/createShoppingSale"`,
      ) &&
      content.includes(
        `import { CustomerAuth } from "../../../decorators/CustomerAuth"`,
      ) &&
      content.includes("@CustomerAuth()") &&
      content.includes("return createShoppingSale(customer, body)"),
  );
};

const document: AutoBeOpenApi.IDocument = {
  operations: [
    {
      ...typia.random<AutoBeOpenApi.IOperation>(),
      name: "create",
      method: "post",
      path: "/shopping/sale",
      parameters: [],
      requestBody: {
        typeName: "IShoppingSale.ICreate",
        description: "A shopping sale to create.",
      },
      responseBody: {
        typeName: "IShoppingSale",
        description: "Created shopping sale.",
      },
    },
  ],
  components: {
    schemas: {
      "IShoppingSale.ICreate": {
        type: "object",
        properties: {},
        required: [],
        ...{
          description: "Create information of shopping sale.",
        },
      } satisfies AutoBeOpenApi.IJsonSchema.IObject as AutoBeOpenApi.IJsonSchemaDescriptive<AutoBeOpenApi.IJsonSchema.IObject>,
      IShoppingSale: {
        type: "object",
        properties: {},
        required: [],
        ...{
          description: "Information of shopping sale.",
        },
      } satisfies AutoBeOpenApi.IJsonSchema.IObject as AutoBeOpenApi.IJsonSchemaDescriptive<AutoBeOpenApi.IJsonSchema.IObject>,
    },
    authorization: [
      {
        name: "customer",
        description: "Customer Authorization",
      },
    ],
  },
};
