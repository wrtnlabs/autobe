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
    actors: AutoBeAnalyzeActor[];
    revises: AutoBeDatabaseComponentTableRevise[];
    component: AutoBeDatabaseComponent;
  }): void => {
    // common logic
    AutoBeDatabaseComponentReviewProgrammer.validate(props);

    // naming convention
    const prefix: string = props.prefix ? `${props.prefix}_` : "";
    const actorNames: string[] = props.actors.map(
      (actor) => prefix + NamingConvention.snake(actor.name),
    );
    const predicate = (next: { path: string; value: string }): void => {
      if (actorNames.some((an) => next.value.startsWith(an) === true)) return;
      props.errors.push({
        path: next.path,
        expected: `\`\${${actorNames.map((s) => JSON.stringify(s)).join(" | ")}}\${string}\``,
        value: next.value,
        description: StringUtil.trim`
          Table "${next.value}" does not start with none of below:

          ${actorNames.map((an) => `- "${an}"`).join("\n")}

          Fix: Add one of above to the table name, or remove this table
          if it is unrelated to some actor.
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
