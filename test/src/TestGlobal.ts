import { IAutoBeVendor } from "@autobe/agent";
import { ILlmSchema } from "@samchon/openapi";
import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import OpenAI from "openai";
import path from "path";
import process from "process";
import { Singleton } from "tstl";
import typia from "typia";

export class TestGlobal {
  public static get env(): IEnvironments {
    return environments.get();
  }

  public static getArguments(type: string): string[] | null {
    const from: number = process.argv.indexOf(`--${type}`) + 1;
    if (from === 0) {
      return null;
    }
    const to: number = process.argv
      .slice(from)
      .findIndex((str) => str.startsWith("--"), from);
    return process.argv.slice(
      from,
      to === -1 ? process.argv.length : to + from,
    );
  }

  public static getVendorConfig(): IAutoBeVendor {
    const isOpenAi: boolean =
      TestGlobal.vendorModel.startsWith("openai/") &&
      TestGlobal.vendorModel.startsWith("openai/gpt-oss-") === false;
    return {
      api: new OpenAI({
        apiKey:
          (isOpenAi
            ? TestGlobal.env.OPENAI_API_KEY
            : TestGlobal.env.OPENROUTER_API_KEY) ?? "********",
        baseURL: isOpenAi ? undefined : "https://openrouter.ai/api/v1",
      }),
      model: isOpenAi
        ? TestGlobal.vendorModel.replace("openai/", "")
        : TestGlobal.vendorModel,
      semaphore: Number(TestGlobal.getArguments("semaphore")?.[0] ?? "16"),
    };
  }

  public static readonly ROOT: string =
    __filename.substring(__filename.length - 2) === "js"
      ? path.join(__dirname, "..", "..")
      : path.join(__dirname, "..");

  public static readonly PLAYGROUND_PORT: number = 37198;

  public static archive: boolean = process.argv.includes("--archive");
  public static vendorModel: string =
    this.getArguments("vendor")?.[0] || "openai/gpt-4.1";
}

interface IEnvironments {
  OPENAI_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
  SCHEMA_MODEL?: ILlmSchema.Model;
  SEMAPHORE?: string;
  TIMEOUT?: string;
  BENCHMARK_RUNS_PER_SCENARIO?: string;
}

const environments = new Singleton(() => {
  const env = dotenv.config();
  dotenvExpand.expand(env);
  return typia.assert<IEnvironments>(process.env);
});
