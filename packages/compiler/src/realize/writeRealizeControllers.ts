import {
  AutoBeRealizeDecorator,
  AutoBeRealizeFunction,
  IAutoBeRealizeControllerProps,
} from "@autobe/interface";
import { NestiaMigrateApplication } from "@nestia/migrate";
import { NestiaMigrateNestMethodProgrammer } from "@nestia/migrate/lib/programmers/NestiaMigrateNestMethodProgrammer";
import path from "path";
import ts from "typescript";

import { createMigrateApplication } from "../interface/createMigrateApplication";

export const writeRealizeControllers = (
  props: IAutoBeRealizeControllerProps,
): Record<string, string> => {
  const app: NestiaMigrateApplication = createMigrateApplication(
    props.document,
  );
  const result: Record<string, string> = app.nest({
    simulate: false,
    e2e: false,
    programmer: {
      controllerMethod: (ctx) => {
        const method = NestiaMigrateNestMethodProgrammer.write(ctx);
        const func: AutoBeRealizeFunction | undefined = props.functions.find(
          (f) =>
            f.endpoint.method === ctx.route.method &&
            f.endpoint.path === ctx.route.path,
        );
        if (func === undefined) return method; // unreachable

        const decorator: AutoBeRealizeDecorator | undefined = func.role
          ? props.decorators.find((d) => d.role === func.role)
          : undefined;
        if (func.role && decorator === undefined) return method; // unreachable

        ctx.importer.external({
          type: "instance",
          library: path
            .relative(ctx.controller.location, func.location)
            .replaceAll(path.sep, "/")
            .split(".ts")[0],
          name: func.name,
        });
        if (decorator)
          ctx.importer.external({
            type: "instance",
            library: path
              .relative(ctx.controller.location, decorator.location)
              .replaceAll(path.sep, "/")
              .split(".ts")[0],
            name: decorator.name,
          });

        const call: ts.Expression = ts.factory.createCallExpression(
          ts.factory.createIdentifier(func.name),
          undefined,
          [
            ...(func.role ? [func.role] : []),
            ...ctx.route.parameters.map((p) => p.name),
            ...(ctx.route.query ? [ctx.route.query.name] : []),
            ...(ctx.route.body ? [ctx.route.body.name] : []),
          ].map((name) => ts.factory.createIdentifier(name)),
        );
        return ts.factory.updateMethodDeclaration(
          method,
          method.modifiers,
          method.asteriskToken,
          method.name,
          method.questionToken,
          method.typeParameters,
          decorator
            ? [
                ts.factory.createParameterDeclaration(
                  [
                    ts.factory.createDecorator(
                      ts.factory.createCallExpression(
                        ts.factory.createIdentifier(decorator.name),
                        undefined,
                        [],
                      ),
                    ),
                  ],
                  undefined,
                  decorator.role,
                  undefined,
                  ts.factory.createTypeReferenceNode("any"),
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
  return Object.fromEntries(
    Object.entries(result).filter(([key]) =>
      key.startsWith("src/controllers/"),
    ),
  );
};
