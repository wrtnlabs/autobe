import { BenchmarkLogger } from "./logger";
import { formatDuration } from "./time-utils";
import { AutoBeAgentType, BenchmarkResult } from "./types";

export class EventHandler {
  private logger: BenchmarkLogger;

  constructor(logger: BenchmarkLogger) {
    this.logger = logger;
  }

  setupEventListeners(
    agent: AutoBeAgentType,
    runId: string,
    result: BenchmarkResult,
    stageCompleted: { analyze: boolean; prisma: boolean; interface: boolean },
    stageContext: { currentStage: string; stageStartTime: number },
  ): {
    getResults: () => {
      analysisResult: { files: Record<string, string> } | null;
      prismaResult: {
        schemas: Record<string, string>;
        compiled: { type: string; errors?: string[]; document?: unknown };
      } | null;
      interfaceResult: {
        document: unknown;
        files: Record<string, string>;
      } | null;
    };
  } {
    let analysisResult: { files: Record<string, string> } | null = null;
    let prismaResult: {
      schemas: Record<string, string>;
      compiled: { type: string; errors?: string[]; document?: unknown };
    } | null = null;
    let interfaceResult: {
      document: unknown;
      files: Record<string, string>;
    } | null = null;

    // Set up comprehensive event listeners to track all possible events
    try {
      const originalEmit = (agent as any).emit?.bind(agent);
      const logger = this.logger;
      if (originalEmit) {
        (agent as any).emit = function (eventName: string, ...args: any[]) {
          logger.log(
            runId,
            `🔊 Agent emitted event: ${eventName} with ${args.length} args`,
          );
          if (args.length > 0 && typeof args[0] === "object") {
            const keys = Object.keys(args[0] || {});
            logger.log(runId, `📋 Event data keys: ${keys.join(", ")}`);
          }
          return originalEmit(eventName, ...args);
        };
      }
    } catch (error) {
      this.logger.log(
        runId,
        `Failed to set up emit interceptor: ${error}`,
        "WARN",
      );
    }

    // Set up event listeners to track stage completions
    agent.on("analyzeComplete", (event) => {
      this.logger.log(
        runId,
        `Received analyzeComplete event with ${Object.keys(event.files || {}).length} files`,
      );
      stageCompleted.analyze = true;

      result.stages.analyze.duration = Date.now() - stageContext.stageStartTime;
      result.stages.analyze.success = true;
      result.stages.analyze.output = Object.keys(event.files || {}).join(", ");

      // Save generated files
      Object.entries(event.files || {}).forEach(([filename, content]) => {
        result.generatedFiles[`analysis/${filename}`] = content;
      });

      analysisResult = { files: event.files || {} };

      this.logger.log(
        runId,
        `Analysis stage completed successfully in ${formatDuration(result.stages.analyze.duration)}`,
      );
      this.logger.log(
        runId,
        `Analysis files: ${Object.keys(event.files || {}).join(", ")}`,
      );
      console.log("✅ Analysis stage completed");
    });

    agent.on("prismaComplete", (event) => {
      this.logger.log(
        runId,
        `Received prismaComplete event (current stage: ${stageContext.currentStage})`,
      );
      this.logger.log(
        runId,
        `PrismaComplete event contents: schemas=${Object.keys(event.schemas || {}).length} files, compiled=${event.compiled?.type}`,
      );

      // Always process prismaComplete events, but only mark stage as completed when in prisma stage
      if (stageContext.currentStage === "prisma") {
        this.logger.log(
          runId,
          `Processing prismaComplete event in correct stage`,
        );
        stageCompleted.prisma = true;

        result.stages.prisma.duration =
          Date.now() - stageContext.stageStartTime;
        result.stages.prisma.success = event.compiled.type === "success";
        result.stages.prisma.output = Object.keys(event.schemas || {}).join(
          ", ",
        );
        result.stages.prisma.compilationDetails = `Compilation type: ${event.compiled.type}`;

        // Save generated schemas
        Object.entries(event.schemas || {}).forEach(([filename, content]) => {
          result.generatedFiles[`prisma/${filename}`] = content;
        });

        if (event.compiled.type !== "success" && "errors" in event.compiled) {
          const errors = (event.compiled as any).errors || [
            "Compilation failed",
          ];
          result.stages.prisma.errors.push(errors.join(", "));
          this.logger.log(
            runId,
            `Prisma compilation failed: ${errors.join(", ")}`,
            "ERROR",
          );
        } else {
          this.logger.log(
            runId,
            `Prisma stage completed successfully in ${formatDuration(result.stages.prisma.duration)}`,
          );
          this.logger.log(
            runId,
            `Prisma schemas: ${Object.keys(event.schemas || {}).join(", ")}`,
          );
        }

        prismaResult = {
          schemas: event.schemas || {},
          compiled: {
            type: event.compiled.type,
            errors:
              event.compiled.type !== "success" && "errors" in event.compiled
                ? (event.compiled as any).errors
                : undefined,
            document:
              event.compiled.type === "success"
                ? event.compiled.document
                : undefined,
          },
        };
        console.log("✅ Prisma stage completed");
      }
    });

    agent.on("interfaceComplete", (event) => {
      this.logger.log(
        runId,
        `Received interfaceComplete event (current stage: ${stageContext.currentStage})`,
      );
      this.logger.log(
        runId,
        `InterfaceComplete event contents: files=${Object.keys(event.files || {}).length} files, document=${!!event.document}`,
      );

      if (stageContext.currentStage === "interface") {
        this.logger.log(
          runId,
          `Processing interfaceComplete event in correct stage`,
        );
        stageCompleted.interface = true;

        result.stages.interface.duration =
          Date.now() - stageContext.stageStartTime;
        result.stages.interface.success = true;
        result.stages.interface.output = Object.keys(event.files || {}).join(
          ", ",
        );

        // Save generated interface files
        Object.entries(event.files || {}).forEach(([filename, content]) => {
          result.generatedFiles[`interface/${filename}`] = content;
        });

        interfaceResult = {
          document: event.document,
          files: event.files || {},
        };

        this.logger.log(
          runId,
          `Interface stage completed successfully in ${formatDuration(result.stages.interface.duration)}`,
        );
        this.logger.log(
          runId,
          `Interface files: ${Object.keys(event.files || {}).join(", ")}`,
        );
        console.log("✅ Interface stage completed");
      }
    });

    // Listen for known schema-related events that might be the actual ones
    const knownSchemaEvents = ["schemaComplete", "databaseComplete"] as const;

    knownSchemaEvents.forEach((eventName) => {
      try {
        (agent as any).on(eventName, (event: any) => {
          this.logger.log(
            runId,
            `🔍 Detected alternative schema event: ${eventName}`,
          );
          this.logger.log(
            runId,
            `🔍 Event data preview: ${JSON.stringify(event, null, 2).substring(0, 300)}...`,
          );

          // Try to treat this as a Prisma result if we're in the right stage
          if (
            stageContext.currentStage === "prisma" &&
            !stageCompleted.prisma
          ) {
            this.logger.log(
              runId,
              `🔧 Attempting to use ${eventName} as prismaComplete substitute`,
            );

            if (event && (event.schemas || event.files)) {
              stageCompleted.prisma = true;
              result.stages.prisma.duration =
                Date.now() - stageContext.stageStartTime;
              result.stages.prisma.success = true;
              result.stages.prisma.output = Object.keys(
                event.schemas || event.files || {},
              ).join(", ");

              prismaResult = {
                schemas: event.schemas || event.files || {},
                compiled: { type: "success", document: event },
              };

              this.logger.log(
                runId,
                `🔧 Successfully adapted ${eventName} to prismaResult`,
              );
              console.log("✅ Prisma stage completed (via alternative event)");
            }
          }
        });
      } catch (error) {
        this.logger.log(
          runId,
          `Failed to set up listener for ${eventName}: ${error}`,
          "WARN",
        );
      }
    });

    // Listen for known interface-related events
    const knownInterfaceEvents = ["apiComplete", "specComplete"] as const;

    knownInterfaceEvents.forEach((eventName) => {
      try {
        (agent as any).on(eventName, (event: any) => {
          this.logger.log(
            runId,
            `🔍 Detected alternative interface event: ${eventName}`,
          );
          this.logger.log(
            runId,
            `🔍 Event data preview: ${JSON.stringify(event, null, 2).substring(0, 300)}...`,
          );

          // Try to treat this as an Interface result if we're in the right stage
          if (
            stageContext.currentStage === "interface" &&
            !stageCompleted.interface
          ) {
            this.logger.log(
              runId,
              `🔧 Attempting to use ${eventName} as interfaceComplete substitute`,
            );

            if (event && (event.files || event.document)) {
              stageCompleted.interface = true;
              result.stages.interface.duration =
                Date.now() - stageContext.stageStartTime;
              result.stages.interface.success = true;
              result.stages.interface.output = Object.keys(
                event.files || {},
              ).join(", ");

              interfaceResult = {
                document: event.document || event,
                files: event.files || {},
              };

              this.logger.log(
                runId,
                `🔧 Successfully adapted ${eventName} to interfaceResult`,
              );
              console.log(
                "✅ Interface stage completed (via alternative event)",
              );
            }
          }
        });
      } catch (error) {
        this.logger.log(
          runId,
          `Failed to set up listener for ${eventName}: ${error}`,
          "WARN",
        );
      }
    });

    return {
      getResults: () => ({
        analysisResult,
        prismaResult,
        interfaceResult,
      }),
    };
  }

  createStageTimeout(
    runId: string,
    result: BenchmarkResult,
    stageCompleted: { analyze: boolean; prisma: boolean; interface: boolean },
    stageName: string,
    duration: number = 600000,
  ): NodeJS.Timeout {
    return setTimeout(() => {
      if (!stageCompleted[stageName as keyof typeof stageCompleted]) {
        this.logger.log(
          runId,
          `Timeout: ${stageName} stage did not complete within ${formatDuration(duration)}`,
          "WARN",
        );
        const stageKey = stageName as keyof typeof result.stages;
        if (stageKey in result.stages && result.stages[stageKey]) {
          result.stages[stageKey]!.errors.push(
            `Stage timeout after ${formatDuration(duration)}`,
          );
        }
      }
    }, duration);
  }
}
