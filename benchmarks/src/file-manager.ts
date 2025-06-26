import fs from "fs";
import path from "path";

import { BenchmarkLogger } from "./logger";
import { BenchmarkResult } from "./types";

export class FileManager {
  private logsDir: string;
  private logger: BenchmarkLogger;

  constructor(logsDir: string, logger: BenchmarkLogger) {
    this.logsDir = logsDir;
    this.logger = logger;
  }

  saveRunData(result: BenchmarkResult): void {
    try {
      // Ensure logs directory exists
      if (!fs.existsSync(this.logsDir)) {
        fs.mkdirSync(this.logsDir, { recursive: true });
      }

      // Save detailed run data as JSON
      const runDataFile = path.join(this.logsDir, `${result.runId}-data.json`);
      fs.writeFileSync(runDataFile, JSON.stringify(result, null, 2));

      // Save generated files if any
      if (Object.keys(result.generatedFiles).length > 0) {
        const filesDir = path.join(this.logsDir, `${result.runId}-files`);

        // Ensure files directory exists
        if (!fs.existsSync(filesDir)) {
          fs.mkdirSync(filesDir, { recursive: true });
        }

        Object.entries(result.generatedFiles).forEach(([filename, content]) => {
          try {
            // Normalize filename and ensure directory structure for nested files
            const normalizedFilename = filename.replace(/\\/g, "/"); // Convert Windows paths to Unix
            const filePath = path.join(filesDir, normalizedFilename);
            const fileDir = path.dirname(filePath);

            // Ensure all parent directories exist
            if (!fs.existsSync(fileDir)) {
              fs.mkdirSync(fileDir, { recursive: true });
            }

            fs.writeFileSync(filePath, content, "utf8");
            this.logger.log(result.runId, `Saved file: ${normalizedFilename}`);
          } catch (fileError) {
            this.logger.log(
              result.runId,
              `Failed to save file ${filename}: ${fileError instanceof Error ? fileError.message : String(fileError)}`,
              "ERROR",
            );
          }
        });

        this.logger.log(
          result.runId,
          `Saved ${Object.keys(result.generatedFiles).length} generated files to ${filesDir}`,
        );
      }
    } catch (error) {
      this.logger.log(
        result.runId,
        `Failed to save run data: ${error instanceof Error ? error.message : String(error)}`,
        "ERROR",
      );
      console.error(`❌ Failed to save run data for ${result.runId}:`, error);
    }
  }
}
