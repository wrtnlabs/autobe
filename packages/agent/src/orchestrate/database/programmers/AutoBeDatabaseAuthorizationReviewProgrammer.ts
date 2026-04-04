import {
  AutoBeAnalyze,
  AutoBeDatabaseComponent,
  AutoBeDatabaseComponentTableDesign,
  AutoBeDatabaseComponentTableRevise,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { NamingConvention } from "@typia/utils";
import { plural } from "pluralize";
import { IValidation } from "typia";

import { AutoBeDatabaseComponentReviewProgrammer } from "./AutoBeDatabaseComponentReviewProgrammer";

export namespace AutoBeDatabaseAuthorizationReviewProgrammer {
  export const validate = (props: {
    errors: IValidation.IError[];
    path: string;
    prefix: string | null;
    actors: AutoBeAnalyze.IActor[];
    revises: AutoBeDatabaseComponentTableRevise[];
    component: AutoBeDatabaseComponent;
  }): void => {
    // common logic
    AutoBeDatabaseComponentReviewProgrammer.validate({
      ...props,
      otherTables: [],
    });

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

  export const execute = (props: {
    component: AutoBeDatabaseComponent;
    revises: AutoBeDatabaseComponentTableRevise[];
    actors: AutoBeAnalyze.IActor[];
    prefix: string | null;
  }): AutoBeDatabaseComponentTableDesign[] => {
    const prefix: string = props.prefix ? `${props.prefix}_` : "";

    const filtered = props.revises.filter((revise) => {
      for (const actor of props.actors) {
        const name: string = NamingConvention.snake(actor.name);
        const actorTable: string = `${prefix}${plural(name)}`;
        const sessionTable: string = `${prefix}${name}_sessions`;

        if (
          revise.type === "create" &&
          (revise.table === actorTable || revise.table === sessionTable)
        )
          return false;
        else if (
          revise.type === "update" &&
          (revise.original === actorTable || revise.original === sessionTable)
        )
          return false;
        else if (
          revise.type === "erase" &&
          (revise.table === actorTable || revise.table === sessionTable)
        )
          return false;
      }
      return true;
    });

    return AutoBeDatabaseComponentReviewProgrammer.execute({
      component: props.component,
      revises: filtered,
    });
  };
}
