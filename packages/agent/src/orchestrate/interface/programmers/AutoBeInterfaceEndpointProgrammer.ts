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

export namespace AutoBeInterfaceEndpointProgrammer {
  /**
   * Filter endpoint designs:
   * - For base: Remove guest actors and login/join/refresh/session authorizationType
   * - For action: Remove all non-null authorizationType (action endpoints must be null only)
   */
  export const filterDesigns = (props: {
    kind: "base" | "action";
    designs: AutoBeInterfaceEndpointDesign[];
    actors: AutoBeAnalyzeActor[];
  }): AutoBeInterfaceEndpointDesign[] =>
    props.designs.filter((design) => {
      // Action endpoints: only allow authorizationType: null
      if (props.kind === "action") {
        return design.authorizationType === null;
      }

      // Base endpoints: remove guest actors and specific auth types
      const hasGuestActor = design.authorizationActors.some((actorName) => {
        const actor = props.actors.find((a) => a.name === actorName);
        return actor?.kind === "guest";
      });
      if (hasGuestActor) return false;

      const authType = design.authorizationType;
      if (
        authType === "login" ||
        authType === "join" ||
        authType === "refresh" ||
        authType === "session"
      )
        return false;

      return true;
    });

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
          expected: `null | ${props.actors.map((a) => JSON.stringify(a.name)).join(" | ")}`,
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
