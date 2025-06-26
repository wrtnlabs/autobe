import fs from "fs";
import path from "path";

export class BenchmarkLogger {
  private logsDir: string;

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

    try {
      // Ensure logs directory exists
      if (!fs.existsSync(this.logsDir)) {
        fs.mkdirSync(this.logsDir, { recursive: true });
      }

      // Write to log file only
      const logFile = path.join(this.logsDir, `${runId}.log`);
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
