import { AutoBeOpenApi } from "@autobe/interface";
import {
  IHttpMigrateApplication,
  IHttpMigrateRoute,
  OpenApi,
} from "@typia/interface";
import { HttpMigration } from "@typia/utils";

import { transformOpenApiDocument } from "./transformOpenApiDocument";

export const revertOpenApiAccessor = (
  document: AutoBeOpenApi.IDocument,
): void => {
  const regular: OpenApi.IDocument = transformOpenApiDocument(document);
  const migrate: IHttpMigrateApplication = HttpMigration.application(regular);
  for (const op of document.operations) {
    const route: IHttpMigrateRoute | undefined = migrate.routes.find(
      (r) => r.method === op.method && r.path === op.path,
    );
    if (route === undefined) continue;
    if (route.accessor.length !== 0 && route.accessor.at(-1) !== op.name)
      op.name = route.accessor.at(-1)!;
    op.accessor = route.accessor;
  }
};
