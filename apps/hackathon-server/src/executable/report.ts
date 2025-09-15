import { FileSystemIterator } from "@autobe/filesystem";

import { AutoBeHackathonConfiguration } from "../AutoBeHackathonConfiguration";
import { AutoBeHackathonSessionReporter } from "../providers/reports/AutoBeHackathonSessionReporter";

const main = async (): Promise<void> => {
  const files: Record<string, string> =
    await AutoBeHackathonSessionReporter.report();
  await FileSystemIterator.save({
    root: `${AutoBeHackathonConfiguration.ROOT}/results/20250912`,
    files,
  });
};
main().catch((error) => {
  console.log(error);
  process.exit(-1);
});
