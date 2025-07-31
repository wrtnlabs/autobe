import { ILlmSchema } from "@samchon/openapi";
import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import path from "path";
import process from "process";
import { Singleton } from "tstl";
import typia from "typia";

export class TestGlobal {
  public static readonly ROOT: string =
    __filename.substring(__filename.length - 2) === "js"
      ? path.join(__dirname, "..", "..")
      : path.join(__dirname, "..");

  public static get env(): IEnvironments {
    return environments.get();
  }

  public static getArguments(type: string): string[] {
    const from: number = process.argv.indexOf(`--${type}`) + 1;
    if (from === 0) {
      return [];
    }
    const to: number = process.argv
      .slice(from)
      .findIndex((str) => str.startsWith("--"), from);
    return process.argv.slice(
      from,
      to === -1 ? process.argv.length : to + from,
    );
  }

  public static getVendorModel(): string {
    if (TestGlobal.env.VENDOR_MODEL === undefined) return "openai/gpt-4.1";
    else if (TestGlobal.env.BASE_URL === undefined)
      return `openai/${TestGlobal.env.VENDOR_MODEL}`;
    return TestGlobal.env.VENDOR_MODEL;
  }
}

interface IEnvironments {
  API_KEY?: string;
  BASE_URL?: string;
  SCHEMA_MODEL?: ILlmSchema.Model;
  VENDOR_MODEL?: string;
  SEMAPHORE?: string;
  BENCHMARK_RUNS_PER_SCENARIO?: string;
}

const environments = new Singleton(() => {
  const env = dotenv.config();
  dotenvExpand.expand(env);
  return typia.assert<IEnvironments>(process.env);
});
