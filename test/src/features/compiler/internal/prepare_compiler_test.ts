import {
  AutoBeOpenApi,
  AutoBeTestScenario,
  IAutoBeCompiler,
} from "@autobe/interface";
import { OpenApi } from "@samchon/openapi";

import { TestFactory } from "../../../TestFactory";

export const prepare_compiler_test = async (factory: TestFactory) => {
  const compiler: IAutoBeCompiler = factory.createCompiler();
  const document: AutoBeOpenApi.IDocument = await compiler.interface.invert(
    OpenApi.convert(
      await fetch(
        "https://raw.githubusercontent.com/samchon/bbs-backend/master/packages/api/swagger.json",
      ).then((r) => r.json()),
    ),
  );
  const find = (
    endpoint: AutoBeOpenApi.IEndpoint,
  ): AutoBeOpenApi.IOperation => {
    const found: AutoBeOpenApi.IOperation | undefined =
      document.operations.find(
        (op) => op.method === endpoint.method && op.path === endpoint.path,
      );
    if (found === undefined)
      throw new Error(
        `Endpoint not found: ${endpoint.method} ${endpoint.path}`,
      );
    return found;
  };

  const scenario: AutoBeTestScenario = {
    endpoint: find({
      method: "post",
      path: "/bbs/articles",
    }),
    draft: [
      "Create a new article in the system, and verify its creation.",
      "",
      "And then, read the newly created article to ensure it exists.",
      "",
      "Also, list all articles to confirm the new one is included.",
    ].join("\n"),
    functionName: "test_api_bbs_articles_create",
    dependencies: [
      {
        purpose: "Read the newly created article to verify its existence.",
        endpoint: find({
          method: "get",
          path: "/bbs/articles/{id}",
        }),
      },
      {
        purpose: "List up all articles to ensure the new one is included.",
        endpoint: find({
          method: "patch",
          path: "/bbs/articles",
        }),
      },
    ],
  };
  return {
    compiler: compiler.test,
    document: document,
    scenario: scenario,
  };
};
