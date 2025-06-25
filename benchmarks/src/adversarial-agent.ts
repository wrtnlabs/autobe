import { OpenAI } from "openai";
import { 
  AutoBeAgentType, 
  BenchmarkResult, 
  ScenarioResults, 
  BenchmarkSummary, 
  TestScenario 
} from "./types";
import { getDefaultScenarios } from "./scenarios";
import { BenchmarkLogger } from "./logger";
import { FileManager } from "./file-manager";
import { ValidationEngine } from "./validation";
import { EventHandler } from "./event-handler";
import { FallbackValidator } from "./fallback-validator";
import { ReportGenerator } from "./report-generator";

export class AdversarialAgent {
  private openai: OpenAI;
  private scenarios: TestScenario[] = [];
  private runsPerScenario: number;
  private logger: BenchmarkLogger;
  private fileManager: FileManager;
  private validation: ValidationEngine;
  private eventHandler: EventHandler;
  private fallbackValidator: FallbackValidator;
  private reportGenerator: ReportGenerator;
  private logsDir: string;
  private benchmarkId: string;

  constructor(apiKey: string, baseURL?: string, runsPerScenario: number = 3) {
    this.openai = new OpenAI({
      apiKey,
      baseURL,
    });
    this.runsPerScenario = runsPerScenario;
    this.benchmarkId = `benchmark-${Date.now()}`;
    
    const path = require('path');
    const workingDir = process.cwd();
    this.logsDir = path.join(workingDir, 'benchmark-logs', new Date().toISOString().split('T')[0], this.benchmarkId);
    
    // Initialize components
    this.logger = new BenchmarkLogger(this.logsDir);
    this.fileManager = new FileManager(this.logsDir, this.logger);
    this.validation = new ValidationEngine(this.openai);
    this.eventHandler = new EventHandler(this.logger);
    this.fallbackValidator = new FallbackValidator(this.logger);
    this.reportGenerator = new ReportGenerator(this.logsDir);
    
    this.scenarios = getDefaultScenarios();
  }

  async runBenchmark(agent: AutoBeAgentType, scenario: TestScenario): Promise<BenchmarkResult> {
    const runId = `${scenario.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`;
    const timestamp = new Date().toISOString();
    
    this.logger.log(runId, `Starting benchmark: ${scenario.name}`);
    this.logger.log(runId, `Description: ${scenario.description}`);
    
    console.log(`
🎯 Starting benchmark: ${scenario.name} (ID: ${runId})
📝 Description: ${scenario.description}
`);

    const result: BenchmarkResult = {
      testName: scenario.name,
      runId,
      flowSuccess: false,
      duration: 0,
      errors: [],
      stages: {
        analyze: { success: false, duration: 0, errors: [] },
        prisma: { success: false, duration: 0, errors: [] },
        interface: { success: false, duration: 0, errors: [] }
      },
      adversarialQuestions: [],
      completenessScore: 0,
      completenessBreakdown: {
        analysis: { total: 0, validated: 0, score: 0 },
        schema: { total: 0, validated: 0, score: 0 },
        api: { total: 0, validated: 0, score: 0 },
        security: { total: 0, validated: 0, score: 0 },
        performance: { total: 0, validated: 0, score: 0 },
        errorHandling: { total: 0, validated: 0, score: 0 },
        dataConsistency: { total: 0, validated: 0, score: 0 },
        userExperience: { total: 0, validated: 0, score: 0 },
        general: { total: 0, validated: 0, score: 0 }
      },
      logs: [],
      generatedFiles: {},
      timestamp
    };

    const startTime = Date.now();
    let currentStage = 'analyze';
    let stageStartTime = Date.now();
    let analysisResult: { files: Record<string, string> } | null = null;
    let prismaResult: { schemas: Record<string, string>; compiled: { type: string; errors?: string[]; document?: unknown } } | null = null;
    let interfaceResult: { document: unknown; files: Record<string, string> } | null = null;

    // Event tracking state
    let eventTimeouts: NodeJS.Timeout[] = [];
    let stageCompleted = {
      analyze: false,
      prisma: false,
      interface: false
    };

    // Helper function to clear all timeouts
    const clearAllTimeouts = () => {
      eventTimeouts.forEach(timeout => clearTimeout(timeout));
      eventTimeouts = [];
    };

    try {
      this.logger.log(runId, 'Setting up event listeners');

      // Set up event listeners to track stage completions
      const eventHandler = this.eventHandler.setupEventListeners(
        agent, runId, result, stageCompleted, stageStartTime, currentStage
      );

      // Execute initial prompt with timeout
      this.logger.log(runId, `Executing initial prompt: ${scenario.initialPrompt.substring(0, 100)}...`);
      console.log("🚀 Executing initial prompt...");
      
      eventTimeouts.push(this.eventHandler.createStageTimeout(runId, result, stageCompleted, 'analyze', 180000));
      const analysisHistory = await agent.conversate(scenario.initialPrompt);
      
      // Wait a bit for events to be processed
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Fallback validation if no event was received
      const fallbackAnalysis = this.fallbackValidator.validateAnalysis(
        analysisHistory, runId, result, stageStartTime, stageCompleted
      );
      if (fallbackAnalysis) {
        analysisResult = fallbackAnalysis;
      }

      // Execute follow-up prompts with enhanced monitoring
      for (const [index, prompt] of scenario.followUpPrompts.entries()) {
        const newStage = index === 0 ? 'prisma' : 'interface';
        
        // Update current stage and start time
        currentStage = newStage;
        stageStartTime = Date.now();
        
        this.logger.log(runId, `Executing follow-up prompt ${index + 1} (${currentStage} stage): ${prompt.substring(0, 100)}...`);
        console.log(`🔄 Executing follow-up prompt ${index + 1}...`);
        
        // Set timeout for this stage
        eventTimeouts.push(this.eventHandler.createStageTimeout(runId, result, stageCompleted, currentStage, 180000));
        
        const stageHistory = await agent.conversate(prompt);
        
        // Wait for events to be processed
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Fallback validation for current stage
        if (currentStage === 'prisma') {
          const fallbackPrisma = this.fallbackValidator.validatePrisma(
            stageHistory, runId, result, stageStartTime, stageCompleted, currentStage
          );
          if (fallbackPrisma) {
            prismaResult = fallbackPrisma;
          }
        } else if (currentStage === 'interface') {
          const fallbackInterface = this.fallbackValidator.validateInterface(
            stageHistory, runId, result, stageStartTime, stageCompleted, currentStage
          );
          if (fallbackInterface) {
            interfaceResult = fallbackInterface;
          }
        }
      }

      // Run adversarial questions in batches of 16
      this.logger.log(runId, `Starting adversarial questioning with ${scenario.adversarialPrompts.length} questions`);
      console.log(`\n🔥 Starting adversarial questioning (${scenario.adversarialPrompts.length} questions in batches of 16)...`);
      
      const batchSize = 16;
      const questionResults: Array<{
        question: string;
        response: string;
        validated: boolean;
        issues: string[];
        timestamp: string;
        category?: string;
      }> = [];
      
      for (let i = 0; i < scenario.adversarialPrompts.length; i += batchSize) {
        const batch = scenario.adversarialPrompts.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(scenario.adversarialPrompts.length / batchSize);
        
        console.log(`📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} questions)...`);
        this.logger.log(runId, `Processing batch ${batchNumber}/${totalBatches} with ${batch.length} questions`);
        
        const batchPromises = batch.map((adversarialPrompt, batchIndex) => 
          this.askAdversarialQuestion(agent, adversarialPrompt, runId, i + batchIndex, scenario.adversarialPrompts.length)
        );
        
        const batchResults = await Promise.all(batchPromises);
        questionResults.push(...batchResults);
        
        // Wait a bit between batches to avoid overwhelming the API
        if (i + batchSize < scenario.adversarialPrompts.length) {
          console.log("⏸️  Waiting 2 seconds before next batch...");
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      result.adversarialQuestions = questionResults;

      // Get final results from event handler
      const eventResults = eventHandler.getResults();
      analysisResult = analysisResult || eventResults.analysisResult;
      prismaResult = prismaResult || eventResults.prismaResult;
      interfaceResult = interfaceResult || eventResults.interfaceResult;

      // Validate flow completion (basic success/failure)
      this.logger.log(runId, 'Validating flow completion');
      this.logger.log(runId, `Analysis result: ${analysisResult ? 'Present' : 'Missing'}`);
      this.logger.log(runId, `Prisma result: ${prismaResult ? 'Present' : 'Missing'}`);
      this.logger.log(runId, `Interface result: ${interfaceResult ? 'Present' : 'Missing'}`);
      
      const flowValidation = this.validation.validateFlow(scenario, {
        analysis: analysisResult,
        prisma: prismaResult,
        interface: interfaceResult
      });

      result.flowSuccess = flowValidation.success;
      result.errors = flowValidation.errors;
      
      if (!result.flowSuccess) {
        result.failureReason = this.determineFailureReason(result);
        this.logger.log(runId, `Flow failed: ${result.failureReason}`, 'ERROR');
        result.errors.forEach(error => this.logger.log(runId, `Error: ${error}`, 'ERROR'));
      }
      
      // Calculate completeness score from adversarial questions
      const completenessResult = this.validation.calculateCompletenessScore(result.adversarialQuestions);
      result.completenessScore = completenessResult.overallScore;
      result.completenessBreakdown = completenessResult.breakdown;
      
      result.duration = Date.now() - startTime;

      this.logger.log(runId, `Flow completed in ${result.duration}ms with ${result.flowSuccess ? 'SUCCESS' : 'FAILURE'}`);
      this.logger.log(runId, `Completeness score: ${result.completenessScore}%`);

      console.log(`
${result.flowSuccess ? '✅' : '❌'} Flow completed: ${scenario.name}
⏱️  Total duration: ${result.duration}ms
🔄 Flow success: ${result.flowSuccess ? 'Yes' : 'No'}
📊 Completeness score: ${result.completenessScore}%
`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(errorMessage);
      result.failureReason = `Critical error: ${errorMessage}`;
      result.duration = Date.now() - startTime;
      
      this.logger.log(runId, `Critical error during benchmark: ${errorMessage}`, 'ERROR');
      console.log(`❌ Benchmark failed: ${scenario.name} - ${error}`);
    } finally {
      // Clear all timeouts
      clearAllTimeouts();
      
      // Save all run data for analysis
      try {
        this.fileManager.saveRunData(result);
        this.logger.log(runId, 'Run data saved to disk');
      } catch (saveError) {
        console.error(`❌ Failed to save run data for ${runId}:`, saveError);
        try {
          this.logger.log(runId, `Failed to save run data: ${saveError instanceof Error ? saveError.message : String(saveError)}`, 'ERROR');
        } catch (logError) {
          console.error(`Failed to log save error:`, logError);
        }
      }
    }

    return result;
  }

  private async askAdversarialQuestion(agent: AutoBeAgentType, question: string, runId: string, questionIndex: number, totalQuestions: number): Promise<{
    question: string;
    response: string;
    validated: boolean;
    issues: string[];
    timestamp: string;
    category?: string;
  }> {
    const timestamp = new Date().toISOString();
    
    // Categorize question first
    const category = this.categorizeQuestion(question, questionIndex);
    
    this.logger.log(runId, `[${category.toUpperCase()}] Question (${questionIndex + 1}/${totalQuestions}): ${question}`);
    console.log(`🤔 [${category.toUpperCase()}] Question (${questionIndex + 1}/${totalQuestions}): ${question}`);
    
    try {
      // Get response from agent (conversate returns conversation history)
      const conversationHistory = await agent.conversate(question);
      
      // Extract the last assistant message as response
      const lastMessage = conversationHistory[conversationHistory.length - 1];
      const response = lastMessage?.type === 'assistantMessage' ? (lastMessage as any).text : 'No response received';
      
      // Validate response quality using GPT
      const validation = await this.validation.validateResponse(question, response);
      
      // Log everything together for better readability
      this.logger.log(runId, `[${category.toUpperCase()}] Q&A Complete (${questionIndex + 1}/${totalQuestions}):`);
      this.logger.log(runId, `  Question: ${question}`);
      this.logger.log(runId, `  Response (${response.length} chars): ${response}`);
      this.logger.log(runId, `  Validation: ${validation.validated ? 'PASS' : 'FAIL'}`);
      if (!validation.validated && validation.issues.length > 0) {
        this.logger.log(runId, `  Issues: ${validation.issues.join('; ')}`, 'WARN');
      }
      
      console.log(`${validation.validated ? '✅' : '⚠️'} [${category.toUpperCase()}] Response: ${validation.validated ? 'Good' : 'Needs improvement'}`);
      
      return {
        question,
        response,
        validated: validation.validated,
        issues: validation.issues,
        timestamp,
        category
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Log error with category
      this.logger.log(runId, `[${category.toUpperCase()}] Q&A Failed (${questionIndex + 1}/${totalQuestions}):`);
      this.logger.log(runId, `  Question: ${question}`);
      this.logger.log(runId, `  Error: ${errorMessage}`, 'ERROR');
      
      console.log(`❌ [${category.toUpperCase()}] Failed to get response: ${error}`);
      
      return {
        question,
        response: "",
        validated: false,
        issues: [errorMessage],
        timestamp,
        category
      };
    }
  }

  private determineFailureReason(result: BenchmarkResult): string {
    // Check stage failures
    if (!result.stages.analyze.success) {
      return 'Analysis stage failed';
    }
    if (!result.stages.prisma.success) {
      return `Prisma stage failed: ${result.stages.prisma.errors.join(', ') || 'Unknown error'}`;
    }
    if (!result.stages.interface.success) {
      return 'Interface stage failed';
    }
    
    // Check general errors
    if (result.errors.length > 0) {
      return `General errors: ${result.errors.join(', ')}`;
    }
    
    return 'Unknown failure reason';
  }

  private categorizeQuestion(question: string, _questionIndex: number): string {
    const questionLower = question.toLowerCase();
    
    // Analysis-related keywords
    const isAnalysisRelated = questionLower.includes('requirements analysis') || 
                             questionLower.includes('in the requirements') ||
                             questionLower.includes('분석에') ||
                             questionLower.includes('요구사항');
    if (isAnalysisRelated) {
      return 'analysis';
    }
    
    // Schema/Database-related keywords
    const isSchemaRelated = questionLower.includes('database schema') || 
                           questionLower.includes('schema design') ||
                           questionLower.includes('schema') ||
                           questionLower.includes('데이터베이스') ||
                           questionLower.includes('스키마');
    if (isSchemaRelated) {
      return 'schema';
    }
    
    // API/Interface-related keywords
    const isApiRelated = questionLower.includes('api interface') || 
                        questionLower.includes('api') ||
                        questionLower.includes('endpoint') ||
                        questionLower.includes('interface') ||
                        questionLower.includes('인터페이스');
    if (isApiRelated) {
      return 'api';
    }
    
    // Security-related keywords
    const isSecurityRelated = questionLower.includes('security') || 
                             questionLower.includes('authentication') ||
                             questionLower.includes('authorization') ||
                             questionLower.includes('payment') ||
                             questionLower.includes('보안') ||
                             questionLower.includes('인증') ||
                             questionLower.includes('결제');
    if (isSecurityRelated) {
      return 'security';
    }
    
    // Performance-related keywords
    const isPerformanceRelated = questionLower.includes('performance') || 
                                questionLower.includes('optimization') ||
                                questionLower.includes('speed') ||
                                questionLower.includes('concurrent') ||
                                questionLower.includes('rate limiting') ||
                                questionLower.includes('성능') ||
                                questionLower.includes('최적화') ||
                                questionLower.includes('동시');
    if (isPerformanceRelated) {
      return 'performance';
    }
    
    // Error Handling-related keywords
    const isErrorHandlingRelated = questionLower.includes('error') || 
                                  questionLower.includes('failure') ||
                                  questionLower.includes('exception') ||
                                  questionLower.includes('timeout') ||
                                  questionLower.includes('connection fail') ||
                                  questionLower.includes('에러') ||
                                  questionLower.includes('실패') ||
                                  questionLower.includes('오류');
    if (isErrorHandlingRelated) {
      return 'errorHandling';
    }
    
    // Data Consistency-related keywords
    const isDataConsistencyRelated = questionLower.includes('consistency') || 
                                    questionLower.includes('transaction') ||
                                    questionLower.includes('rollback') ||
                                    questionLower.includes('concurrent') ||
                                    questionLower.includes('inventory') ||
                                    questionLower.includes('stock') ||
                                    questionLower.includes('일관성') ||
                                    questionLower.includes('트랜잭션') ||
                                    questionLower.includes('재고');
    if (isDataConsistencyRelated) {
      return 'dataConsistency';
    }
    
    // User Experience-related keywords
    const isUserExperienceRelated = questionLower.includes('user') || 
                                   questionLower.includes('content') ||
                                   questionLower.includes('length limit') ||
                                   questionLower.includes('search') ||
                                   questionLower.includes('recommendation') ||
                                   questionLower.includes('discount') ||
                                   questionLower.includes('shipping') ||
                                   questionLower.includes('사용자') ||
                                   questionLower.includes('콘텐츠') ||
                                   questionLower.includes('검색') ||
                                   questionLower.includes('추천') ||
                                   questionLower.includes('할인') ||
                                   questionLower.includes('배송');
    if (isUserExperienceRelated) {
      return 'userExperience';
    }
    
    // Default to general for system-wide questions
    return 'general';
  }

  async runScenarioMultipleTimes(agent: AutoBeAgentType, scenario: TestScenario): Promise<ScenarioResults> {
    const scenarioStartTime = Date.now();
    const scenarioId = `scenario-${scenario.name.replace(/\s+/g, '-').toLowerCase()}-${scenarioStartTime}`;
    
    this.logger.log(scenarioId, `Starting scenario "${scenario.name}" with ${this.runsPerScenario} runs`);
    console.log(`\n🔄 Running scenario "${scenario.name}" ${this.runsPerScenario} times...`);
    
    const runs: BenchmarkResult[] = [];
    let successfulRuns = 0;
    
    for (let i = 1; i <= this.runsPerScenario; i++) {
      console.log(`\n📍 Run ${i}/${this.runsPerScenario} for ${scenario.name}`);
      
      try {
        const result = await this.runBenchmark(agent, scenario);
        runs.push(result);
        
        if (result.flowSuccess) {
          successfulRuns++;
        }
        
        // Wait between runs to avoid rate limiting and give agent fresh context
        if (i < this.runsPerScenario) {
          console.log("⏸️  Waiting 3 seconds before next run...");
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const failedRunId = `${scenario.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}-FAILED`;
        
        console.error(`❌ Run ${i} failed:`, error);
        
        // Try to log the error, but don't fail if logging fails
        try {
          this.logger.log(failedRunId, `Run ${i} failed with critical error: ${errorMessage}`, 'ERROR');
        } catch (logError) {
          console.error(`Failed to log error for run ${i}:`, logError);
        }
        
        // Create a failed result
        const failedResult: BenchmarkResult = {
          testName: scenario.name,
          runId: failedRunId,
          flowSuccess: false,
          duration: 0,
          errors: [errorMessage],
          stages: {
            analyze: { success: false, duration: 0, errors: [] },
            prisma: { success: false, duration: 0, errors: [] },
            interface: { success: false, duration: 0, errors: [] }
          },
          adversarialQuestions: [],
          completenessScore: 0,
          completenessBreakdown: {
            analysis: { total: 0, validated: 0, score: 0 },
            schema: { total: 0, validated: 0, score: 0 },
            api: { total: 0, validated: 0, score: 0 },
            security: { total: 0, validated: 0, score: 0 },
            performance: { total: 0, validated: 0, score: 0 },
            errorHandling: { total: 0, validated: 0, score: 0 },
            dataConsistency: { total: 0, validated: 0, score: 0 },
            userExperience: { total: 0, validated: 0, score: 0 },
            general: { total: 0, validated: 0, score: 0 }
          },
          logs: [],
          generatedFiles: {},
          failureReason: `Critical error in run ${i}: ${errorMessage}`,
          timestamp: new Date().toISOString()
        };
        
        // Try to save run data, but don't fail if saving fails
        try {
          this.fileManager.saveRunData(failedResult);
        } catch (saveError) {
          console.error(`Failed to save failed run data for ${failedRunId}:`, saveError);
        }
        
        runs.push(failedResult);
      }
    }
    
    const totalScenarioDuration = Date.now() - scenarioStartTime;
    const successRate = (successfulRuns / this.runsPerScenario) * 100;
    const averageCompleteness = runs.reduce((sum, run) => sum + run.completenessScore, 0) / runs.length;
    const averageDuration = runs.reduce((sum, run) => sum + run.duration, 0) / runs.length;
    
    // Calculate average completeness breakdown
    const averageCompletenessBreakdown = {
      analysis: runs.reduce((sum, run) => sum + run.completenessBreakdown.analysis.score, 0) / runs.length,
      schema: runs.reduce((sum, run) => sum + run.completenessBreakdown.schema.score, 0) / runs.length,
      api: runs.reduce((sum, run) => sum + run.completenessBreakdown.api.score, 0) / runs.length,
      security: runs.reduce((sum, run) => sum + run.completenessBreakdown.security.score, 0) / runs.length,
      performance: runs.reduce((sum, run) => sum + run.completenessBreakdown.performance.score, 0) / runs.length,
      errorHandling: runs.reduce((sum, run) => sum + run.completenessBreakdown.errorHandling.score, 0) / runs.length,
      dataConsistency: runs.reduce((sum, run) => sum + run.completenessBreakdown.dataConsistency.score, 0) / runs.length,
      userExperience: runs.reduce((sum, run) => sum + run.completenessBreakdown.userExperience.score, 0) / runs.length,
      general: runs.reduce((sum, run) => sum + run.completenessBreakdown.general.score, 0) / runs.length
    };
    
    // Calculate average stage timings
    const averageStageTimings = {
      analysis: runs.reduce((sum, run) => sum + run.stages.analyze.duration, 0) / runs.length,
      schema: runs.reduce((sum, run) => sum + run.stages.prisma.duration, 0) / runs.length,
      api: runs.reduce((sum, run) => sum + run.stages.interface.duration, 0) / runs.length
    };
    
    this.logger.log(scenarioId, `Scenario completed in ${totalScenarioDuration}ms (${(totalScenarioDuration / 1000).toFixed(1)}s)`);
    this.logger.log(scenarioId, `Success rate: ${successRate.toFixed(1)}% (${successfulRuns}/${this.runsPerScenario})`);
    
    console.log(`
📊 Scenario "${scenario.name}" Summary:
   Success Rate: ${successRate.toFixed(1)}% (${successfulRuns}/${this.runsPerScenario})
   Average Completeness: ${averageCompleteness.toFixed(1)}%
   Average Duration: ${averageDuration.toFixed(0)}ms
   Total Scenario Duration: ${(totalScenarioDuration / 1000).toFixed(1)}s
`);
    
    return {
      scenarioName: scenario.name,
      totalRuns: this.runsPerScenario,
      successfulRuns,
      successRate,
      averageCompleteness,
      averageCompletenessBreakdown,
      averageDuration,
      averageStageTimings,
      totalScenarioDuration,
      runs
    };
  }

  async runAllBenchmarks(agent: AutoBeAgentType): Promise<BenchmarkSummary> {
    const benchmarkStartTime = Date.now();
    const startTimeISO = new Date().toISOString();
    
    this.logger.log(this.benchmarkId, `Starting full benchmark with ${this.scenarios.length} scenarios`);
    console.log(`
🚀 Starting benchmark with ${this.scenarios.length} scenarios...
📁 Logs will be saved to: ${this.logsDir}
`);
    
    const results: ScenarioResults[] = [];
    
    for (const scenario of this.scenarios) {
      const scenarioResult = await this.runScenarioMultipleTimes(agent, scenario);
      results.push(scenarioResult);
      
      // Wait between scenarios to avoid rate limiting
      if (results.length < this.scenarios.length) {
        console.log("⏸️  Waiting 5 seconds before next scenario...");
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    const totalBenchmarkDuration = Date.now() - benchmarkStartTime;
    const endTimeISO = new Date().toISOString();
    
    const totalRuns = results.reduce((sum, r) => sum + r.totalRuns, 0);
    const totalSuccessfulRuns = results.reduce((sum, r) => sum + r.successfulRuns, 0);
    const overallSuccessRate = (totalSuccessfulRuns / totalRuns) * 100;
    const overallCompleteness = results.reduce((sum, r) => sum + r.averageCompleteness, 0) / results.length;
    
    // Calculate overall completeness breakdown
    const overallCompletenessBreakdown = {
      analysis: results.reduce((sum, r) => sum + r.averageCompletenessBreakdown.analysis, 0) / results.length,
      schema: results.reduce((sum, r) => sum + r.averageCompletenessBreakdown.schema, 0) / results.length,
      api: results.reduce((sum, r) => sum + r.averageCompletenessBreakdown.api, 0) / results.length,
      security: results.reduce((sum, r) => sum + r.averageCompletenessBreakdown.security, 0) / results.length,
      performance: results.reduce((sum, r) => sum + r.averageCompletenessBreakdown.performance, 0) / results.length,
      errorHandling: results.reduce((sum, r) => sum + r.averageCompletenessBreakdown.errorHandling, 0) / results.length,
      dataConsistency: results.reduce((sum, r) => sum + r.averageCompletenessBreakdown.dataConsistency, 0) / results.length,
      userExperience: results.reduce((sum, r) => sum + r.averageCompletenessBreakdown.userExperience, 0) / results.length,
      general: results.reduce((sum, r) => sum + r.averageCompletenessBreakdown.general, 0) / results.length
    };
    
    // Calculate overall stage timings
    const overallStageTimings = {
      analysis: results.reduce((sum, r) => sum + r.averageStageTimings.analysis, 0) / results.length,
      schema: results.reduce((sum, r) => sum + r.averageStageTimings.schema, 0) / results.length,
      api: results.reduce((sum, r) => sum + r.averageStageTimings.api, 0) / results.length
    };
    
    this.logger.log(this.benchmarkId, `Full benchmark completed in ${totalBenchmarkDuration}ms (${(totalBenchmarkDuration / 1000).toFixed(1)}s)`);
    this.logger.log(this.benchmarkId, `Overall success rate: ${overallSuccessRate.toFixed(1)}%`);
    
    console.log(`\n🏁 Benchmark completed in ${(totalBenchmarkDuration / 1000).toFixed(1)} seconds`);

    // Save benchmark summary to JSON for further analysis
    const summary: BenchmarkSummary = {
      totalScenarios: this.scenarios.length,
      totalRuns,
      totalBenchmarkDuration,
      overallSuccessRate,
      overallCompleteness,
      overallCompletenessBreakdown,
      overallStageTimings,
      scenarios: results,
      startTime: startTimeISO,
      endTime: endTimeISO
    };

    // Save summary as JSON
    try {
      const fs = require('fs');
      const path = require('path');
      const summaryPath = path.join(this.logsDir, 'benchmark-summary.json');
      fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
      this.logger.log(this.benchmarkId, `Benchmark summary saved to: ${summaryPath}`);
    } catch (error) {
      console.error(`Failed to save benchmark summary:`, error);
    }

    // Generate and save report as markdown
    try {
      const fs = require('fs');
      const reportContent = this.generateReport(summary);
      const reportPath = this.getReportPath();
      fs.writeFileSync(reportPath, reportContent);
      this.logger.log(this.benchmarkId, `Benchmark report saved to: ${reportPath}`);
      console.log(`📄 Report saved to: ${reportPath}`);
    } catch (error) {
      console.error(`Failed to save benchmark report:`, error);
    }

    return summary;
  }

  generateReport(summary: BenchmarkSummary): string {
    return this.reportGenerator.generateReport(summary);
  }

  getReportPath(): string {
    return this.reportGenerator.getReportPath();
  }
}

export * from "./types";