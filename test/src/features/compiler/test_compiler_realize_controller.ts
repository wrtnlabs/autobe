import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeOpenApi,
  AutoBeRealizeAuthorization,
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
        endpoint: {
          method: "post",
          path: "/shopping/sale",
        },
      },
    ],
    authorizations: [
      {
        role: "customer",
        decorator: {
          name: "CustomerAuth",
          location: "src/decorators/CustomerAuth.ts",
          content: "",
        },
        payload: {
          name: "ICustomerPayload",
          location: "src/decorators/payload/ICustomerPayload.ts",
          content: "",
        },
        provider: {
          name: "customerAuthorize",
          location: "src/providers/customerAuthorize.ts",
          content: "",
        },
      } satisfies AutoBeRealizeAuthorization,
    ],
  });
  await FileSystemIterator.save({
    root: `${TestGlobal.ROOT}/results/compiler/realize/controller`,
    files,
  });

  const content: string | undefined =
    files["src/controllers/shopping/sale/ShoppingSaleController.ts"];

  TestValidator.predicate("content is defined")(() => content !== undefined);

  TestValidator.predicate("content import shoppingSale")(() =>
    content.includes(
      `import { createShoppingSale } from "../../../providers/createShoppingSale"`,
    ),
  );

  TestValidator.predicate("content import Authentication")(() =>
    content.includes(
      `import { CustomerAuth } from "../../../decorators/CustomerAuth"`,
    ),
  );

  TestValidator.predicate("content import payload")(() =>
    content.includes(
      `import { ICustomerPayload } from "../../../decorators/payload/ICustomerPayload"`,
    ),
  );

  TestValidator.predicate("content includes customer auth")(() =>
    content.includes("@CustomerAuth()"),
  );

  TestValidator.predicate("content includes custom payload")(() =>
    content.includes("customer: ICustomerPayload"),
  );

  TestValidator.predicate("content includes createShoppingSale")(() =>
    content.includes("return createShoppingSale({"),
  );

  TestValidator.predicate("content includes customer")(() =>
    content.includes("customer,"),
  );

  TestValidator.predicate("content includes body")(() =>
    content.includes("body\n"),
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
      authorizationRole: "customer",
    },
  ],
  components: {
    schemas: {
      IShoppingCustomer: {
        type: "object",
        properties: {},
        required: [],
        ...{
          description: "Information of shopping customer.",
        },
      } satisfies AutoBeOpenApi.IJsonSchema.IObject as AutoBeOpenApi.IJsonSchemaDescriptive<AutoBeOpenApi.IJsonSchema.IObject>,
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
