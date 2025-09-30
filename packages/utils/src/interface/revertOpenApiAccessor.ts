import { AutoBeOpenApi } from "@autobe/interface";
import {
  HttpMigration,
  IHttpMigrateApplication,
  IHttpMigrateRoute,
  OpenApi,
} from "@samchon/openapi";

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
    if (
      route !== undefined &&
      route.accessor.length !== 0 &&
      route.accessor.at(-1) !== op.name
    )
      op.name = route.accessor.at(-1)!;
  }
};
