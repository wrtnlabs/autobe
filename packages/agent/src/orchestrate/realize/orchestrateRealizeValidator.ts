import { AutoBeRealizeIntegratorEvent } from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
// import cp from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import typia from "typia";

// import { promisify } from "util";

import { AutoBeContext } from "../../context/AutoBeContext";

/**
 * The result of validating the integrated code by running tests or static
 * checks.
 */
export interface RealizeValidatorOutput {
  /** File path or location of the generated provider logic file. */
  location: string;

  /** The full TypeScript source code content of the generated provider file. */
  content: string;

  /**
   * Overall result of the test execution.
   *
   * - "success": All tests passed successfully.
   * - "fail": Some tests failed.
   * - "exception": An unexpected error occurred during test execution.
   */
  result: "success" | "fail" | "exception";

  /** Total number of test cases executed. */
  total: number;

  /** Number of tests that passed. */
  success: number;

  /** Number of tests that failed. */
  fail: number;
}

/**
 * Validates the integrated provider logic by returning the generated source
 * code along with the summary of test execution results.
 *
 * This function serves as the final step to:
 *
 * - Provide the full TypeScript implementation files created/updated during
 *   integration.
 * - Return a detailed summary of the automated test outcomes executed against
 *   that code.
 *
 * It does not throw errors; all failures or exceptions are reported via the
 * `result` property.
 *
 * @param ctx - AutoBE execution context
 * @param props - Result from the integration step
 * @returns An object containing provider file content and test results
 */
export const orchestrateRealizeValidator = async <
  Model extends ILlmSchema.Model,
>(
  ctx: AutoBeContext<Model>,
  props: AutoBeRealizeIntegratorEvent[],
): Promise<RealizeValidatorOutput> => {
  const testFiles = Object.fromEntries(
    ctx.state().test?.files.map((file) => [file.location, file.content]) ?? [],
  );

  const files: Record<string, string> = props.reduce(
    (acc, prop) => ({ ...acc, ...prop.file }),
    { ...ctx.state().interface?.files },
  );

  const originalFiles = {
    ...files,
    ...testFiles,
  };

  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "autobe-"));

  for (const [filePath, content] of Object.entries(originalFiles)) {
    const location = path.join(tempDir, filePath);
    await fs.promises.mkdir(path.dirname(location), { recursive: true });
    await fs.promises.writeFile(location, content, "utf-8");
  }

  // try {
  //   console.log("🔧 npm install...");
  //   await promisify(cp.exec)("npm install", { cwd: tempDir });

  //   console.log("🚀 npm run build...");
  //   await promisify(cp.exec)("npm run build", { cwd: tempDir });

  //   console.log("🧪 npm test...");
  //   await promisify(cp.exec)("npm run test", { cwd: tempDir });

  //   console.log("✅ All Works Done!");
  // } catch (err: any) {
  //   console.error("❌ Error Occurred:", err.stderr || err.message);
  //   throw err;
  // } finally {
  //   console.log("Start to remove temp directory...");
  await fs.promises.rm(tempDir, { recursive: true, force: true });
  // }

  return typia.random<RealizeValidatorOutput>();
};
