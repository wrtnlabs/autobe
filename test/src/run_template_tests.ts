import { DynamicExecutor } from "@nestia/e2e";
import path from "path";

async function main(): Promise<void> {
  const report: DynamicExecutor.IReport = await DynamicExecutor.validate({
    prefix: "test_",
    location: path.join(__dirname, "features/programmer"),
    filter: (name: string): boolean =>
      name.includes("realize_operation_template"),
    parameters: () => [],
    onComplete: (exec: DynamicExecutor.IExecution): void => {
      const icon: string = exec.error ? "FAIL" : "PASS";
      console.log(`${icon} ${exec.name}`);
      if (exec.error) console.log(`  ${exec.error.message}`);
    },
    extension: "ts",
  });
  const failed: number = report.executions.filter(
    (e: DynamicExecutor.IExecution): boolean => !!e.error,
  ).length;
  console.log(`\nTotal: ${report.executions.length}, Failed: ${failed}`);
  if (failed > 0) process.exit(1);
}
main();
