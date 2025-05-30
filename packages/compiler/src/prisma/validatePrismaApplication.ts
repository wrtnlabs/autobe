import { AutoBePrisma, IAutoBePrismaValidation } from "@autobe/interface";
import { HashMap, hash } from "tstl";

import { MapUtil } from "../utils/MapUtil";

export function validatePrismaApplication(
  application: AutoBePrisma.IApplication,
): IAutoBePrismaValidation {
  const dict: Map<string, AutoBePrisma.IModel> = new Map(
    application.files
      .map((file) => file.models)
      .flat()
      .map((model) => [model.name, model]),
  );
  const errors: IAutoBePrismaValidation.IError[] = [
    ...validateDuplicatedFiles(application),
    ...validateDuplicatedModels(application),
    ...application.files
      .map((file, fi) =>
        file.models.map((model, mi) => {
          const accessor: string = `application.files[${fi}].models[${mi}]`;
          return [
            ...validateDuplicatedFields(model, accessor),
            ...validateDuplicatedIndexes(model, accessor),
            ...validateIndexes(model, accessor),
            ...validateReferences(model, accessor, dict),
          ];
        }),
      )
      .flat(2),
  ];
  return errors.length === 0
    ? { success: true, data: application }
    : { success: false, data: application, errors };
}

/* -----------------------------------------------------------
  DUPLICATES
----------------------------------------------------------- */
function validateDuplicatedFiles(
  app: AutoBePrisma.IApplication,
): IAutoBePrismaValidation.IError[] {
  interface IFileContainer {
    file: AutoBePrisma.IFile;
    index: number;
  }
  const group: Map<string, IFileContainer[]> = new Map();
  app.files.forEach((file, fileIndex) => {
    const container: IFileContainer = { file, index: fileIndex };
    MapUtil.take(group, file.filename, () => []).push(container);
  });

  const errors: IAutoBePrismaValidation.IError[] = [];
  for (const array of group.values())
    if (array.length !== 1)
      array.forEach((container, i) => {
        errors.push({
          path: `application.files[${container.index}]`,
          table: null,
          field: null,
          message: [
            `File ${container.file.filename} is duplicated.`,
            "",
            "Accessors of the other duplicated files are:",
            "",
            ...array
              .filter((_oppo, j) => i !== j)
              .map((oppo) => `- application.files[${oppo.index}]`),
          ].join("\n"),
        });
      });
  return errors;
}

function validateDuplicatedModels(
  app: AutoBePrisma.IApplication,
): IAutoBePrismaValidation.IError[] {
  interface IModelContainer {
    file: AutoBePrisma.IFile;
    model: AutoBePrisma.IModel;
    fileIndex: number;
    modelIndex: number;
  }
  const modelContainers: Map<string, IModelContainer[]> = new Map();
  app.files.forEach((file, fileIndex) => {
    file.models.forEach((model, modelIndex) => {
      const container: IModelContainer = {
        file,
        model,
        fileIndex,
        modelIndex,
      };
      MapUtil.take(modelContainers, model.name, () => []).push(container);
    });
  });

  const errors: IAutoBePrismaValidation.IError[] = [];
  for (const array of modelContainers.values())
    if (array.length !== 1)
      array.forEach((container, i) => {
        errors.push({
          path: `application.files[${container.fileIndex}].models[${container.modelIndex}]`,
          table: container.model.name,
          field: null,
          message: [
            `Model ${container.model.name} is duplicated.`,
            "",
            "Accessors of the other duplicated models are:",
            "",
            ...array
              .filter((_oppo, j) => i !== j)
              .map(
                (oppo) =>
                  `- application.files[${oppo.fileIndex}].models[${oppo.modelIndex}]`,
              ),
          ].join("\n"),
        });
      });
  return errors;
}

function validateDuplicatedFields(
  model: AutoBePrisma.IModel,
  accessor: string,
): IAutoBePrismaValidation.IError[] {
  const group: Map<string, string[]> = new Map();
  MapUtil.take(group, model.primaryField.name, () => []).push(
    `${accessor}.primaryField.name`,
  );
  model.foreignFields.forEach((field, i) =>
    MapUtil.take(group, field.name, () => []).push(
      `${accessor}.foreignFields[${i}].name`,
    ),
  );
  model.plainFields.forEach((field, i) =>
    MapUtil.take(group, field.name, () => []).push(
      `${accessor}.plainFields[${i}].name`,
    ),
  );

  const errors: IAutoBePrismaValidation.IError[] = [];
  for (const [field, array] of group)
    if (array.length !== 1)
      array.forEach((path, i) => {
        errors.push({
          path,
          table: model.name,
          field,
          message: [
            `Field ${field} is duplicated.`,
            "",
            "Accessors of the other duplicated fields are:",
            "",
            ...array.filter((_oppo, j) => i !== j).map((a) => `- ${a}`),
          ].join("\n"),
        });
      });
  return errors;
}

function validateDuplicatedIndexes(
  model: AutoBePrisma.IModel,
  accessor: string,
): IAutoBePrismaValidation.IError[] {
  const group: HashMap<string[], string[]> = new HashMap(
    (x) => hash(...x),
    (x, y) => x.length === y.length && x.every((v, i) => v === y[i]),
  );
  model.uniqueIndexes.forEach((unique, i) =>
    group
      .take(unique.fieldNames, () => [])
      .push(`${accessor}.uniqueIndexes[${i}].fieldNames`),
  );
  model.plainIndexes.forEach((plain, i) =>
    group
      .take(plain.fieldNames, () => [])
      .push(`${accessor}.plainIndexes[${i}].fieldNames`),
  );

  const errors: IAutoBePrismaValidation.IError[] = [];
  for (const { first: fieldNames, second: array } of group)
    if (array.length !== 1)
      array.forEach((path, i) => {
        errors.push({
          path,
          table: model.name,
          field: null,
          message: [
            `Duplicated index found (${fieldNames.join(", ")})`,
            "",
            "Accessors of the other duplicated indexes are:",
            "",
            ...array.filter((_oppo, j) => i !== j).map((a) => `- ${a}`),
          ].join("\n"),
        });
      });

  if (
    model.ginIndexes.length !==
    new Set(model.ginIndexes.map((g) => g.fieldName)).size
  )
    errors.push({
      path: `${accessor}.ginIndexes[].fieldName`,
      table: model.name,
      field: null,
      message: [
        "Duplicated GIN index found.",
        "",
        "GIN index can only be used once per field.",
        "Please remove the duplicated GIN indexes.",
      ].join("\n"),
    });

  return errors;
}

/* -----------------------------------------------------------
  VALIDATIONS
----------------------------------------------------------- */
function validateIndexes(
  model: AutoBePrisma.IModel,
  accessor: string,
): IAutoBePrismaValidation.IError[] {
  // EMENSION
  model.uniqueIndexes = model.uniqueIndexes.filter(
    (unique) =>
      unique.fieldNames.length !== 0 &&
      unique.fieldNames[0] !== model.primaryField.name,
  );
  model.plainIndexes = model.plainIndexes.filter(
    (plain) =>
      plain.fieldNames.length !== 0 &&
      plain.fieldNames[0] !== model.primaryField.name,
  );

  const errors: IAutoBePrismaValidation.IError[] = [];
  const columnNames: Set<string> = new Set([
    model.primaryField.name,
    ...model.foreignFields.map((field) => field.name),
    ...model.plainFields.map((field) => field.name),
  ]);

  // COLUMN LEVEL VALIDATION
  const validate = <T>(props: {
    title: string;
    indexes: T[];
    fieldNames: (idx: T) => string[];
    accessor: (i: number, j: number) => string;
    additional?: (idx: T, i: number) => void;
  }) => {
    props.indexes.forEach((idx, i) => {
      // FIND TARGET FIELD
      props.fieldNames(idx).forEach((name, j) => {
        if (!columnNames.has(name))
          errors.push({
            path: `${accessor}.${props.accessor(i, j)}`,
            table: model.name,
            field: null,
            message: `Field ${name} does not exist in model ${model.name}.`,
          });
      });
    });
  };
  validate({
    title: "unique index",
    indexes: model.uniqueIndexes,
    fieldNames: (idx) => idx.fieldNames,
    accessor: (i, j) => `uniqueIndexes[${i}].fieldNames[${j}]`,
  });
  validate({
    title: "index",
    indexes: model.plainIndexes,
    fieldNames: (idx) => idx.fieldNames,
    accessor: (i, j) => `plainIndexes[${i}].fieldNames[${j}]`,
  });
  validate({
    title: "index",
    indexes: model.ginIndexes,
    fieldNames: (idx) => [idx.fieldName],
    accessor: (i) => `ginIndexes[${i}].fieldName`,
    additional: (gin, i) => {
      const pIndex: number = model.plainFields.findIndex(
        (plain) => plain.name === gin.fieldName,
      );
      if (pIndex === -1)
        errors.push({
          path: `${accessor}.ginIndexes[${i}].fieldName`,
          table: model.name,
          field: null,
          message: [
            "GIN index can only be used on string typed field.",
            `However, the target field ${gin.fieldName} does not exist",
            "in the {@link plainFields}.`,
          ].join("\n"),
        });
      else if (model.plainFields[pIndex].type !== "string")
        errors.push({
          path: `${accessor}.ginIndexes[${i}].fieldName`,
          table: model.name,
          field: model.plainFields[pIndex].name,
          message: [
            "GIN index can only be used on string typed field.",
            `However, the target field ${gin.fieldName} is not string,`,
            `but ${model.plainFields[pIndex].type}.`,
            "",
            `- accessor of the wrong typed field: ${`${accessor}.plainFields[${pIndex}].type`}`,
          ].join("\n"),
        });
    },
  });
  return errors;
}

function validateReferences(
  model: AutoBePrisma.IModel,
  accessor: string,
  dict: Map<string, AutoBePrisma.IModel>,
): IAutoBePrismaValidation.IError[] {
  const errors: IAutoBePrismaValidation.IError[] = [];
  model.foreignFields.forEach((field, i) => {
    const target = dict.get(field.relation.targetModel);
    if (target === undefined)
      errors.push({
        path: `${accessor}.foreignFields[${i}].relation.targetModel`,
        table: model.name,
        field: field.name,
        message: `Target model ${field.relation.targetModel} does not exist.`,
      });
  });
  return errors;
}
