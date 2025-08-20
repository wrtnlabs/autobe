import { AutoBeOpenApi, IAutoBeCompiler } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import { HttpMigration, IHttpMigrateApplication } from "@samchon/openapi";
import typia from "typia";

import { TestFactory } from "../../TestFactory";

export const test_compiler_interface_accessor = async (
  factory: TestFactory,
): Promise<void> => {
  const compiler: IAutoBeCompiler = await factory.createCompiler();
  const migrate: IHttpMigrateApplication = HttpMigration.application(
    await compiler.interface.transform(DOCUMENT),
  );
  TestValidator.equals("accessor")(
    migrate.routes.map((r) => r.accessor.join(".")).sort(),
  )(
    [
      "shopping.customer.authenticate.join",
      "shopping.customer.authenticate.token.refresh",
    ].sort(),
  );
};

const DOCUMENT: AutoBeOpenApi.IDocument = {
  operations: [
    {
      ...typia.random<AutoBeOpenApi.IOperation>(),
      name: "join",
      method: "post",
      path: "/shopping/customer/authenticate/join",
      parameters: [],
      requestBody: null,
      responseBody: null,
    },
    {
      ...typia.random<AutoBeOpenApi.IOperation>(),
      name: "refresh",
      method: "get",
      path: "/shopping/customer/authenticate/token",
      parameters: [],
      requestBody: null,
      responseBody: null,
    },
  ],
  components: {
    schemas: {},
    authorization: [],
  },
};
