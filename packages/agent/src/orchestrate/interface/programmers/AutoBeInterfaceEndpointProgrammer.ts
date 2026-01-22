import {
  AutoBeAnalyzeActor,
  AutoBeInterfaceEndpointDesign,
} from "@autobe/interface";
import { ILlmApplication, ILlmSchema, LlmTypeChecker } from "@samchon/openapi";
import typia from "typia";

export namespace AutoBeInterfaceEndpointProgrammer {
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
}
