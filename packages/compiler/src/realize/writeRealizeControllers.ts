import {
  AutoBeOpenApi,
  AutoBeRealizeAuthorization,
  AutoBeRealizeFunction,
  IAutoBeRealizeControllerProps,
} from "@autobe/interface";
import { NestiaMigrateApplication } from "@nestia/migrate";
import { NestiaMigrateNestMethodProgrammer } from "@nestia/migrate/lib/programmers/NestiaMigrateNestMethodProgrammer";
import path from "path";
import ts from "typescript";

import { createMigrateApplication } from "../interface/createMigrateApplication";
import { ArrayUtil } from "../utils/ArrayUtil";
import { FilePrinter } from "../utils/FilePrinter";

export const writeRealizeControllers = async (
  props: IAutoBeRealizeControllerProps,
): Promise<Record<string, string>> => {
  const app: NestiaMigrateApplication = createMigrateApplication(
    props.document,
  );
  const result: Record<string, string> = app.nest({
    simulate: false,
    e2e: false,
    programmer: {
      controllerMethod: (ctx) => {
        const method = NestiaMigrateNestMethodProgrammer.write(ctx);
        const operate: AutoBeOpenApi.IOperation | undefined =
          props.document.operations.find(
            (o) => o.method === ctx.route.method && o.path === ctx.route.path,
          );
        const func: AutoBeRealizeFunction | undefined = props.functions.find(
          (f) =>
            f.endpoint.method === ctx.route.method &&
            f.endpoint.path === ctx.route.path,
        );
        if (func === undefined || operate === undefined) return method; // unreachable

        const auth: AutoBeRealizeAuthorization | undefined =
          operate.authorizationRole
            ? props.authorizations.find(
                (d) => d.role.name === operate.authorizationRole,
              )
            : undefined;
        if (operate.authorizationRole && auth === undefined) return method; // unreachable

        ctx.importer.external({
          type: "instance",
          library: path
            .relative(ctx.controller.location, func.location)
            .replaceAll(path.sep, "/")
            .split(".ts")[0],
          name: func.name,
        });

        const inputArguments: string[] = [
          ...(operate.authorizationRole ? [operate.authorizationRole] : []),
          ...ctx.route.parameters.map((p) => p.name),
          ...(ctx.route.query ? [ctx.route.query.name] : []),
          ...(ctx.route.body ? [ctx.route.body.name] : []),
        ];
        const call: ts.Expression = ts.factory.createCallExpression(
          ts.factory.createIdentifier(func.name),
          undefined,
          inputArguments.length === 0
            ? undefined
            : [
                ts.factory.createObjectLiteralExpression(
                  inputArguments.map((name) =>
                    ts.factory.createShorthandPropertyAssignment(name),
                  ),
                  true,
                ),
              ],
        );
        return ts.factory.updateMethodDeclaration(
          method,
          method.modifiers,
          method.asteriskToken,
          method.name,
          method.questionToken,
          method.typeParameters,
          auth
            ? [
                ts.factory.createParameterDeclaration(
                  [
                    ts.factory.createDecorator(
                      ts.factory.createCallExpression(
                        ts.factory.createIdentifier(
                          ctx.importer.external({
                            type: "instance",
                            library: path
                              .relative(
                                ctx.controller.location,
                                auth.decorator.location,
                              )
                              .replaceAll(path.sep, "/")
                              .split(".ts")[0],
                            name: auth.decorator.name,
                          }),
                        ),
                        undefined,
                        [],
                      ),
                    ),
                  ],
                  undefined,
                  auth.role.name,
                  undefined,
                  ts.factory.createTypeReferenceNode(
                    ctx.importer.external({
                      type: "instance",
                      library: path
                        .relative(
                          ctx.controller.location,
                          auth.payload.location,
                        )
                        .replaceAll(path.sep, "/")
                        .split(".ts")[0],
                      name: auth.payload.name,
                    }),
                  ),
                  undefined,
                ),
                ...method.parameters,
              ]
            : method.parameters,
          method.type,
          ts.factory.createBlock([ts.factory.createReturnStatement(call)]),
        );
      },
    },
  });

  const entries: [string, string][] = await ArrayUtil.asyncMap(
    Object.entries(result).filter(([key]) =>
      key.startsWith("src/controllers/"),
    ),
    async ([key, value]) => [key, await FilePrinter.beautify(value)],
  );
  return Object.fromEntries(entries);
};
