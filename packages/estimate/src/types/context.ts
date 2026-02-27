export interface RuntimeTestResult {
  passed: number;
  failed: number;
  total: number;
  durationMs: number;
}

export interface RuntimeResult {
  serverStarted: boolean;
  healthCheckUrl?: string;
  testResults?: RuntimeTestResult;
  error?: string;
}

export interface AutoBEProjectStructure {
  /** Project root path */
  rootPath: string;
  /** Docs/analysis/ folder (requirements analysis) */
  analysisDir?: string;
  /** Docs/ERD.md */
  erdPath?: string;
  /** Prisma/schema/ */
  prismaSchemaDir?: string;
  /** Src/api/structures/ (DTO) */
  structuresDir?: string;
  /** Src/controllers/ */
  controllersDir?: string;
  /** Src/providers/ */
  providersDir?: string;
  /** Test/features/api/ */
  testDir?: string;
}

export interface ProjectDependencies {
  /** Package.json path */
  packageJsonPath?: string;
  /** Dependencies */
  dependencies: Record<string, string>;
  /** DevDependencies */
  devDependencies: Record<string, string>;
}

export interface SourceFiles {
  /** All TypeScript files */
  typescript: string[];
  /** Controller files */
  controllers: string[];
  /** Provider files */
  providers: string[];
  /** DTO/structure files */
  structures: string[];
  /** Test files */
  tests: string[];
  /** Prisma schema files */
  prismaSchemas: string[];
}

export interface EvaluationContext {
  /** Project structure */
  project: AutoBEProjectStructure;
  /** Dependency information */
  dependencies: ProjectDependencies;
  /** Source files */
  files: SourceFiles;
  /** Requirements document content (parsed from docs/analysis/) */
  requirements?: string[];
  /** Tsconfig.json path */
  tsconfigPath?: string;
  /** ESLint config path */
  eslintConfigPath?: string;
  /** Runtime evaluation result */
  runtimeResult?: RuntimeResult;
  /** Evaluation options */
  options?: EvaluationOptions; // ← 이게 핵심, 위에꺼랑 달라요
}

export interface EvaluationInput {
  /** Target project path */
  inputPath: string;
  /** Output directory */
  outputPath: string;
  /** Evaluation options */
  options?: EvaluationOptions;
}

export interface EvaluationOptions {
  /** Run specific phases only */
  phases?: string[];
  /** Verbose logging */
  verbose?: boolean;
  /** Continue even if gate fails */
  continueOnGateFailure?: boolean;
  /** Run tests */
  runTests?: boolean;
  golden?: boolean;
  project?: string;
  /** Minimum passing score */
  minScore?: number;
}
