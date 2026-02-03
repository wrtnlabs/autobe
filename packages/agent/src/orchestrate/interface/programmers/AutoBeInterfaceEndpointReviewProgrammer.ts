import {
  AutoBeAnalyzeActor,
  AutoBeInterfaceEndpointDesign,
  AutoBeInterfaceEndpointRevise,
} from "@autobe/interface";
import { AutoBeOpenApiEndpointComparator, StringUtil } from "@autobe/utils";
import { IValidation } from "typia";

import { AutoBeInterfaceEndpointProgrammer } from "./AutoBeInterfaceEndpointProgrammer";

export namespace AutoBeInterfaceEndpointReviewProgrammer {
  export const validate = (props: {
    path: string;
    errors: IValidation.IError[];
    actors: AutoBeAnalyzeActor[];
    designs: AutoBeInterfaceEndpointDesign[];
    revises: AutoBeInterfaceEndpointRevise[];
  }): void => {
    props.revises.forEach((revise, i) => {
      // check endpoint existence
      if ("endpoint" in revise) {
        const found: AutoBeInterfaceEndpointDesign | undefined =
          props.designs.find((d) =>
            AutoBeOpenApiEndpointComparator.equals(d.endpoint, revise.endpoint),
          );
        if (found === undefined)
          props.errors.push({
            path: `${props.path}[${i}].endpoint`,
            expected: `An endpoint matching one of the provided designs (path + method)`,
            value: revise.endpoint,
            description: StringUtil.trim`
              @todo
            `,
          });
      }

      // individual cases
      if (revise.type === "create")
        AutoBeInterfaceEndpointProgrammer.validateDesign({
          design: revise.design,
          actors: props.actors,
          errors: props.errors,
          path: `${props.path}[${i}].design`,
        });
      else if (revise.type === "update")
        AutoBeInterfaceEndpointProgrammer.validateDesign({
          design: revise.newDesign,
          actors: props.actors,
          errors: props.errors,
          path: `${props.path}[${i}].newDesign`,
        });
      else if (revise.type === "erase" || revise.type === "keep") {
      } else revise satisfies never;
    });

    // check omissions
    for (const design of props.designs) {
      const found: AutoBeInterfaceEndpointRevise | undefined =
        props.revises.find((revise) => {
          if ("endpoint" in revise)
            return AutoBeOpenApiEndpointComparator.equals(
              design.endpoint,
              revise.endpoint,
            );
          else return false;
        });
      if (found === undefined)
        props.errors.push({
          path: `${props.path}[]`,
          value: undefined,
          expected: `AutoBeInterfaceEndpointRevise (corresponding to the design with path: ${design.endpoint.path} and method: ${design.endpoint.method})`,
          description: StringUtil.trim`
            @todo
          `,
        });
    }
  };

  export const execute = (props: {
    designs: AutoBeInterfaceEndpointDesign[];
    revises: AutoBeInterfaceEndpointRevise[];
  }): AutoBeInterfaceEndpointDesign[] => {
    const output: AutoBeInterfaceEndpointDesign[] = [];
    for (const revise of props.revises) {
      if (revise.type === "create")
        output.push(AutoBeInterfaceEndpointProgrammer.fixDesign(revise.design));
      else if (revise.type === "update")
        output.push(
          AutoBeInterfaceEndpointProgrammer.fixDesign(revise.newDesign),
        );
      else if (revise.type === "keep") {
        const found: AutoBeInterfaceEndpointDesign | undefined =
          props.designs.find((d) =>
            AutoBeOpenApiEndpointComparator.equals(d.endpoint, revise.endpoint),
          );
        if (found !== undefined) output.push(found);
      } else if (revise.type === "erase") {
      } else revise satisfies never;
    }
    return output;
  };
}
