import {
  AutoBeAnalyzeActor,
  AutoBeInterfaceEndpointDesign,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import {
  ILlmApplication,
  ILlmSchema,
  IValidation,
  LlmTypeChecker,
} from "@samchon/openapi";
import typia from "typia";
import { NamingConvention } from "typia/lib/utils/NamingConvention";

export namespace AutoBeInterfaceEndpointProgrammer {
  /**
   * Filter endpoint designs:
   *
   * - For base: Remove guest actors and login/join/refresh/session
   *   authorizationType
   * - For action: Remove all non-null authorizationType (action endpoints must be
   *   null only)
   */
  export const filter = (props: {
    kind: "base" | "action";
    design: AutoBeInterfaceEndpointDesign;
    actors: AutoBeAnalyzeActor[];
  }): boolean => {
    // Action endpoints: only allow authorizationType: null
    if (props.kind === "action") {
      return props.design.authorizationType === null;
    }

    // Base endpoints: remove guest actors and specific auth types
    props.design.authorizationActors = props.design.authorizationActors.filter(
      (actorName) => actorName !== "guest",
    );
    if (props.design.authorizationActors.length === 0) return false;
    else if (
      props.design.authorizationType === "login" ||
      props.design.authorizationType === "join" ||
      props.design.authorizationType === "refresh" ||
      props.design.authorizationType === "session"
    )
      return false;
    return true;
  };

  export const fixDesign = (props: {
    design: AutoBeInterfaceEndpointDesign;
  }): void => {
    props.design.endpoint.path = fixPath(props.design.endpoint.path);
  };

  export const fixPath = (path: string): string => {
    return path
      .split("/")
      .map((s) =>
        s.startsWith("{") && s.endsWith("}")
          ? `{${NamingConvention.camel(s.slice(1, -1).replace(/-/g, "_"))}}`
          : s,
      )
      .join("/");
  };

  export const fixApplication = (props: {
    application: ILlmApplication;
    actors: AutoBeAnalyzeActor[];
  }): void => {
    const $defs: Record<string, ILlmSchema> =
      props.application.functions[0].parameters.$defs;
    const design: ILlmSchema | undefined =
      $defs[typia.reflect.name<AutoBeInterfaceEndpointDesign>()];
    if (design === undefined)
      throw new Error("AutoBeInterfaceEndpointDesign is undefined");
    else if (LlmTypeChecker.isObject(design) === false)
      throw new Error("AutoBeInterfaceEndpointDesign is not object type");

    const property: ILlmSchema | undefined =
      design.properties["authorizationActors"];
    if (property === undefined)
      throw new Error(
        "AutoBeInterfaceEndpointDesign.authorizationActors is undefined",
      );
    else if (LlmTypeChecker.isArray(property) === false)
      throw new Error(
        "AutoBeInterfaceEndpointDesign.authorizationActors is not array type",
      );
    property.items = {
      type: "string",
      enum: props.actors.map((actor) => actor.name),
    };
  };

  export const validateDesign = (props: {
    design: AutoBeInterfaceEndpointDesign;
    actors: AutoBeAnalyzeActor[];
    path: string;
    errors: IValidation.IError[];
  }): void => {
    props.design.authorizationActors.forEach((actorName, i) => {
      if (props.actors.find((actor) => actor.name === actorName) === undefined)
        props.errors.push({
          path: `${props.path}.authorizationActors[${i}]`,
          expected: props.actors.map((a) => JSON.stringify(a.name)).join(" | "),
          value: actorName,
          description: StringUtil.trim`
            Actor "${actorName}" is not defined in the roles list.

            Please select one of them below, or do not define (\`null\`):

            ${props.actors.map((actor) => `- ${actor.name}`).join("\n")}
          `,
        });
    });
  };
}
