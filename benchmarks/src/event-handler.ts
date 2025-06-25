import { AutoBeAgentType, BenchmarkResult } from "./types";
import { BenchmarkLogger } from "./logger";

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
    stageStartTime: number,
    currentStage: string
  ): {
    getResults: () => {
      analysisResult: { files: Record<string, string> } | null;
      prismaResult: { schemas: Record<string, string>; compiled: { type: string; errors?: string[]; document?: unknown } } | null;
      interfaceResult: { document: unknown; files: Record<string, string> } | null;
    }
  } {
    let analysisResult: { files: Record<string, string> } | null = null;
    let prismaResult: { schemas: Record<string, string>; compiled: { type: string; errors?: string[]; document?: unknown } } | null = null;
    let interfaceResult: { document: unknown; files: Record<string, string> } | null = null;

    // Set up event listeners to track stage completions
    agent.on("analyzeComplete", (event) => {
      this.logger.log(runId, `Received analyzeComplete event with ${Object.keys(event.files || {}).length} files`);
      stageCompleted.analyze = true;
      
      result.stages.analyze.duration = Date.now() - stageStartTime;
      result.stages.analyze.success = true;
      result.stages.analyze.output = Object.keys(event.files || {}).join(', ');
      
      // Save generated files
      Object.entries(event.files || {}).forEach(([filename, content]) => {
        result.generatedFiles[`analysis/${filename}`] = content;
      });
      
      analysisResult = { files: event.files || {} };
      
      this.logger.log(runId, `Analysis stage completed successfully in ${result.stages.analyze.duration}ms`);
      this.logger.log(runId, `Analysis files: ${Object.keys(event.files || {}).join(', ')}`);
      console.log("✅ Analysis stage completed");
    });

    agent.on("prismaComplete", (event) => {
      this.logger.log(runId, `Received prismaComplete event (checking if current stage is prisma)`);
      
      // Always process prismaComplete events, but only mark stage as completed when in prisma stage
      if (currentStage === 'prisma') {
        this.logger.log(runId, `Processing prismaComplete event in correct stage`);
        stageCompleted.prisma = true;
        
        result.stages.prisma.duration = Date.now() - stageStartTime;
        result.stages.prisma.success = event.compiled.type === 'success';
        result.stages.prisma.output = Object.keys(event.schemas || {}).join(', ');
        result.stages.prisma.compilationDetails = `Compilation type: ${event.compiled.type}`;
        
        // Save generated schemas
        Object.entries(event.schemas || {}).forEach(([filename, content]) => {
          result.generatedFiles[`prisma/${filename}`] = content;
        });
        
        if (event.compiled.type !== 'success' && 'errors' in event.compiled) {
          const errors = (event.compiled as any).errors || ['Compilation failed'];
          result.stages.prisma.errors.push(errors.join(', '));
          this.logger.log(runId, `Prisma compilation failed: ${errors.join(', ')}`, 'ERROR');
        } else {
          this.logger.log(runId, `Prisma stage completed successfully in ${result.stages.prisma.duration}ms`);
          this.logger.log(runId, `Prisma schemas: ${Object.keys(event.schemas || {}).join(', ')}`);
        }
        
        prismaResult = { 
          schemas: event.schemas || {}, 
          compiled: {
            type: event.compiled.type,
            errors: event.compiled.type !== 'success' && 'errors' in event.compiled ? (event.compiled as any).errors : undefined,
            document: event.compiled.type === 'success' ? event.compiled.document : undefined
          }
        };
        console.log("✅ Prisma stage completed");
      }
    });

    agent.on("interfaceComplete", (event) => {
      this.logger.log(runId, `Received interfaceComplete event (checking if current stage is interface)`);
      
      if (currentStage === 'interface') {
        this.logger.log(runId, `Processing interfaceComplete event in correct stage`);
        stageCompleted.interface = true;
        
        result.stages.interface.duration = Date.now() - stageStartTime;
        result.stages.interface.success = true;
        result.stages.interface.output = Object.keys(event.files || {}).join(', ');
        
        // Save generated interface files
        Object.entries(event.files || {}).forEach(([filename, content]) => {
          result.generatedFiles[`interface/${filename}`] = content;
        });
        
        interfaceResult = { document: event.document, files: event.files || {} };
        
        this.logger.log(runId, `Interface stage completed successfully in ${result.stages.interface.duration}ms`);
        this.logger.log(runId, `Interface files: ${Object.keys(event.files || {}).join(', ')}`);
        console.log("✅ Interface stage completed");
      }
    });

    return {
      getResults: () => ({
        analysisResult,
        prismaResult,
        interfaceResult
      })
    };
  }

  createStageTimeout(
    runId: string,
    result: BenchmarkResult,
    stageCompleted: { analyze: boolean; prisma: boolean; interface: boolean },
    stageName: string,
    duration: number = 120000
  ): NodeJS.Timeout {
    return setTimeout(() => {
      if (!stageCompleted[stageName as keyof typeof stageCompleted]) {
        this.logger.log(runId, `Timeout: ${stageName} stage did not complete within ${duration}ms`, 'WARN');
        const stageKey = stageName as keyof typeof result.stages;
        if (stageKey in result.stages && result.stages[stageKey]) {
          result.stages[stageKey]!.errors.push(`Stage timeout after ${duration}ms`);
        }
      }
    }, duration);
  }
}