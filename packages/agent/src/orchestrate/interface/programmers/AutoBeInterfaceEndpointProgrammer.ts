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
import { singular } from "pluralize";
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

    // remove specific auth types
    if (
      props.design.authorizationType === "login" ||
      props.design.authorizationType === "join" ||
      props.design.authorizationType === "refresh" ||
      props.design.authorizationType === "withdraw"
    )
      return false;
    else if (props.design.authorizationType === "session") {
      props.design.authorizationActors =
        props.design.authorizationActors.filter((name) => {
          const actor: AutoBeAnalyzeActor | undefined = props.actors.find(
            (a) => a.name === name,
          );
          if (actor === undefined) return false;
          return actor.kind !== "guest";
        });
      if (props.design.authorizationActors.length === 0) return false;
      else if (
        props.design.endpoint.method !== "get" &&
        props.design.endpoint.method !== "patch"
      )
        return false;
      return true;
    }
    return true;
  };

  export const fixDesign = (props: {
    actors: AutoBeAnalyzeActor[];
    design: AutoBeInterfaceEndpointDesign;
  }): AutoBeInterfaceEndpointDesign => {
    props.design.endpoint.path = fixPath(props.design.endpoint.path);
    if (props.design.authorizationActors.length === 1) {
      const actor: AutoBeAnalyzeActor | undefined = props.actors.find(
        (a) => a.name === props.design.authorizationActors[0],
      );
      if (actor !== undefined && actor.kind !== "admin") {
        const param: string =
          NamingConvention.camel(singular(actor.name)) + "Id";
        const bracket: string = `{${param}}`;
        if (props.design.endpoint.path.includes(bracket) === true)
          props.design.endpoint.path = props.design.endpoint.path.replace(
            bracket,
            "",
          );
      }
    } else if (
      props.design.authorizationActors.length > 1 &&
      props.design.endpoint.path.includes("{actorId}")
    ) {
      props.design.endpoint.path = props.design.endpoint.path.replace(
        "{actorId}",
        "",
      );
    }
    return props.design;
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
    // if (props.actors.length === 0) props.design.authorizationActors = [];

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
