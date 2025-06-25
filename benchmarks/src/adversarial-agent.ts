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
import { ReportGenerator } from "./report-generator";
import { formatDuration, formatDurationSecondsFromMs } from "./time-utils";

export class AdversarialAgent {
  private openai: OpenAI;
  private scenarios: TestScenario[] = [];
  private runsPerScenario: number;
  private logger: BenchmarkLogger;
  private fileManager: FileManager;
  private validation: ValidationEngine;
  private eventHandler: EventHandler;
  private reportGenerator: ReportGenerator;
  private logsDir: string;
  private benchmarkId: string;

  constructor(apiKey: string, baseURL?: string, runsPerScenario: number = 3) {
    // Initialize core configuration
    this.openai = new OpenAI({ apiKey, baseURL });
    this.runsPerScenario = runsPerScenario;
    this.benchmarkId = `benchmark-${Date.now()}`;
    this.logsDir = this.createLogsDirectory();
    
    // Initialize components with dependencies
    this.logger = new BenchmarkLogger(this.logsDir);
    this.fileManager = new FileManager(this.logsDir, this.logger);
    this.validation = new ValidationEngine(this.openai);
    this.eventHandler = new EventHandler(this.logger);
    this.reportGenerator = new ReportGenerator(this.logsDir);
    
    this.scenarios = getDefaultScenarios();
  }

  private createLogsDirectory(): string {
    const path = require('path');
    const workingDir = process.cwd();
    const dateString = new Date().toISOString().split('T')[0];
    return path.join(workingDir, 'benchmark-logs', dateString, this.benchmarkId);
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
      const stageContext = { currentStage, stageStartTime };
      const eventHandler = this.eventHandler.setupEventListeners(
        agent, runId, result, stageCompleted, stageContext
      );

      // Stage 1: Requirements Analysis (MANDATORY FIRST STEP)
      this.logger.log(runId, `🎯 Stage 1/3: Requirements Analysis`);
      this.logger.log(runId, `Executing initial prompt: ${scenario.initialPrompt.substring(0, 100)}...`);
      console.log("🚀 Stage 1/3: Requirements Analysis - Executing initial prompt...");
      
      eventTimeouts.push(this.eventHandler.createStageTimeout(runId, result, stageCompleted, 'analyze', 600000));
      await agent.conversate(scenario.initialPrompt);
      
      // Wait for events to be processed
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Execute follow-up prompts in MANDATORY ORDER: Prisma → Interface
      const stageNames = ['prisma', 'interface'];
      const stageDescriptions = ['Database Schema', 'API Interface'];
      
      for (const [index, prompt] of scenario.followUpPrompts.entries()) {
        const stageNumber = index + 2; // Stage 2 and 3
        const currentStageName = stageNames[index];
        const stageDescription = stageDescriptions[index];
        
        // Ensure we don't exceed expected stages
        if (index >= stageNames.length) {
          this.logger.log(runId, `WARNING: Unexpected additional prompt beyond 3-stage workflow`, 'WARN');
          break;
        }
        
        // Update current stage and start time
        currentStage = currentStageName;
        stageStartTime = Date.now();
        stageContext.currentStage = currentStage;
        stageContext.stageStartTime = stageStartTime;
        
        this.logger.log(runId, `🎯 Stage ${stageNumber}/3: ${stageDescription} (${currentStage})`);
        this.logger.log(runId, `Executing prompt: ${prompt.substring(0, 100)}...`);
        console.log(`🔄 Stage ${stageNumber}/3: ${stageDescription} - Executing prompt...`);
        
        // Set timeout for this stage
        eventTimeouts.push(this.eventHandler.createStageTimeout(runId, result, stageCompleted, currentStage, 600000));
        
        const stageResponse = await agent.conversate(prompt);
        
        // Log the stage response for debugging
        if (stageResponse && stageResponse.length > 0) {
          const lastMessage = stageResponse[stageResponse.length - 1];
          if (lastMessage && (lastMessage as any).text) {
            const responseText = (lastMessage as any).text;
            this.logger.log(runId, `🔍 Stage ${currentStage} response preview: ${responseText.substring(0, 200)}...`);
            
            // Check if response contains Prisma-related content
            if (currentStage === 'prisma') {
              const hasPrismaKeywords = responseText.includes('model ') || 
                                       responseText.includes('prisma') || 
                                       responseText.includes('schema') ||
                                       responseText.includes('generator') ||
                                       responseText.includes('datasource');
              this.logger.log(runId, `🔍 Prisma response contains schema keywords: ${hasPrismaKeywords}`);
              
              if (hasPrismaKeywords) {
                this.logger.log(runId, `🔍 Full Prisma response: ${responseText}`);
              }
            }
            
            // Check if response contains API-related content
            if (currentStage === 'interface') {
              const hasApiKeywords = responseText.includes('API') || 
                                    responseText.includes('endpoint') || 
                                    responseText.includes('swagger') ||
                                    responseText.includes('interface') ||
                                    responseText.includes('specification');
              this.logger.log(runId, `🔍 Interface response contains API keywords: ${hasApiKeywords}`);
            }
          }
        }
        
        // Wait for events to be processed
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Collect generated artifacts for context-aware adversarial questioning
      const generatedArtifacts = this.collectGeneratedArtifacts(analysisResult, prismaResult, interfaceResult);
      this.logger.log(runId, `Collected artifacts: Analysis=${!!analysisResult}, Prisma=${!!prismaResult}, Interface=${!!interfaceResult}`);
      
      // Run adversarial questions in batches of 16 with generated context
      this.logger.log(runId, `Starting adversarial questioning with ${scenario.adversarialPrompts.length} questions`);
      console.log(`\n🔥 Starting adversarial questioning (${scenario.adversarialPrompts.length} questions in batches of 16)...`);
      console.log(`📋 Available artifacts: ${generatedArtifacts.availableArtifacts.join(', ')}`);
      
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
          this.askAdversarialQuestionWithContext(agent, adversarialPrompt, generatedArtifacts, runId, i + batchIndex, scenario.adversarialPrompts.length)
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
      this.logger.log(runId, `EventHandler results: Analysis=${!!eventResults.analysisResult}, Prisma=${!!eventResults.prismaResult}, Interface=${!!eventResults.interfaceResult}`);
      
      analysisResult = analysisResult || eventResults.analysisResult;
      prismaResult = prismaResult || eventResults.prismaResult;
      interfaceResult = interfaceResult || eventResults.interfaceResult;
      
      this.logger.log(runId, `Final results after merge: Analysis=${!!analysisResult}, Prisma=${!!prismaResult}, Interface=${!!interfaceResult}`);

      // Validate flow completion - all 3 stages must succeed
      this.logger.log(runId, 'Validating 3-stage flow completion (Analysis → Prisma → Interface)');
      
      const stageResults = {
        analysis: analysisResult,
        prisma: prismaResult,
        interface: interfaceResult
      };
      
      // Log each stage status clearly
      const analysisSuccess = !!analysisResult;
      const prismaSuccess = !!prismaResult;
      const interfaceSuccess = !!interfaceResult;
      
      this.logger.log(runId, `Stage 1 - Requirements Analysis: ${analysisSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
      this.logger.log(runId, `Stage 2 - Prisma Schema: ${prismaSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
      this.logger.log(runId, `Stage 3 - API Interface: ${interfaceSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
      
      const flowValidation = this.validation.validateFlow(scenario, stageResults);
      
      result.flowSuccess = flowValidation.success;
      result.errors = flowValidation.errors;
      
      // Update stage success status in result
      result.stages.analyze.success = analysisSuccess;
      result.stages.prisma.success = prismaSuccess;
      result.stages.interface.success = interfaceSuccess;
      
      const allStagesSuccessful = analysisSuccess && prismaSuccess && interfaceSuccess;
      this.logger.log(runId, `Overall Flow Result: ${allStagesSuccessful ? '✅ ALL STAGES COMPLETED' : '❌ INCOMPLETE FLOW'}`);
      
      if (allStagesSuccessful !== result.flowSuccess) {
        this.logger.log(runId, `WARNING: Stage success (${allStagesSuccessful}) differs from flow validation (${result.flowSuccess})`, 'WARN');
      }
      
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

      this.logger.log(runId, `Flow completed in ${formatDuration(result.duration)} with ${result.flowSuccess ? 'SUCCESS' : 'FAILURE'}`);
      this.logger.log(runId, `Completeness score: ${result.completenessScore}%`);

      console.log(`
${result.flowSuccess ? '✅' : '❌'} Flow completed: ${scenario.name}
📋 Stage Results:
   1. Requirements Analysis: ${result.stages.analyze.success ? '✅' : '❌'}
   2. Prisma Schema: ${result.stages.prisma.success ? '✅' : '❌'}  
   3. API Interface: ${result.stages.interface.success ? '✅' : '❌'}
⏱️  Total duration: ${formatDuration(result.duration)}
🎯 Flow success: ${result.flowSuccess ? 'Yes (All 3 stages completed)' : 'No (Missing stages)'}
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

  private collectGeneratedArtifacts(analysisResult: any, prismaResult: any, interfaceResult: any): {
    availableArtifacts: string[];
    analysisContent: string;
    prismaContent: string;
    interfaceContent: string;
    contextPrompt: string;
  } {
    const availableArtifacts: string[] = [];
    let analysisContent = '';
    let prismaContent = '';
    let interfaceContent = '';

    // Extract analysis content
    if (analysisResult?.files) {
      availableArtifacts.push('Requirements Analysis');
      const analysisFiles = Object.entries(analysisResult.files)
        .map(([filename, content]) => `### ${filename}\n${content}`)
        .join('\n\n');
      analysisContent = `## Requirements Analysis\n${analysisFiles}`;
    }

    // Extract Prisma schema content
    if (prismaResult?.schemas) {
      availableArtifacts.push('Prisma Database Schema');
      const schemaFiles = Object.entries(prismaResult.schemas)
        .map(([filename, content]) => `### ${filename}\n${content}`)
        .join('\n\n');
      prismaContent = `## Prisma Database Schema\n${schemaFiles}`;
    }

    // Extract API interface content
    if (interfaceResult?.files) {
      availableArtifacts.push('API Interface Specification');
      const interfaceFiles = Object.entries(interfaceResult.files)
        .map(([filename, content]) => `### ${filename}\n${content}`)
        .join('\n\n');
      interfaceContent = `## API Interface Specification\n${interfaceFiles}`;
    }

    // Create context prompt with all available artifacts
    const contextSections = [analysisContent, prismaContent, interfaceContent].filter(Boolean);
    const contextPrompt = contextSections.length > 0 
      ? `\n\n# GENERATED ARTIFACTS TO REFERENCE\n\nPlease base your answer on the following generated artifacts:\n\n${contextSections.join('\n\n')}\n\n# QUESTION\n\n`
      : '\n\n# QUESTION\n\nNote: No generated artifacts are available yet for this question.\n\n';

    return {
      availableArtifacts,
      analysisContent,
      prismaContent,
      interfaceContent,
      contextPrompt
    };
  }

  private async askAdversarialQuestionWithContext(agent: AutoBeAgentType, question: string, artifacts: any, runId: string, questionIndex: number, totalQuestions: number): Promise<{
    question: string;
    response: string;
    validated: boolean;
    issues: string[];
    timestamp: string;
    category?: string;
  }> {
    const timestamp = new Date().toISOString();
    const category = this.categorizeQuestion(question, questionIndex);
    const questionProgress = `${questionIndex + 1}/${totalQuestions}`;
    const categoryTag = `[${category.toUpperCase()}]`;
    
    try {
      // Create context-aware question by including generated artifacts
      const contextAwareQuestion = artifacts.contextPrompt + question;
      
      // Execute question with context and get response
      const conversationHistory = await agent.conversate(contextAwareQuestion);
      const lastMessage = conversationHistory[conversationHistory.length - 1];
      const response = lastMessage?.type === 'assistantMessage' ? (lastMessage as any).text : 'No response received';
      const validation = await this.validation.validateResponse(question, response);
      
      // Log complete Q&A pair with context info
      this.logCompleteQuestionAnswerWithContext(runId, categoryTag, questionProgress, question, response, validation, artifacts.availableArtifacts);
      
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
      
      // Log failed Q&A pair
      this.logFailedQuestionAnswer(runId, categoryTag, questionProgress, question, errorMessage);
      
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


  private logCompleteQuestionAnswerWithContext(runId: string, categoryTag: string, questionProgress: string, question: string, response: string, validation: { validated: boolean; issues: string[] }, availableArtifacts: string[]): void {
    const statusIcon = validation.validated ? '✅' : '⚠️';
    const statusText = validation.validated ? 'PASS' : 'FAIL';
    const responsePreview = response.length > 100 ? response.substring(0, 100) + '...' : response;
    const artifactsInfo = availableArtifacts.length > 0 ? `Based on: ${availableArtifacts.join(', ')}` : 'No artifacts available';
    
    // Log complete Q&A pair to file
    this.logger.log(runId, `${categoryTag} Q&A Complete (${questionProgress}):`);
    this.logger.log(runId, `  Context: ${artifactsInfo}`);
    this.logger.log(runId, `  Question: ${question}`);
    this.logger.log(runId, `  Response (${response.length} chars): ${response}`);
    this.logger.log(runId, `  Validation: ${statusText}`);
    
    const hasValidationIssues = !validation.validated && validation.issues.length > 0;
    if (hasValidationIssues) {
      this.logger.log(runId, `  Issues: ${validation.issues.join('; ')}`, 'WARN');
    }
    
    // Log complete Q&A pair to console
    console.log(`
${statusIcon} ${categoryTag} Q&A Completed (${questionProgress}):
📋 Context: ${artifactsInfo}
❓ Question: ${question}
💬 Response: ${responsePreview}
📊 Validation: ${statusText}${hasValidationIssues ? ` (Issues: ${validation.issues.join('; ')})` : ''}
`);
  }


  private logFailedQuestionAnswer(runId: string, categoryTag: string, questionProgress: string, question: string, errorMessage: string): void {
    // Log failed Q&A pair to file
    this.logger.log(runId, `${categoryTag} Q&A Failed (${questionProgress}):`);
    this.logger.log(runId, `  Question: ${question}`);
    this.logger.log(runId, `  Error: ${errorMessage}`, 'ERROR');
    
    // Log failed Q&A pair to console
    console.log(`
❌ ${categoryTag} Q&A Failed (${questionProgress}):
❓ Question: ${question}
🚫 Error: ${errorMessage}
`);
  }

  private determineFailureReason(result: BenchmarkResult): string {
    const { stages, errors } = result;
    
    // Check stage failures with early returns
    if (!stages.analyze.success) {
      return 'Analysis stage failed';
    }
    
    if (!stages.prisma.success) {
      const prismaErrors = stages.prisma.errors.join(', ') || 'Unknown error';
      return `Prisma stage failed: ${prismaErrors}`;
    }
    
    if (!stages.interface.success) {
      return 'Interface stage failed';
    }
    
    // Check general errors
    const hasGeneralErrors = errors.length > 0;
    if (hasGeneralErrors) {
      return `General errors: ${errors.join(', ')}`;
    }
    
    return 'Unknown failure reason';
  }

  private categorizeQuestion(question: string, _questionIndex: number): string {
    const questionLower = question.toLowerCase();
    
    // Analysis-related keywords with early return
    const analysisKeywords = ['requirements analysis', 'in the requirements', '분석에', '요구사항'];
    const hasAnalysisKeywords = analysisKeywords.some(keyword => questionLower.includes(keyword));
    if (hasAnalysisKeywords) {
      return 'analysis';
    }
    
    // Schema/Database-related keywords with early return
    const schemaKeywords = ['database schema', 'schema design', 'schema', '데이터베이스', '스키마'];
    const hasSchemaKeywords = schemaKeywords.some(keyword => questionLower.includes(keyword));
    if (hasSchemaKeywords) {
      return 'schema';
    }
    
    // API/Interface-related keywords with early return
    const apiKeywords = ['api interface', 'api', 'endpoint', 'interface', '인터페이스'];
    const hasApiKeywords = apiKeywords.some(keyword => questionLower.includes(keyword));
    if (hasApiKeywords) {
      return 'api';
    }
    
    // Security-related keywords with early return
    const securityKeywords = ['security', 'authentication', 'authorization', 'payment', '보안', '인증', '결제'];
    const hasSecurityKeywords = securityKeywords.some(keyword => questionLower.includes(keyword));
    if (hasSecurityKeywords) {
      return 'security';
    }
    
    // Performance-related keywords with early return
    const performanceKeywords = ['performance', 'optimization', 'speed', 'concurrent', 'rate limiting', '성능', '최적화', '동시'];
    const hasPerformanceKeywords = performanceKeywords.some(keyword => questionLower.includes(keyword));
    if (hasPerformanceKeywords) {
      return 'performance';
    }
    
    // Error Handling-related keywords with early return
    const errorHandlingKeywords = ['error', 'failure', 'exception', 'timeout', 'connection fail', '에러', '실패', '오류'];
    const hasErrorHandlingKeywords = errorHandlingKeywords.some(keyword => questionLower.includes(keyword));
    if (hasErrorHandlingKeywords) {
      return 'errorHandling';
    }
    
    // Data Consistency-related keywords with early return
    const dataConsistencyKeywords = ['consistency', 'transaction', 'rollback', 'concurrent', 'inventory', 'stock', '일관성', '트랜잭션', '재고'];
    const hasDataConsistencyKeywords = dataConsistencyKeywords.some(keyword => questionLower.includes(keyword));
    if (hasDataConsistencyKeywords) {
      return 'dataConsistency';
    }
    
    // User Experience-related keywords with early return
    const userExperienceKeywords = ['user', 'content', 'length limit', 'search', 'recommendation', 'discount', 'shipping', '사용자', '콘텐츠', '검색', '추천', '할인', '배송'];
    const hasUserExperienceKeywords = userExperienceKeywords.some(keyword => questionLower.includes(keyword));
    if (hasUserExperienceKeywords) {
      return 'userExperience';
    }
    
    return 'general';
  }

  async runScenarioMultipleTimes(agent: AutoBeAgentType, scenario: TestScenario): Promise<ScenarioResults> {
    const scenarioStartTime = Date.now();
    const scenarioId = this.createScenarioId(scenario.name, scenarioStartTime);
    
    this.logScenarioStart(scenarioId, scenario.name);
    
    const runs: BenchmarkResult[] = [];
    let successfulRuns = 0;
    
    for (let i = 1; i <= this.runsPerScenario; i++) {
      console.log(`\n📍 Run ${i}/${this.runsPerScenario} for ${scenario.name}`);
      
      const runResult = await this.executeScenarioRun(agent, scenario, i);
      runs.push(runResult);
      
      if (runResult.flowSuccess) {
        successfulRuns++;
      }
      
      const isNotLastRun = i < this.runsPerScenario;
      if (isNotLastRun) {
        console.log("⏸️  Waiting 3 seconds before next run...");
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    const totalScenarioDuration = Date.now() - scenarioStartTime;
    const scenarioMetrics = this.calculateScenarioMetrics(runs, successfulRuns, totalScenarioDuration);
    
    this.logScenarioCompletion(scenarioId, scenario.name, scenarioMetrics, successfulRuns);
    
    return {
      scenarioName: scenario.name,
      totalRuns: this.runsPerScenario,
      successfulRuns,
      ...scenarioMetrics,
      runs
    };
  }

  private createScenarioId(scenarioName: string, startTime: number): string {
    return `scenario-${scenarioName.replace(/\s+/g, '-').toLowerCase()}-${startTime}`;
  }

  private logScenarioStart(scenarioId: string, scenarioName: string): void {
    this.logger.log(scenarioId, `Starting scenario "${scenarioName}" with ${this.runsPerScenario} runs`);
    console.log(`\n🔄 Running scenario "${scenarioName}" ${this.runsPerScenario} times...`);
  }

  private async executeScenarioRun(agent: AutoBeAgentType, scenario: TestScenario, runNumber: number): Promise<BenchmarkResult> {
    try {
      return await this.runBenchmark(agent, scenario);
    } catch (error) {
      return this.createFailedRunResult(scenario, runNumber, error);
    }
  }

  private createFailedRunResult(scenario: TestScenario, runNumber: number, error: unknown): BenchmarkResult {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const failedRunId = `${scenario.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}-FAILED`;
    
    console.error(`❌ Run ${runNumber} failed:`, error);
    
    this.tryLogError(failedRunId, runNumber, errorMessage);
    
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
      failureReason: `Critical error in run ${runNumber}: ${errorMessage}`,
      timestamp: new Date().toISOString()
    };
    
    this.trySaveFailedRunData(failedResult, failedRunId);
    
    return failedResult;
  }

  private tryLogError(failedRunId: string, runNumber: number, errorMessage: string): void {
    try {
      this.logger.log(failedRunId, `Run ${runNumber} failed with critical error: ${errorMessage}`, 'ERROR');
    } catch (logError) {
      console.error(`Failed to log error for run ${runNumber}:`, logError);
    }
  }

  private trySaveFailedRunData(failedResult: BenchmarkResult, failedRunId: string): void {
    try {
      this.fileManager.saveRunData(failedResult);
    } catch (saveError) {
      console.error(`Failed to save failed run data for ${failedRunId}:`, saveError);
    }
  }

  private calculateScenarioMetrics(runs: BenchmarkResult[], successfulRuns: number, totalScenarioDuration: number) {
    const successRate = (successfulRuns / this.runsPerScenario) * 100;
    const averageCompleteness = runs.reduce((sum, run) => sum + run.completenessScore, 0) / runs.length;
    const averageDuration = runs.reduce((sum, run) => sum + run.duration, 0) / runs.length;
    
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
    
    const averageStageTimings = {
      analysis: runs.reduce((sum, run) => sum + run.stages.analyze.duration, 0) / runs.length,
      schema: runs.reduce((sum, run) => sum + run.stages.prisma.duration, 0) / runs.length,
      api: runs.reduce((sum, run) => sum + run.stages.interface.duration, 0) / runs.length
    };

    return {
      successRate,
      averageCompleteness,
      averageCompletenessBreakdown,
      averageDuration,
      averageStageTimings,
      totalScenarioDuration
    };
  }

  private logScenarioCompletion(scenarioId: string, scenarioName: string, metrics: { successRate: number; averageCompleteness: number; averageDuration: number; totalScenarioDuration: number }, successfulRuns: number): void {
    this.logger.log(scenarioId, `Scenario completed in ${formatDuration(metrics.totalScenarioDuration)}`);
    this.logger.log(scenarioId, `Success rate: ${metrics.successRate.toFixed(1)}% (${successfulRuns}/${this.runsPerScenario})`);
    
    console.log(`
📊 Scenario "${scenarioName}" Summary:
   Success Rate: ${metrics.successRate.toFixed(1)}% (${successfulRuns}/${this.runsPerScenario})
   Average Completeness: ${metrics.averageCompleteness.toFixed(1)}%
   Average Duration: ${formatDuration(metrics.averageDuration)}
   Total Scenario Duration: ${formatDurationSecondsFromMs(metrics.totalScenarioDuration)}
`);
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
    
    this.logger.log(this.benchmarkId, `Full benchmark completed in ${formatDuration(totalBenchmarkDuration)}`);
    this.logger.log(this.benchmarkId, `Overall success rate: ${overallSuccessRate.toFixed(1)}%`);
    
    console.log(`\n🏁 Benchmark completed in ${formatDurationSecondsFromMs(totalBenchmarkDuration)}`);

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