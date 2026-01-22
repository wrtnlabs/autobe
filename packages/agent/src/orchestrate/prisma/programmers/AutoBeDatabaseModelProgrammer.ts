import { AutoBeDatabase } from "@autobe/interface";
import { plural, singular } from "pluralize";

export namespace AutoBeDatabaseModelProgrammer {
  export const emend = (model: AutoBeDatabase.IModel): void => {
    for (const ff of model.foreignFields) {
      ff.relation.oppositeName = ff.unique
        ? singular(ff.relation.oppositeName)
        : plural(ff.relation.oppositeName);
    }
  };
}
