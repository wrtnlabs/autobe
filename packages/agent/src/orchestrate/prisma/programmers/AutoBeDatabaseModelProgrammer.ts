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

  export const getNeighbors = (props: {
    application: AutoBeDatabase.IApplication;
    model: AutoBeDatabase.IModel;
  }): AutoBeDatabase.IModel[] => {
    const everything: Map<string, AutoBeDatabase.IModel> = new Map(
      props.application.files
        .map((f) => f.models)
        .flat()
        .map((m) => [m.name, m]),
    );
    const unique: Map<string, AutoBeDatabase.IModel> = new Map();

    // add myself
    unique.set(props.model.name, props.model);

    // add parent models
    props.model.foreignFields.forEach((ff) => {
      const gotten: AutoBeDatabase.IModel | undefined = everything.get(
        ff.relation.targetModel,
      );
      if (gotten !== undefined) unique.set(gotten.name, gotten);
    });

    // add children models
    for (const model of unique.values()) {
      const ff: AutoBeDatabase.IForeignField | undefined =
        model.foreignFields.find(
          (ff) => ff.relation.targetModel === props.model.name,
        );
      if (ff !== undefined) {
        const parent: AutoBeDatabase.IModel | undefined = everything.get(
          ff.relation.targetModel,
        );
        if (parent !== undefined) unique.set(parent.name, parent);
      }
    }
    return Array.from(unique.values());
  };
}
