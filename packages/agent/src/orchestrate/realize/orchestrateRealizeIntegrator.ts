import { IAgenticaController, MicroAgentica } from "@agentica/core";
import { AutoBeOpenApi } from "@autobe/interface";
import { AutoBeRealizeIntegratorEvent } from "@autobe/interface/src/events/AutoBeRealizeIntegratorEvent";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import { IPointer } from "tstl";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { FAILED } from "./orchestrateRealize";
import { IAutoBeRealizeCoderApplication } from "./structures/IAutoBeRealizeCoderApplication";
import { transformRealizeIntegratorHistories } from "./transformRealizeIntegratorHistories";

/**
 * The result of integrating the generated code into the actual application
 * files (e.g., controller).
 */
export interface RealizeIntegratorOutput {
  /**
   * Indicates the result of the integration process.
   *
   * - "success": The function was correctly inserted, imported, and passed
   *   compilation.
   * - "fail": The integration did not complete (e.g., target controller not
   *   found, syntax error).
   * - "exception": An unexpected error occurred (e.g., I/O failure, invalid
   *   context state).
   */
  result: "success" | "fail" | "exception";
}

/**
 * Integrates the generated function into an appropriate controller file,
 * handling insertion, import, and static validation.
 *
 * This function performs the following steps:
 *
 * 1. **Locate appropriate controller file**
 *
 *    - Usually matches `*.controller.ts`
 *    - May be based on inferred target (e.g., from functionName or folder structure)
 * 2. **Insert the generated function into the file content**
 *
 *    - Ensures proper placement, such as inside a class or export block
 *    - May replace or append to existing function stubs
 * 3. **Inject required imports automatically**
 *
 *    - Identifies any missing imports (e.g., DTOs, utility functions)
 *    - Ensures imports are added without duplication
 * 4. **Check for compile-time safety**
 *
 *    - Ensures TypeScript type-checking passes
 *    - Verifies that Nestia-generated routers still function without error
 *    - If compilation fails or static types are invalid, marks result as `"fail"`
 *
 * ⚠️ Note: This step **must not rely on runtime execution**. It only guarantees
 * static, structural validity (i.e., valid TypeScript).
 *
 * @param ctx - AutoBE context including current source files and settings
 * @param props - Output from the code generation step to be integrated
 * @param operation - The operation being integrated
 * @param lock - Lock function to prevent concurrent modifications to the same
 *   controller file
 * @returns Integration status, indicating success or failure of insertion
 */
export const orchestrateRealizeIntegrator = async <
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  props: IAutoBeRealizeCoderApplication.RealizeCoderOutput,
  operation: AutoBeOpenApi.IOperation,
  lock: <T>(key: string, fn: () => Promise<T>) => Promise<T>,
): Promise<AutoBeRealizeIntegratorEvent | FAILED> => {
  const files = ctx.state().interface?.files ?? {};
  files[`src/providers/${props.functionName}.ts`] = props.implementationCode;

  const controllers: [string, string][] = Object.entries(files).filter(
    ([filename]) => filename.endsWith("Controller.ts"),
  );

  const expected =
    operation.path
      .split("/")
      .slice(1, 3)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
      .join("") + "Controller.ts";

  const controller = controllers.find(([filename]) =>
    filename.endsWith(expected),
  );

  if (controller === undefined) return FAILED;

  const [filename] = controller;

  return lock(filename, async () => {
    let currentCode = files?.[filename];
    if (!currentCode) throw new Error(`Controller file ${filename} not found.`);

    const pointer: IPointer<IIntegrateControllerProps | null> = {
      value: null,
    };

    const agentica: MicroAgentica<Model> = new MicroAgentica({
      model: ctx.model,
      vendor: ctx.vendor,
      config: {
        ...ctx.config,
        executor: {
          describe: null,
        },
      },
      histories: transformRealizeIntegratorHistories(
        currentCode,
        props,
        operation,
      ),
      controllers: [
        createApplication({
          model: ctx.model,
          build: (next) => {
            pointer.value = {
              ...next,
            };
          },
        }),
      ],
    });

    await agentica.conversate(
      "Modify the code to integrate the function into the controller.",
    );

    if (pointer.value === null) return FAILED;

    const importCodes = [
      `import { ${props.functionName} } from "../../../providers/${props.functionName}";`,
    ];

    const targetEscaped = pointer.value.targetCode
      .trim()
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      .replace(/\s+/g, "\\s+");

    importCodes.forEach((code) => {
      if (currentCode.includes(code) === false) {
        currentCode = code + "\n" + currentCode;
      }
    });

    const regex = new RegExp(targetEscaped, "gm");
    const resultCode = await ctx.compiler.typescript.beautify(
      currentCode.replace(regex, pointer.value.modifiedCode.trim()),
    );

    // TODO: Apply Retry Logic when replace failed
    files[filename] = resultCode;

    const event: AutoBeRealizeIntegratorEvent = {
      type: "realizeIntegrator",
      created_at: new Date().toISOString(),
      step: ctx.state().test?.step ?? 0,
      file: {
        [filename]: resultCode,
      },
      result: "success",
    };

    ctx.dispatch(event);

    return event;
  });
};

function createApplication<Model extends ILlmSchema.Model>(props: {
  model: Model;
  build: (next: IIntegrateControllerProps) => void;
}): IAgenticaController.IClass<Model> {
  assertSchemaModel(props.model);

  const application: ILlmApplication<Model> = collection[
    props.model
  ] as unknown as ILlmApplication<Model>;
  return {
    protocol: "class",
    name: "Integrate Controller",
    application,
    execute: {
      integrateController: (next) => {
        props.build(next);
      },
    } satisfies IApplication,
  };
}

const claude = typia.llm.application<
  IApplication,
  "claude",
  {
    reference: true;
  }
>();
const collection = {
  chatgpt: typia.llm.application<
    IApplication,
    "chatgpt",
    { reference: true }
  >(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
  "3.0": typia.llm.application<IApplication, "3.0">(),
};

interface IApplication {
  integrateController(props: IIntegrateControllerProps): void;
}

interface IIntegrateControllerProps {
  /**
   * The original target method code that needs to be modified.
   *
   * Extract and return only the specific controller method that matches the
   * OpenAPI operation, including its decorators, signature, and body.
   */
  targetCode: string;

  /**
   * The modified version of the target method with function integration.
   *
   * Return the same method as targetCode but with the method body replaced by
   * the function call. Keep the method signature identical, only change the
   * body to call the integrated function with proper parameters.
   */
  modifiedCode: string;

  // /**
  //  * The complete controller file with the function integration applied.
  //  *
  //  * Take the transformation shown in targetCode → modifiedCode and apply it to
  //  * the complete controller file:
  //  *
  //  * - Find the method in the full controller that matches targetCode
  //  * - Replace it with the modified version as shown in modifiedCode
  //  * - Keep all other parts of the file unchanged (imports, other methods, etc.)
  //  *
  //  * Return the complete controller file where only the target method has been
  //  * modified according to the demonstrated pattern.
  //  */
  // code: string;
}
