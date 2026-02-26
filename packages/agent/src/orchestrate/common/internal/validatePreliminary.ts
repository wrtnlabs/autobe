import { AutoBeOpenApi, AutoBePreliminaryKind } from "@autobe/interface";
import { AutoBeOpenApiEndpointComparator, StringUtil } from "@autobe/utils";
import { HashSet } from "tstl";
import typia, { IValidation } from "typia";

import { AutoBeSystemPromptConstant } from "../../../constants/AutoBeSystemPromptConstant";
import { AutoBePreliminaryController } from "../AutoBePreliminaryController";
import { IAutoBePreliminaryRequest } from "../structures/AutoBePreliminaryRequest";
import { IAutoBePreliminaryGetAnalysisFiles } from "../structures/IAutoBePreliminaryGetAnalysisFiles";
import { IAutoBePreliminaryGetAnalysisSections } from "../structures/IAutoBePreliminaryGetAnalysisSections";
import { IAutoBePreliminaryGetDatabaseSchemas } from "../structures/IAutoBePreliminaryGetDatabaseSchemas";
import { IAutoBePreliminaryGetInterfaceOperations } from "../structures/IAutoBePreliminaryGetInterfaceOperations";
import { IAutoBePreliminaryGetInterfaceSchemas } from "../structures/IAutoBePreliminaryGetInterfaceSchemas";
import { IAutoBePreliminaryGetPreviousAnalysisFiles } from "../structures/IAutoBePreliminaryGetPreviousAnalysisFiles";
import { IAutoBePreliminaryGetPreviousAnalysisSections } from "../structures/IAutoBePreliminaryGetPreviousAnalysisSections";
import { IAutoBePreliminaryGetPreviousDatabaseSchemas } from "../structures/IAutoBePreliminaryGetPreviousDatabaseSchemas";
import { IAutoBePreliminaryGetPreviousInterfaceOperations } from "../structures/IAutoBePreliminaryGetPreviousInterfaceOperations";
import { IAutoBePreliminaryGetPreviousInterfaceSchemas } from "../structures/IAutoBePreliminaryGetPreviousInterfaceSchemas";
import { IAutoBePreliminaryGetRealizeCollectors } from "../structures/IAutoBePreliminaryGetRealizeCollectors";
import { IAutoBePreliminaryGetRealizeTransformers } from "../structures/IAutoBePreliminaryGetRealizeTransformers";

export const validatePreliminary = <Kind extends AutoBePreliminaryKind>(
  controller: AutoBePreliminaryController<Kind>,
  data: IAutoBePreliminaryRequest<Kind>,
): IValidation<IAutoBePreliminaryRequest<Kind>> => {
  const type: Exclude<
    IAutoBePreliminaryRequest<AutoBePreliminaryKind>["request"]["type"],
    `getPrevious${string}`
  > = (
    data.request.type.startsWith("getPrevious")
      ? data.request.type.replace("getPrevious", "get")
      : data.request.type
  ) as Exclude<
    IAutoBePreliminaryRequest<AutoBePreliminaryKind>["request"]["type"],
    `getPrevious${string}`
  >;
  const func = PreliminaryApplicationValidator[type];
  // biome-ignore-start lint: intended
  return func(
    controller as any,
    data as any,
    data.request.type.startsWith("getPrevious"),
  ) as any;
  // biome-ignore-end lint: intended
};

namespace PreliminaryApplicationValidator {
  export const getAnalysisFiles = (
    controller: AutoBePreliminaryController<
      "analysisFiles" | "previousAnalysisFiles"
    >,
    input: IAutoBePreliminaryRequest<"analysisFiles" | "previousAnalysisFiles">,
    previous: boolean,
  ): IValidation<
    IAutoBePreliminaryRequest<"analysisFiles" | "previousAnalysisFiles">
  > => {
    const accessor: "analysisFiles" | "previousAnalysisFiles" = previous
      ? "previousAnalysisFiles"
      : "analysisFiles";
    if (controller.getAll()[accessor] === undefined)
      return nonExisting(controller, accessor, input);

    const all: Set<string> = new Set(
      controller.getAll()[accessor].map((f) => f.filename),
    );
    const oldbie: Set<string> = new Set(
      controller.getLocal()[accessor].map((f) => f.filename),
    );
    const newbie: Set<string> = new Set(
      controller
        .getAll()
        [accessor].filter((f) => oldbie.has(f.filename) === false)
        .map((f) => f.filename),
    );

    const errors: IValidation.IError[] = [];
    input.request.fileNames.forEach((key, i) => {
      if (all.has(key) === false)
        errors.push({
          path: `$input.request.fileNames[${i}]`,
          value: key,
          expected: Array.from(newbie)
            .map((x) => JSON.stringify(x))
            .join(" | "),
          description: StringUtil.trim`
            You've requested a NON-EXISTING analysis file: ${JSON.stringify(key)}

            This file does NOT exist in the system. This is NOT a recommendation,
            but an ABSOLUTE INSTRUCTION you MUST follow:

            ⛔ NEVER request ${JSON.stringify(key)} again - it does not exist!
            ⛔ NEVER assume or invent file names that are not in the list below!
            ⛔ You MUST choose ONLY from the available files listed below!

            Available analysis files you can request:

            Filename | Document Type
            ---------|---------------
            ${controller
              .getAll()
              [accessor].filter((f) => newbie.has(f.filename))
              .sort((a, b) => a.filename.localeCompare(b.filename))
              .map((f) => `${f.filename} | ${f.documentType}`)
              .join("\n")}

            ${
              newbie.size === 0
                ? AutoBeSystemPromptConstant.PRELIMINARY_ANALYSIS_FILE_EXHAUSTED.replace(
                    "getAnalysisFiles" satisfies IAutoBePreliminaryGetAnalysisFiles["type"],
                    previous
                      ? ("getPreviousAnalysisFiles" satisfies IAutoBePreliminaryGetPreviousAnalysisFiles["type"])
                      : ("getAnalysisFiles" satisfies IAutoBePreliminaryGetAnalysisFiles["type"]),
                  )
                : ""
            }
          `,
        });
    });
    if (input.request.fileNames.every((k) => oldbie.has(k)))
      errors.push({
        path: `$input.request`,
        value: input.request,
        expected: controller.getArgumentTypeNames().join(" | "),
        description:
          AutoBeSystemPromptConstant.PRELIMINARY_ARGUMENT_ALL_DUPLICATED.replaceAll(
            "{{REQUEST_TYPE}}",
            typia.misc.literals<
              IAutoBePreliminaryGetAnalysisFiles["type"]
            >()[0],
          )
            .replace(
              "{{OLDBIE}}",
              Array.from(oldbie.keys())
                .map((k) => `- ${k}`)
                .join("\n"),
            )
            .replace(
              "{{NEWBIE}}",
              Array.from(newbie.keys())
                .map((k) => `- ${k}`)
                .join("\n") || "(none)",
            ),
      });
    return finalize(input, errors);
  };

  export const getAnalysisSections = (
    controller: AutoBePreliminaryController<
      "analysisSections" | "previousAnalysisSections"
    >,
    input: IAutoBePreliminaryRequest<
      "analysisSections" | "previousAnalysisSections"
    >,
    previous: boolean,
  ): IValidation<
    IAutoBePreliminaryRequest<"analysisSections" | "previousAnalysisSections">
  > => {
    const accessor: "analysisSections" | "previousAnalysisSections" = previous
      ? "previousAnalysisSections"
      : "analysisSections";
    if (controller.getAll()[accessor] === undefined)
      return nonExisting(controller, accessor, input);

    const all: Set<number> = new Set(
      controller.getAll()[accessor].map((s) => s.id),
    );
    const oldbie: Set<number> = new Set(
      controller.getLocal()[accessor].map((s) => s.id),
    );
    const newbie: Set<number> = new Set(
      controller
        .getAll()
        [accessor].filter((s) => oldbie.has(s.id) === false)
        .map((s) => s.id),
    );

    const errors: IValidation.IError[] = [];
    input.request.sectionIds.forEach((key, i) => {
      if (all.has(key) === false)
        errors.push({
          path: `$input.request.sectionIds[${i}]`,
          value: key,
          expected: Array.from(newbie)
            .sort((a, b) => a - b)
            .map((x) => String(x))
            .join(" | "),
          description: StringUtil.trim`
            You've requested a NON-EXISTING analysis section ID: ${key}

            This section ID does NOT exist in the system. This is NOT a recommendation,
            but an ABSOLUTE INSTRUCTION you MUST follow:

            ⛔ NEVER request section ID ${key} again - it does not exist!
            ⛔ NEVER assume or invent section IDs that are not in the catalog!
            ⛔ You MUST choose ONLY from the available section IDs listed in the catalog!

            Available analysis sections you can request:

            ID | File | Unit | Section
            ---|------|------|--------
            ${controller
              .getAll()
              [accessor].filter((s) => newbie.has(s.id))
              .sort((a, b) => a.id - b.id)
              .map(
                (s) =>
                  `${s.id} | ${s.filename} | ${s.unitTitle} | ${s.sectionTitle}`,
              )
              .join("\n")}

            ${
              newbie.size === 0
                ? AutoBeSystemPromptConstant.PRELIMINARY_ANALYSIS_SECTION_EXHAUSTED.replace(
                    "getAnalysisSections" satisfies IAutoBePreliminaryGetAnalysisSections["type"],
                    previous
                      ? ("getPreviousAnalysisSections" satisfies IAutoBePreliminaryGetPreviousAnalysisSections["type"])
                      : ("getAnalysisSections" satisfies IAutoBePreliminaryGetAnalysisSections["type"]),
                  )
                : ""
            }
          `,
        });
    });
    if (input.request.sectionIds.every((k) => oldbie.has(k)))
      errors.push({
        path: `$input.request`,
        value: input.request,
        expected: controller
          .getArgumentTypeNames()
          .filter(
            (k) =>
              k !== typia.reflect.name<IAutoBePreliminaryGetAnalysisSections>(),
          )
          .join(" | "),
        description:
          AutoBeSystemPromptConstant.PRELIMINARY_ARGUMENT_ALL_DUPLICATED.replaceAll(
            "{{REQUEST_TYPE}}",
            typia.misc.literals<
              IAutoBePreliminaryGetAnalysisSections["type"]
            >()[0],
          ),
      });
    return finalize(input, errors);
  };

  export const getDatabaseSchemas = (
    controller: AutoBePreliminaryController<
      "databaseSchemas" | "previousDatabaseSchemas"
    >,
    input: IAutoBePreliminaryRequest<
      "databaseSchemas" | "previousDatabaseSchemas"
    >,
    previous: boolean,
  ): IValidation<
    IAutoBePreliminaryRequest<"databaseSchemas" | "previousDatabaseSchemas">
  > => {
    const accessor: "databaseSchemas" | "previousDatabaseSchemas" = previous
      ? "previousDatabaseSchemas"
      : "databaseSchemas";
    if (controller.getAll()[accessor] === undefined)
      return nonExisting(controller, accessor, input);

    const all: Set<string> = new Set(
      controller.getAll()[accessor].map((s) => s.name),
    );
    const oldbie: Set<string> = new Set(
      controller.getLocal()[accessor].map((s) => s.name),
    );
    const newbie: Set<string> = new Set(
      controller
        .getAll()
        [accessor].filter((s) => oldbie.has(s.name) === false)
        .map((s) => s.name),
    );

    const errors: IValidation.IError[] = [];
    const quoted: string[] = Array.from(newbie)
      .sort()
      .map((x) => JSON.stringify(x));

    input.request.schemaNames.forEach((key, i) => {
      if (all.has(key) === false)
        errors.push({
          path: `$input.request.schemaNames[${i}]`,
          value: key,
          expected: quoted.join(" | "),
          description: StringUtil.trim`
            You've referenced a NON-EXISTING database schema name: ${JSON.stringify(key)}

            This database schema does NOT exist in the system. This is NOT a recommendation,
            but an ABSOLUTE INSTRUCTION you MUST follow:

            ⛔ NEVER request ${JSON.stringify(key)} again - it does not exist!
            ⛔ NEVER assume or invent schema names that are not in the list below!
            ⛔ NEVER repeat the same invalid value - I repeat: ${JSON.stringify(key)} is INVALID!
            ⛔ You MUST choose ONLY from the existing database schemas listed below!

            Existing database schema names you can request:

            ${quoted.map((q) => `- ${q}`).join("\n")}

            ${
              newbie.size === 0
                ? AutoBeSystemPromptConstant.PRELIMINARY_DATABASE_SCHEMA_EXHAUSTED.replace(
                    "getDatabaseSchemas" satisfies IAutoBePreliminaryGetDatabaseSchemas["type"],
                    previous
                      ? ("getPreviousDatabaseSchemas" satisfies IAutoBePreliminaryGetPreviousDatabaseSchemas["type"])
                      : ("getDatabaseSchemas" satisfies IAutoBePreliminaryGetDatabaseSchemas["type"]),
                  )
                : ""
            }
          `,
        });
    });
    if (input.request.schemaNames.every((k) => oldbie.has(k)))
      errors.push({
        path: `$input.request`,
        value: input.request,
        expected: controller.getArgumentTypeNames().join(" | "),
        description:
          AutoBeSystemPromptConstant.PRELIMINARY_ARGUMENT_ALL_DUPLICATED.replaceAll(
            "{{REQUEST_TYPE}}",
            typia.misc.literals<
              IAutoBePreliminaryGetDatabaseSchemas["type"]
            >()[0],
          )
            .replace(
              "{{OLDBIE}}",
              Array.from(oldbie.keys())
                .map((k) => `- ${k}`)
                .join("\n"),
            )
            .replace(
              "{{NEWBIE}}",
              Array.from(newbie.keys())
                .map((k) => `- ${k}`)
                .join("\n") || "(none)",
            ),
      });
    return finalize(input, errors);
  };

  export const getInterfaceOperations = (
    controller: AutoBePreliminaryController<
      "interfaceOperations" | "previousInterfaceOperations"
    >,
    input: IAutoBePreliminaryRequest<
      "interfaceOperations" | "previousInterfaceOperations"
    >,
    previous: boolean,
  ): IValidation<
    IAutoBePreliminaryRequest<
      "interfaceOperations" | "previousInterfaceOperations"
    >
  > => {
    const accessor: "interfaceOperations" | "previousInterfaceOperations" =
      previous ? "previousInterfaceOperations" : "interfaceOperations";
    if (controller.getAll()[accessor] === undefined)
      return nonExisting(controller, accessor, input);

    const all: HashSet<AutoBeOpenApi.IEndpoint> = new HashSet(
      controller.getAll()[accessor].map((o) => ({
        method: o.method,
        path: o.path,
      })),
      AutoBeOpenApiEndpointComparator.hashCode,
      AutoBeOpenApiEndpointComparator.equals,
    );
    const oldbie: HashSet<AutoBeOpenApi.IEndpoint> = new HashSet(
      controller.getLocal()[accessor].map((o) => ({
        method: o.method,
        path: o.path,
      })),
      AutoBeOpenApiEndpointComparator.hashCode,
      AutoBeOpenApiEndpointComparator.equals,
    );
    const newbie: HashSet<AutoBeOpenApi.IEndpoint> = new HashSet(
      controller
        .getAll()
        [accessor].map((o) => ({
          method: o.method,
          path: o.path,
        }))
        .filter((e) => oldbie.has(e) === false),
      AutoBeOpenApiEndpointComparator.hashCode,
      AutoBeOpenApiEndpointComparator.equals,
    );

    const errors: IValidation.IError[] = [];
    input.request.endpoints.forEach((key, i) => {
      if (all.has(key) === false)
        errors.push({
          path: `$input.request.endpoints[${i}]`,
          value: key,
          expected: "AutoBeOpenApi.IEndpoint",
          description: StringUtil.trim`
            You've requested a NON-EXISTING API endpoint: \`${JSON.stringify(key)}\`

            This endpoint does NOT exist in the system. This is NOT a recommendation,
            but an ABSOLUTE INSTRUCTION you MUST follow:

            ⛔ NEVER request \`${JSON.stringify(key)}\` again - it does not exist!
            ⛔ NEVER assume or invent endpoints that are not in the list below!
            ⛔ NEVER repeat the same invalid endpoint!
            ⛔ You MUST choose ONLY from the existing endpoints listed below!

            Existing API endpoints you can request:
            
            Method | Path
            ------ | ----
            ${newbie
              .toJSON()
              .sort(AutoBeOpenApiEndpointComparator.compare)
              .map((o) => `${o.method} | ${o.path}`)
              .join("\n")}

            ${
              newbie.size() === 0
                ? AutoBeSystemPromptConstant.PRELIMINARY_INTERFACE_OPERATION_EXHAUSTED.replace(
                    "getInterfaceOperations" satisfies IAutoBePreliminaryGetInterfaceOperations["type"],
                    previous
                      ? ("getPreviousInterfaceOperations" satisfies IAutoBePreliminaryGetPreviousInterfaceOperations["type"])
                      : ("getInterfaceOperations" satisfies IAutoBePreliminaryGetInterfaceOperations["type"]),
                  )
                : ""
            }
          `,
        });
    });
    if (input.request.endpoints.every((k) => oldbie.has(k)))
      errors.push({
        path: `$input.request`,
        value: input.request,
        expected: controller.getArgumentTypeNames().join(" | "),
        description:
          AutoBeSystemPromptConstant.PRELIMINARY_ARGUMENT_ALL_DUPLICATED.replaceAll(
            "{{REQUEST_TYPE}}",
            typia.misc.literals<
              IAutoBePreliminaryGetInterfaceOperations["type"]
            >()[0],
          )
            .replace(
              "{{OLDBIE}}",
              StringUtil.trim`
                Path | Method
                -----|-------
                ${Array.from(oldbie.toJSON())
                  .sort(AutoBeOpenApiEndpointComparator.compare)
                  .map((o) => `${o.path} | ${o.method}`)
                  .join("\n")}
              `,
            )
            .replace(
              "{{NEWBIE}}",
              newbie
                .toJSON()
                .sort(AutoBeOpenApiEndpointComparator.compare)
                .map((o) => `- ${o.method} ${o.path}`)
                .join("\n") || "(none)",
            ),
      });
    return finalize(input, errors);
  };

  export const getInterfaceSchemas = (
    controller: AutoBePreliminaryController<
      "interfaceSchemas" | "previousInterfaceSchemas"
    >,
    input: IAutoBePreliminaryRequest<
      "interfaceSchemas" | "previousInterfaceSchemas"
    >,
    previous: boolean,
  ): IValidation<
    IAutoBePreliminaryRequest<"interfaceSchemas" | "previousInterfaceSchemas">
  > => {
    const accessor: "interfaceSchemas" | "previousInterfaceSchemas" = previous
      ? "previousInterfaceSchemas"
      : "interfaceSchemas";
    if (controller.getAll()[accessor] === undefined)
      return nonExisting(controller, accessor, input);

    const all: Set<string> = new Set(
      Object.keys(controller.getAll()[accessor]),
    );
    const oldbie: Set<string> = new Set(
      Object.keys(controller.getLocal()[accessor]),
    );
    const newbie: Set<string> = new Set(
      Object.keys(controller.getAll()[accessor]).filter(
        (k) => oldbie.has(k) === false,
      ),
    );

    const errors: IValidation.IError[] = [];
    const quoted: string[] = Array.from(newbie)
      .sort()
      .map((k) => JSON.stringify(k));

    input.request.typeNames.forEach((key, i) => {
      if (all.has(key) === false)
        errors.push({
          path: `$input.request.typeNames[${i}]`,
          value: key,
          expected: quoted.join(" | "),
          description: StringUtil.trim`
            You've referenced a NON-EXISTING interface schema name: ${JSON.stringify(key)}

            This interface schema does NOT exist in the system. This is NOT a recommendation,
            but an ABSOLUTE INSTRUCTION you MUST follow:

            ⛔ NEVER request ${JSON.stringify(key)} again - it does not exist!
            ⛔ NEVER assume or invent schema names that are not in the list below!
            ⛔ NEVER repeat the same invalid value - I repeat: ${JSON.stringify(key)} is INVALID!
            ⛔ You MUST choose ONLY from the existing interface schemas listed below!

            Existing interface schema names you can request:

            ${quoted.map((q) => `- ${q}`).join("\n")}

            ${
              newbie.size === 0
                ? AutoBeSystemPromptConstant.PRELIMINARY_INTERFACE_SCHEMA_EXHAUSTED.replace(
                    "getInterfaceSchemas" satisfies IAutoBePreliminaryGetInterfaceSchemas["type"],
                    previous
                      ? ("getPreviousInterfaceSchemas" satisfies IAutoBePreliminaryGetPreviousInterfaceSchemas["type"])
                      : ("getInterfaceSchemas" satisfies IAutoBePreliminaryGetInterfaceSchemas["type"]),
                  )
                : ""
            }
          `,
        });
    });
    if (input.request.typeNames.every((k) => oldbie.has(k)))
      errors.push({
        path: `$input.request`,
        value: input.request,
        expected: controller.getArgumentTypeNames().join(" | "),
        description:
          AutoBeSystemPromptConstant.PRELIMINARY_ARGUMENT_ALL_DUPLICATED.replaceAll(
            "{{REQUEST_TYPE}}",
            typia.misc.literals<
              IAutoBePreliminaryGetInterfaceSchemas["type"]
            >()[0],
          )
            .replace(
              "{{OLDBIE}}",
              Array.from(oldbie.keys())
                .map((k) => `- ${k}`)
                .join("\n"),
            )
            .replace(
              "{{NEWBIE}}",
              Array.from(newbie.keys())
                .map((k) => `- ${k}`)
                .join("\n") || "(none)",
            ),
      });
    return finalize(input, errors);
  };

  export const getRealizeCollectors = (
    controller: AutoBePreliminaryController<"realizeCollectors">,
    input: IAutoBePreliminaryRequest<"realizeCollectors">,
    _previous: boolean,
  ): IValidation<IAutoBePreliminaryRequest<"realizeCollectors">> => {
    const all: Set<string> = new Set(
      controller.getAll().realizeCollectors.map((c) => c.plan.dtoTypeName),
    );
    const oldbie: Set<string> = new Set(
      controller.getLocal().realizeCollectors.map((c) => c.plan.dtoTypeName),
    );
    const newbie: Set<string> = new Set(
      controller
        .getAll()
        .realizeCollectors.filter(
          (c) => oldbie.has(c.plan.dtoTypeName) === false,
        )
        .map((c) => c.plan.dtoTypeName),
    );

    const errors: IValidation.IError[] = [];
    const quoted: string[] = Array.from(newbie)
      .sort()
      .map((x) => JSON.stringify(x));

    input.request.dtoTypeNames.forEach((key, i) => {
      if (all.has(key) === false)
        errors.push({
          path: `$input.request.dtoTypeNames[${i}]`,
          value: key,
          expected: quoted.join(" | "),
          description: StringUtil.trim`
            You've referenced a NON-EXISTING realize collector: ${JSON.stringify(key)}

            This collector does NOT exist in the system. This is NOT a recommendation,
            but an ABSOLUTE INSTRUCTION you MUST follow:

            ⛔ NEVER request ${JSON.stringify(key)} again - it does not exist!
            ⛔ NEVER assume or invent collector names that are not in the list below!
            ⛔ NEVER repeat the same invalid value - I repeat: ${JSON.stringify(key)} is INVALID!
            ⛔ You MUST choose ONLY from the existing collectors listed below!

            Existing realize collectors you can request:

            ${quoted.map((q) => `- ${q}`).join("\n")}

            ${
              newbie.size === 0
                ? AutoBeSystemPromptConstant.PRELIMINARY_REALIZE_COLLECTOR_EXHAUSTED
                : ""
            }
          `,
        });
    });
    if (input.request.dtoTypeNames.every((k) => oldbie.has(k)))
      errors.push({
        path: `$input.request`,
        value: input.request,
        expected: controller.getArgumentTypeNames().join(" | "),
        description:
          AutoBeSystemPromptConstant.PRELIMINARY_ARGUMENT_ALL_DUPLICATED.replaceAll(
            "{{REQUEST_TYPE}}",
            typia.misc.literals<
              IAutoBePreliminaryGetRealizeCollectors["type"]
            >()[0],
          )
            .replace(
              "{{OLDBIE}}",
              Array.from(oldbie.keys())
                .map((k) => `- ${k}`)
                .join("\n"),
            )
            .replace(
              "{{NEWBIE}}",
              Array.from(newbie.keys())
                .map((k) => `- ${k}`)
                .join("\n") || "(none)",
            ),
      });
    return finalize(input, errors);
  };

  export const getRealizeTransformers = (
    controller: AutoBePreliminaryController<"realizeTransformers">,
    input: IAutoBePreliminaryRequest<"realizeTransformers">,
    _previous: boolean,
  ): IValidation<IAutoBePreliminaryRequest<"realizeTransformers">> => {
    const all: Set<string> = new Set(
      controller.getAll().realizeTransformers.map((t) => t.plan.dtoTypeName),
    );
    const oldbie: Set<string> = new Set(
      controller.getLocal().realizeTransformers.map((t) => t.plan.dtoTypeName),
    );
    const newbie: Set<string> = new Set(
      controller
        .getAll()
        .realizeTransformers.filter(
          (t) => oldbie.has(t.plan.dtoTypeName) === false,
        )
        .map((t) => t.plan.dtoTypeName),
    );

    const errors: IValidation.IError[] = [];
    const quoted: string[] = Array.from(newbie)
      .sort()
      .map((x) => JSON.stringify(x));

    input.request.dtoTypeNames.forEach((key, i) => {
      if (all.has(key) === false)
        errors.push({
          path: `$input.request.dtoTypeNames[${i}]`,
          value: key,
          expected: quoted.join(" | "),
          description: StringUtil.trim`
            You've referenced a NON-EXISTING realize transformer: ${JSON.stringify(key)}

            This transformer does NOT exist in the system. This is NOT a recommendation,
            but an ABSOLUTE INSTRUCTION you MUST follow:

            ⛔ NEVER request ${JSON.stringify(key)} again - it does not exist!
            ⛔ NEVER assume or invent transformer names that are not in the list below!
            ⛔ NEVER repeat the same invalid value - I repeat: ${JSON.stringify(key)} is INVALID!
            ⛔ You MUST choose ONLY from the existing transformers listed below!

            Existing realize transformers you can request:
            
            ${quoted.map((q) => `- ${q}`).join("\n")}

            ${
              newbie.size === 0
                ? AutoBeSystemPromptConstant.PRELIMINARY_REALIZE_TRANSFORMER_EXHAUSTED
                : ""
            }
          `,
        });
    });
    if (input.request.dtoTypeNames.every((k) => oldbie.has(k)))
      errors.push({
        path: `$input.request`,
        value: input.request,
        expected: controller.getArgumentTypeNames().join(" | "),
        description:
          AutoBeSystemPromptConstant.PRELIMINARY_ARGUMENT_ALL_DUPLICATED.replaceAll(
            "{{REQUEST_TYPE}}",
            typia.misc.literals<
              IAutoBePreliminaryGetRealizeTransformers["type"]
            >()[0],
          )
            .replace(
              "{{OLDBIE}}",
              Array.from(oldbie.keys())
                .map((k) => `- ${k}`)
                .join("\n"),
            )
            .replace(
              "{{NEWBIE}}",
              Array.from(newbie.keys())
                .map((k) => `- ${k}`)
                .join("\n") || "(none)",
            ),
      });
    return finalize(input, errors);
  };
}

const finalize = <T>(data: T, errors: IValidation.IError[]): IValidation<T> =>
  errors.length === 0
    ? ({
        success: true,
        data,
      } satisfies IValidation.ISuccess<T>)
    : ({
        success: false,
        data,
        errors,
      } satisfies IValidation.IFailure);

const nonExisting = <Kind extends AutoBePreliminaryKind>(
  controller: AutoBePreliminaryController<Kind>,
  kind: Kind,
  data: IAutoBePreliminaryRequest<Kind>,
): IValidation.IFailure => ({
  success: false,
  data,
  errors: [
    {
      path: "$input.request.type",
      expected: controller
        .getKinds()
        .map((k) => JSON.stringify(k))
        .join(" | "),
      value: kind,
      description: StringUtil.trim`
        You've requested a NON-EXISTING preliminary data type: "${kind}"

        This data type does NOT exist in the current context. This is NOT a recommendation,
        but an ABSOLUTE INSTRUCTION you MUST follow:

        ⛔ NEVER request "${kind}" again - it is NOT available in this context!
        ⛔ NEVER assume data types that are not in the list below!
        ⛔ NEVER repeat the same invalid request type!
        ⛔ You MUST choose ONLY from the available kinds listed below!

        Available preliminary data kinds you can request:
        ${controller
          .getKinds()
          .map((k) => `- ${k}`)
          .join("\n")}
      `,
    },
  ],
});
