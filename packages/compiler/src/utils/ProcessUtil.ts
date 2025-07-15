import cp from "child_process";
import { promisify } from "util";

export namespace ProcessUtil {
  export async function exec(
    command: string,
    options?: cp.ExecOptions,
  ): Promise<string | Buffer> {
    const result = await promisify(cp.exec)(command, options);
    return typeof result.stdout === "string"
      ? result.stdout
      : Buffer.from(result.stdout);
  }
}
