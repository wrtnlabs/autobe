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
          message: StringUtil.trim`
            File ${container.file.filename} is duplicated.

            Accessors of the other duplicated files are:

            ${array
              .filter((_oppo, j) => i !== j)
              .map((oppo) => `- application.files[${oppo.index}]`)
              .join("\n")},
          `,
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
          message: StringUtil.trim`
            Model ${container.model.name} is duplicated.
            
            Accessors of the other duplicated models are:
            
            ${array
              .filter((_oppo, j) => i !== j)
              .map(
                (oppo) =>
                  `- application.files[${oppo.fileIndex}].models[${oppo.modelIndex}]`,
              )
              .join("\n")},
          `,
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
  model.foreignFields.forEach((field, i) => {
    MapUtil.take(group, field.name, () => []).push(
      `${accessor}.foreignFields[${i}].name`,
    );
    MapUtil.take(group, field.relation.name, () => []).push(
      `${accessor}.foreignFields[${i}].relation.name`,
    );
  });
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
          message: StringUtil.trim`
            Field ${field} is duplicated.
            
            Accessors of the other duplicated fields are:
            
            ${array
              .filter((_oppo, j) => i !== j)
              .map((a) => `- ${a}`)
              .join("\n")},
          `,
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
          Field name conflicts with an existing table name.

          **What happened?**
          The field "${field.name}" in model "${model.name}" has the same name as another table "${field.name}".
          This can cause confusion and potential issues in the generated code.

          **Why is this a problem?**
          - Naming conflicts can lead to ambiguous references in your code
          - It may cause issues with Prisma's relation inference
          - It makes the schema harder to understand and maintain

          **How to fix this:**
          
          1. **If this is a denormalization field (pre-calculated value):**
             - Consider if this field is really necessary
             - If it's storing aggregated data from the related table, it might be better to calculate it dynamically
             - Remove the field if it's redundant

          2. **If this is a legitimate field:**
             - Rename the field to be more descriptive
             - Good naming examples:
               - Instead of "user", use "user_name" or "user_id"
               - Instead of "order", use "order_status" or "order_count"
               - Instead of "product", use "product_name" or "product_code"

          3. **Naming best practices:**
             - Use specific, descriptive names that indicate the field's purpose
             - Avoid using table names as field names
             - Consider adding a suffix or prefix to clarify the field's role

          Please rename the field or remove it if unnecessary.
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
          message: StringUtil.trim`
            Duplicated index found (${fieldNames.join(", ")}).
            
            Accessors of the other duplicated indexes are:
            
            ${array
              .filter((_oppo, j) => i !== j)
              .map((a) => `- ${a}`)
              .join("\n")},
          `,
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
            Redundant subset unique index detected.

            **What is a subset unique index problem?**
            When you have a unique index on multiple fields, any subset of those fields is automatically unique too.
            This is a fundamental property of unique constraints in databases.

            **Current situation:**
            - You have a unique index on: (${unique.fieldNames.join(", ")})
            - But there's already a unique index on its subset: (${subset.join(", ")})
            - This makes the larger unique index redundant for uniqueness purposes

            **Why is this a problem?**
            1. **Logical redundancy**: If (A) is unique, then (A, B) is automatically unique
            2. **Performance overhead**: Maintaining unnecessary indexes slows down write operations
            3. **Storage waste**: Each index consumes disk space
            4. **Confusion**: It's unclear which uniqueness constraint is the intended one

            **Example to illustrate:**
            If email is unique, then (email, name) is automatically unique because:
            - No two records can have the same email
            - Therefore, no two records can have the same (email, name) combination

            **How to fix:**
            Choose one of these solutions based on your needs:

            1. **If you need uniqueness only:**
               - Keep just the subset unique index: (${subset.join(", ")})
               - Remove the larger unique index

            2. **If you need the multi-field index for query performance:**
               - Keep the subset as unique index: (${subset.join(", ")})
               - Change the larger index to a plain (non-unique) index for performance

            3. **If the subset unique was added by mistake:**
               - Remove the subset unique index
               - Keep the multi-field unique index

            Please review your uniqueness requirements and adjust accordingly.
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
            Inefficient subset index detected - superset index exists.

            **What is a subset/superset index problem?**
            In database indexing, when you have an index on (A, B, C), it can efficiently serve queries 
            that filter by A, or by (A, B), or by (A, B, C). This is called index prefix matching.

            **Current situation:**
            - You have a plain index on: (${x.fieldNames.join(", ")})
            - But there's already a plain index on its superset: (${y.fieldNames.join(", ")})
            - The subset index is redundant because the superset can handle the same queries

            **Why is this a problem?**
            1. **Query efficiency**: The superset index can handle all queries the subset can
            2. **Storage waste**: You're maintaining two indexes where one would suffice
            3. **Write performance**: Each index slows down INSERT, UPDATE, and DELETE operations
            4. **Maintenance overhead**: More indexes mean more work for the database

            **How indexes work (example):**
            If you have an index on (country, city, street):
            - ✅ Can efficiently find by country
            - ✅ Can efficiently find by country + city
            - ✅ Can efficiently find by country + city + street
            - ❌ Cannot efficiently find by city alone
            - ❌ Cannot efficiently find by street alone

            **How to fix:**
            Remove the subset index (${x.fieldNames.join(", ")}) because:
            - The superset index (${y.fieldNames.join(", ")}) already covers these queries
            - You'll save storage space and improve write performance
            - Query performance will remain the same

            **When to keep both indexes:**
            Only if the subset index is UNIQUE (which it isn't in this case), as unique 
            constraints serve a different purpose than performance optimization.

            Please remove the redundant subset index.
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
            GIN index cannot be applied to this field.

            **What is a GIN index?**
            GIN (Generalized Inverted Index) is a special index type in PostgreSQL designed for 
            full-text search and operations on complex data types. In AutoBE, GIN indexes are 
            used exclusively for string fields to enable efficient text searching.

            **Current problem:**
            The field "${gin.fieldName}" specified for GIN index does not exist in the plain fields 
            of model "${model.name}".

            **Possible causes:**
            1. The field name is misspelled
            2. The field is a foreign key field (not a plain field)
            3. The field was removed but the index definition remained

            **How to fix:**
            1. Check if the field name is correct
            2. Ensure the field exists in the plainFields array
            3. Make sure the field is of type "string" (GIN indexes only work with strings)
            4. If the field doesn't exist, either:
               - Add the missing string field to plainFields
               - Remove this GIN index definition

            **Example of correct GIN index usage:**
            plainFields: [
              { name: "content", type: "string" }  // ✓ Can use GIN index
            ]
            ginIndexes: [
              { fieldName: "content" }  // ✓ Correct
            ]
          `,
        });
      else if (model.plainFields[pIndex].type !== "string")
        errors.push({
          path: `${accessor}.ginIndexes[${i}].fieldName`,
          table: model.name,
          field: model.plainFields[pIndex].name,
          message: StringUtil.trim`
            GIN index type mismatch - requires string field.

            **What is a GIN index?**
            GIN (Generalized Inverted Index) is PostgreSQL's specialized index for full-text search.
            It's designed to efficiently search within text content, making it perfect for features like:
            - Search functionality in articles or posts
            - Finding keywords in product descriptions
            - Filtering by text content

            **Current problem:**
            You're trying to apply a GIN index to field "${gin.fieldName}" which is of type "${model.plainFields[pIndex].type}".
            GIN indexes can ONLY be applied to "string" type fields.

            **Why string fields only?**
            GIN indexes work by breaking down text into searchable tokens (words, phrases).
            Other data types like numbers, booleans, or dates don't have this text structure.

            **How to fix:**

            1. **If you need text search on this field:**
               - Change the field type to "string"
               - Example: If storing a product code as number, consider storing as string instead

            2. **If the field should remain as ${model.plainFields[pIndex].type}:**
               - Remove the GIN index for this field
               - Use a regular index instead (plainIndexes)
               - Consider if you really need an index on this field

            3. **Alternative indexing strategies:**
               - For ${model.plainFields[pIndex].type} fields, use plainIndexes for general performance
               - For unique ${model.plainFields[pIndex].type} values, use uniqueIndexes
               - GIN indexes should be reserved for text search scenarios only

            **Location of the field:**
            - Field definition: ${`${accessor}.plainFields[${pIndex}]`}

            Please either change the field type to "string" or remove the GIN index.
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
    // DUPLICATED NAME

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

              **What is Cross-reference dependency?**
              A cross-reference dependency (also known as circular dependency) occurs when two models 
              reference each other through foreign key fields. This creates a circular relationship 
              where Model A references Model B, and Model B also references Model A.

              **Current situation:**
              - ${model.name} model has a foreign key field "${field.name}" that references ${field.relation.targetModel}
              - ${field.relation.targetModel} model also has a foreign key field that references ${model.name}
              - Location of opposite reference: application.files[${target.fileIndex}].models[${target.modelIndex}].foreignFields[${j}].relation.targetModel

              **Why is this a problem?**
              Circular dependencies can cause issues with:
              - Database initialization (which table to create first?)
              - Data insertion (which record to insert first?)
              - Cascading updates and deletes
              - Query performance and complexity

              **How to fix this:**
              You need to remove one of the foreign key relationships. Here's how to decide:

              1. **Identify the primary relationship direction**
                 - Which model is the "parent" and which is the "child"?
                 - Which relationship is essential for your business logic?
                 - Example: In User ↔ Profile, User is typically the parent

              2. **Remove the redundant foreign key**
                 - Keep the foreign key in the child model pointing to the parent
                 - Remove the foreign key in the parent model pointing to the child
                 - You can still access the reverse relationship through Prisma's implicit relations

              3. **Update any affected indexes**
                 - Remove indexes that include the deleted foreign key field
                 - Update composite indexes if necessary

              **Example solution:**
              If you have:
              - User model with profileId foreign key
              - Profile model with userId foreign key
              
              You should:
              - Keep userId in Profile (child references parent)
              - Remove profileId from User
              - Access user's profile through: user.profile (Prisma will handle this)

              Please eliminate the circular dependency and regenerate the schema.`,
          });
        }
      });
    }
  });

  return errors;
}
