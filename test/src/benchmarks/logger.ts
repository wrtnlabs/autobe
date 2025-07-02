import fs from "fs";
import path from "path";

export class BenchmarkLogger {
  public logsDir: string;

  constructor(logsDir: string) {
    this.logsDir = logsDir;
    this.ensureLogsDirectory();
  }

  private ensureLogsDirectory(): void {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  log(
    runId: string,
    message: string,
    level: "INFO" | "ERROR" | "WARN" = "INFO",
  ): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] [${runId}] ${message}`;

    const dir = `${this.logsDir}/${runId}`;
    try {
      // Ensure logs directory exists
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write to log file only
      const logFile = path.join(dir, `normal.log`);
      fs.appendFileSync(logFile, logMessage + "\n");
    } catch (error) {
      // If logging fails, at least show in console
      console.error(
        `Failed to write log: ${error instanceof Error ? error.message : String(error)}`,
      );
      console.log(logMessage);
    }
  }
}
export function createLogsDirectory(benchmarkId: string): string {
  const path = require("path");
  const workingDir = process.cwd();
  return path.join(workingDir, "benchmark-logs", benchmarkId);
}
