import {
  AutoBeAnalyzeActor,
  AutoBeDatabaseComponent,
  AutoBeDatabaseComponentTableRevise,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { IValidation } from "typia";
import { NamingConvention } from "typia/lib/utils/NamingConvention";

import { AutoBeDatabaseComponentReviewProgrammer } from "./AutoBeDatabaseComponentReviewProgrammer";

export namespace AutoBeDatabaseAuthorizationReviewProgrammer {
  export const validate = (props: {
    errors: IValidation.IError[];
    path: string;
    prefix: string | null;
    actor: AutoBeAnalyzeActor;
    revises: AutoBeDatabaseComponentTableRevise[];
    component: AutoBeDatabaseComponent;
  }): void => {
    // common logic
    AutoBeDatabaseComponentReviewProgrammer.validate(props);

    // naming convention
    const actor: string = NamingConvention.snake(props.actor.name);
    const prefix: string = props.prefix ? `${props.prefix}_` : "";
    const predicate = (next: { path: string; value: string }): void => {
      if (next.value.includes(actor) === true) return;
      props.errors.push({
        path: next.path,
        expected: `\`${prefix}${actor}\`\${string}`,
        value: next.value,
        description: StringUtil.trim`
          Table "${next.value}" does not contain actor name "${prefix}${actor}".

          Fix: Add "${prefix}${actor}" to the table name, or remove this table
          if it is unrelated to "${props.actor.name}" actor.
        `,
      });
    };

    props.revises.forEach((revise, i) => {
      if (revise.type === "create")
        predicate({
          path: `${props.path}[${i}].table`,
          value: revise.table,
        });
      else if (revise.type === "update")
        predicate({
          path: `${props.path}[${i}].updated`,
          value: revise.updated,
        });
    });
  };
}
