/**
 * AutoBE generated project structure
 */
export interface AutoBEProjectStructure {
  /** Project root path */
  rootPath: string;

  /** docs/analysis/ folder (requirements analysis) */
  analysisDir?: string;

  /** docs/ERD.md */
  erdPath?: string;

  /** prisma/schema/ */
  prismaSchemaDir?: string;

  /** src/api/structures/ (DTO) */
  structuresDir?: string;

  /** src/controllers/ */
  controllersDir?: string;

  /** src/providers/ */
  providersDir?: string;

  /** test/features/api/ */
  testDir?: string;
}

/**
 * Project dependencies information
 */
export interface ProjectDependencies {
  /** package.json path */
  packageJsonPath?: string;

  /** dependencies */
  dependencies: Record<string, string>;

  /** devDependencies */
  devDependencies: Record<string, string>;
}

/**
 * Discovered source files
 */
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

/**
 * Evaluation context
 * Contains all information needed for evaluation
 */
export interface EvaluationContext {
  /** Project structure */
  project: AutoBEProjectStructure;

  /** Dependency information */
  dependencies: ProjectDependencies;

  /** Source files */
  files: SourceFiles;

  /** Requirements document content (parsed from docs/analysis/) */
  requirements?: string[];

  /** tsconfig.json path */
  tsconfigPath?: string;

  /** ESLint config path */
  eslintConfigPath?: string;
}

/**
 * Evaluation input
 */
export interface EvaluationInput {
  /** Target project path */
  inputPath: string;

  /** Output directory */
  outputPath: string;

  /** Evaluation options */
  options?: EvaluationOptions;
}

/**
 * Evaluation options
 */
export interface EvaluationOptions {
  /** Run specific phases only */
  phases?: string[];

  /** Verbose logging */
  verbose?: boolean;

  /** Continue even if gate fails */
  continueOnGateFailure?: boolean;

  /** Run tests */
  runTests?: boolean;

  /** Minimum passing score */
  minScore?: number;
}
