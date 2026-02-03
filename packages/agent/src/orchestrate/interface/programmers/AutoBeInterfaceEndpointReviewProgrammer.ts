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
              The endpoint referenced in this revision does not exist in the
              provided designs list.

              You can only use keep, update, or erase for endpoints that were
              given to you for review. Check the path and method carefully -
              they must match exactly.

              If you want to add a new endpoint that doesn't exist yet, use the
              "create" revision type instead.

              Here are all valid endpoints you can reference:

              | Method | Path |
              |--------|------|
              ${props.designs.map((d) => `| ${d.endpoint.method} | ${d.endpoint.path} |`).join("\n")}
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
            Every endpoint in the provided designs list MUST have a
            corresponding revision.

            You cannot omit any endpoint - if an endpoint is correct and needs
            no changes, use the "keep" revision type to explicitly approve it.

            This ensures complete review coverage with no accidentally skipped
            endpoints.
          `,
        });
    }
  };

  export const execute = (props: {
    kind: "base" | "action";
    actors: AutoBeAnalyzeActor[];
    designs: AutoBeInterfaceEndpointDesign[];
    revises: AutoBeInterfaceEndpointRevise[];
  }): AutoBeInterfaceEndpointDesign[] => {
    const output: AutoBeInterfaceEndpointDesign[] = [];
    for (const revise of props.revises) {
      if (revise.type === "create")
        output.push(
          AutoBeInterfaceEndpointProgrammer.fixDesign({
            actors: props.actors,
            design: revise.design,
          }),
        );
      else if (revise.type === "update")
        output.push(
          AutoBeInterfaceEndpointProgrammer.fixDesign({
            actors: props.actors,
            design: revise.newDesign,
          }),
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
    return output.filter((design) =>
      AutoBeInterfaceEndpointProgrammer.filter({
        kind: props.kind,
        actors: props.actors,
        design,
      }),
    );
  };
}
