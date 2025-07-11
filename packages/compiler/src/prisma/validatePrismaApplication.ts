import { AutoBePrisma, IAutoBePrismaValidation } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { HashMap, hash } from "tstl";

import { MapUtil } from "../utils/MapUtil";

export function validatePrismaApplication(
  application: AutoBePrisma.IApplication,
): IAutoBePrismaValidation {
  const dict: Map<string, IModelContainer> = new Map(
    application.files
      .map((file, fi) =>
        file.models.map(
          (model, mi) =>
            [
              model.name,
              {
                file,
                model,
                fileIndex: fi,
                modelIndex: mi,
              },
            ] satisfies [string, IModelContainer],
        ),
      )
      .flat(),
  );
  const errors: IAutoBePrismaValidation.IError[] = [
    ...validateDuplicatedFiles(application),
    ...validateDuplicatedModels(application),
    ...application.files
      .map((file, fi) =>
        file.models.map((model, mi) => {
          const accessor: string = `application.files[${fi}].models[${mi}]`;
          return [
            ...validateDuplicatedFields(dict, model, accessor),
            ...validateDuplicatedIndexes(model, accessor),
            ...validateIndexes(model, accessor),
            ...validateReferences(model, accessor, dict),
          ];
        }),
      )
      .flat(2),
  ];
  return errors.length === 0
    ? {
        success: true,
        data: application,
      }
    : {
        success: false,
        data: application,
        errors,
      };
}

interface IModelContainer {
  file: AutoBePrisma.IFile;
  model: AutoBePrisma.IModel;
  fileIndex: number;
  modelIndex: number;
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
  dict: Map<string, IModelContainer>,
  model: AutoBePrisma.IModel,
  accessor: string,
): IAutoBePrismaValidation.IError[] {
  const errors: IAutoBePrismaValidation.IError[] = [];

  // FIND DUPLICATED FIELDS
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

  // FIND TABLE NAMED FIELDS
  model.plainFields.forEach((field, i) => {
    if (dict.has(field.name) === true)
      errors.push({
        path: `${accessor}.plainFields[${i}].name`,
        table: model.name,
        field: field.name,
        message: StringUtil.trim`
          There's a same named table in the application.

          Check whether the field has been designed for denormalization
          like pre-calculation. If do so, remove the field.

          Otherwise, change the field name to something else.
        `,
      });
  });
  return errors;
}

function validateDuplicatedIndexes(
  model: AutoBePrisma.IModel,
  accessor: string,
): IAutoBePrismaValidation.IError[] {
  const errors: IAutoBePrismaValidation.IError[] = [];

  // FIND DUPLICATED INDEXES
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
  model.ginIndexes.forEach((gin, i) =>
    group
      .take([gin.fieldName], () => [])
      .push(`${accessor}.ginIndexes[${i}].fieldName`),
  );
  for (const { first: fieldNames, second: array } of group)
    if (array.length !== 1)
      array.forEach((path, i) => {
        errors.push({
          path,
          table: model.name,
          field: null,
          message: [
            `Duplicated index found (${fieldNames.join(", ")}).`,
            "",
            "Accessors of the other duplicated indexes are:",
            "",
            ...array.filter((_oppo, j) => i !== j).map((a) => `- ${a}`),
          ].join("\n"),
        });
      });

  // SUBSET RELATIONS
  model.uniqueIndexes.forEach((unique, i) => {
    if (unique.fieldNames.length <= 1) return;
    unique.fieldNames.forEach((_, j, array) => {
      if (j === array.length - 1) return;
      const subset: string[] = unique.fieldNames.slice(0, j);
      if (
        j === 0 &&
        model.foreignFields.some(
          (f) => f.name === subset[0] && f.unique === true,
        )
      )
        errors.push({
          path: `${accessor}.uniqueIndexes[${i}].fieldNames[0]`,
          table: model.name,
          field: null,
          message: StringUtil.trim`
            Duplicated unique index found (${subset[0]}).
            
            You have defined an unique index that is already included,
            in the foreign field with unique constraint.
            
            Remove this unique index to avoid the duplication.
          `,
        });
      const cIndex: number = model.uniqueIndexes.findIndex(
        (u) =>
          u.fieldNames.length === subset.length &&
          u.fieldNames.every((name, k) => name === subset[k]),
      );
      if (cIndex !== -1)
        errors.push({
          path: `${accessor}.uniqueIndexes[${i}].fieldNames`,
          table: model.name,
          field: null,
          message: StringUtil.trim`
            Subset unique index found (${subset.join(", ")}).
            
            You have defined an unique index with multiple fields,
            but its subset is already defined as an unique index.
            
            Consider to change the unique index to a plain index,
            or drop the redundant unique index please.
          `,
        });
    });
  });

  // SUPERSET RELATIONS
  model.plainIndexes.forEach((x, i) => {
    model.plainIndexes.forEach((y, j) => {
      if (i === j) return;
      else if (
        x.fieldNames.length < y.fieldNames.length &&
        x.fieldNames.every((n, z) => y.fieldNames[z] === n)
      )
        errors.push({
          path: `${accessor}.plainIndexes[${i}].fieldNames`,
          table: model.name,
          field: null,
          message: StringUtil.trim`
            Superset plain index found (${y.fieldNames.join(", ")}).
            
            You have defined a plain index with multiple fields,
            but its superset is already defined as another plain index.
            
            As subset index is vulnerable, drop this plain index please.
          `,
        });
    });
  });

  // CONSIDER GIN INDEXES
  if (
    model.ginIndexes.length !==
    new Set(model.ginIndexes.map((g) => g.fieldName)).size
  )
    errors.push({
      path: `${accessor}.ginIndexes[].fieldName`,
      table: model.name,
      field: null,
      message: StringUtil.trim`
        Duplicated GIN index found.
        
        GIN index can only be used once per field.

        Please remove the duplicated GIN indexes.
      `,
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
        if (props.additional) props.additional(idx, i);
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
          message: StringUtil.trim`
            GIN index can only be used on string typed field.
            However, the target field ${gin.fieldName} does not exist
            in the {@link plainFields}.
          `,
        });
      else if (model.plainFields[pIndex].type !== "string")
        errors.push({
          path: `${accessor}.ginIndexes[${i}].fieldName`,
          table: model.name,
          field: model.plainFields[pIndex].name,
          message: StringUtil.trim`
            GIN index can only be used on string typed field.
            However, the target field ${gin.fieldName} is not string,
            but ${model.plainFields[pIndex].type}.
            
            - accessor of the wrong typed field: ${`${accessor}.plainFields[${pIndex}].type`},
          `,
        });
    },
  });
  return errors;
}

function validateReferences(
  model: AutoBePrisma.IModel,
  accessor: string,
  dict: Map<string, IModelContainer>,
): IAutoBePrismaValidation.IError[] {
  const errors: IAutoBePrismaValidation.IError[] = [];

  model.foreignFields.forEach((field, i) => {
    const target = dict.get(field.relation.targetModel);
    if (target === undefined) {
      // CHECK EXISTENCE
      errors.push({
        path: `${accessor}.foreignFields[${i}].relation.targetModel`,
        table: model.name,
        field: field.name,
        message: `Target model ${field.relation.targetModel} does not exist.`,
      });
    } else if (target.model !== model) {
      // CHECK CROSS REFERENCE
      target.model.foreignFields.forEach((oppo, j) => {
        if (oppo.relation.targetModel === model.name) {
          errors.push({
            path: `${accessor}.foreignFields[${i}].relation.targetModel`,
            table: model.name,
            field: field.name,
            message: StringUtil.trim`
              Cross-reference dependency detected between models.

              - accessor of opposite side: application.files[${target.fileIndex}].models[${target.modelIndex}].foreignFields[${j}].relation.targetModel

              Cross-references (circular dependencies) are not permitted in AutoBe Prisma schemas.

              To resolve this issue:

              1. Remove one of the foreign key fields from either model
              2. Keep only the foreign key that represents the primary relationship direction
              3. Remove any related indexes that reference the deleted foreign key field

              The foreign key field to remove is typically:

              - A redundant field that can be computed from the existing relationship
              - A field that duplicates information already accessible through the primary relationship

              Please eliminate the circular dependency and try again.`,
          });
        }
      });
    }
  });

  return errors;
}
