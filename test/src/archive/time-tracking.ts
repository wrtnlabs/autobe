import { AutoBeAgent } from "@autobe/agent";
import { AutoBeCompiler } from "@autobe/compiler";
import { FileSystemIterator } from "@autobe/filesystem";
import {
  AutoBeHistory,
  AutoBePhase,
  AutoBeUserConversateContent,
  IAutoBeTokenUsageJson,
} from "@autobe/interface";
import { TokenUsageComputer } from "@autobe/utils";
import fs from "fs";

import { TestGlobal } from "../TestGlobal";

const PROJECT_NAME = "time-tracking";
const SCRIPT_PATH = `${__dirname}/../../scripts/${PROJECT_NAME}.md`;
const OUTPUT_ROOT = `${__dirname}/../../results`;

const PHASES: AutoBePhase[] = ["analyze", "database", "interface", "test", "realize"];

const PROMPT_TEMPLATE: Record<string, string> = {
  database: "Design the database schema.",
  interface: "Create the API interface specification.",
  test: "Make the e2e test functions.",
  realize: "Implement API functions.",
};

const main = async (): Promise<void> => {
  const vendor: string | null = TestGlobal.getArguments("vendor")?.[0] ?? null;
  if (vendor === null) throw new Error("Vendor argument is required.");

  const vendorSlug = vendor.replaceAll("/", "-").replaceAll(":", "-");
  const outputDir = `${OUTPUT_ROOT}/${vendorSlug}/${PROJECT_NAME}`;
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  console.log("=".repeat(60));
  console.log("  TIME-TRACKING - AutoBE Generation");
  console.log("=".repeat(60));
  console.log(`Vendor: ${vendor}`);
  console.log(`Output: ${outputDir}`);

  let tokenUsage: IAutoBeTokenUsageJson = {
    aggregate: TokenUsageComputer.zero(),
    facade: TokenUsageComputer.zero(),
    analyze: TokenUsageComputer.zero(),
    database: TokenUsageComputer.zero(),
    interface: TokenUsageComputer.zero(),
    test: TokenUsageComputer.zero(),
    realize: TokenUsageComputer.zero(),
  };
  let histories: AutoBeHistory[] = [];

  for (const phase of PHASES) {
    console.log(`\n[${"=".repeat(20)} ${phase.toUpperCase()} ${"=".repeat(20)}]`);

    const agent = new AutoBeAgent({
      vendor: TestGlobal.getVendorConfig(vendor),
      config: { locale: "en-US", timeout: null },
      compiler: (listener) => new AutoBeCompiler(listener),
      histories,
      tokenUsage,
    });

    const userMessage = await getUserMessage(phase);
    
    let success = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      console.log(`Attempt ${attempt}/3...`);
      const result = await agent.conversate(userMessage);
      if (result.some((h) => h.type === phase)) {
        success = true;
        break;
      }
      if (attempt < 3) await agent.conversate("Just do it right now.");
    }

    if (!success) {
      console.error(`${phase} phase failed`);
      break;
    }

    histories = agent.getHistories();
    tokenUsage = agent.getTokenUsage();

    const phaseDir = `${outputDir}/${phase}`;
    await FileSystemIterator.save({
      root: phaseDir,
      files: { ...(await agent.getFiles()), "pnpm-workspace.yaml": "" },
    });
    console.log(`Saved to ${phaseDir}`);
  }

  console.log("\nDone!");
};

const getUserMessage = async (phase: AutoBePhase): Promise<AutoBeUserConversateContent[]> => {
  if (phase === "analyze") {
    const text = await fs.promises.readFile(SCRIPT_PATH, "utf8");
    return [{ type: "text", text }];
  }
  return [{ type: "text", text: PROMPT_TEMPLATE[phase] || `Execute ${phase}.` }];
};

main().catch((e) => { console.error(e); process.exit(-1); });
