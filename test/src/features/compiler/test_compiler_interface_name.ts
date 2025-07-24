import { AutoBeCompiler } from "@autobe/compiler";
import { AutoBeOpenApi } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import { TestFactory } from "../../TestFactory";

export const test_compiler_interface_name = async (
  factory: TestFactory,
): Promise<void> => {
  const compiler: AutoBeCompiler = factory.createCompiler();
  const result: Record<string, string> =
    await compiler.interface.write(DOCUMENT);
  const content: string =
    result["src/controllers/shopping/sale/ShoppingSaleController.ts"];
  TestValidator.predicate("method name")(() =>
    content.includes("public async at("),
  );
};

const DOCUMENT: AutoBeOpenApi.IDocument = {
  operations: [
    {
      ...typia.random<AutoBeOpenApi.IOperation>(),
      name: "at",
      method: "get",
      path: "/shopping/sale/{id}",
      parameters: [
        {
          name: "id",
          description: "Sale ID",
          schema: {
            type: "string",
            format: "uuid",
          },
        },
      ],
      requestBody: null,
      responseBody: null,
    },
  ],
  components: {
    schemas: {},
    authorization: [],
  },
};
