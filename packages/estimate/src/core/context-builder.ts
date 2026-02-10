import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import type {
  EvaluationContext,
  AutoBEProjectStructure,
  ProjectDependencies,
  SourceFiles,
} from '../types';

/**
 * Build evaluation context by scanning AutoBE generated project structure
 */
export async function buildContext(rootPath: string): Promise<EvaluationContext> {
  const project = await scanProjectStructure(rootPath);
  const dependencies = await loadDependencies(rootPath);
  const ignorePatterns = loadIgnorePatterns(rootPath);
  const files = await discoverSourceFiles(rootPath, project, ignorePatterns);
  const requirements = await loadRequirements(project.analysisDir);

  const tsconfigPath = fs.existsSync(path.join(rootPath, 'tsconfig.json'))
    ? path.join(rootPath, 'tsconfig.json')
    : undefined;

  return {
    project,
    dependencies,
    files,
    requirements,
    tsconfigPath,
  };
}

/**
 * Load ignore patterns from .gitignore and tsconfig.json
 */
function loadIgnorePatterns(rootPath: string): string[] {
  const patterns: string[] = [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/.git/**',
    '**/coverage/**',
    '**/*.d.ts',
  ];

  // Read .gitignore
  const gitignorePath = path.join(rootPath, '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    try {
      const content = fs.readFileSync(gitignorePath, 'utf-8');
      const gitignorePatterns = content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'))
        .map(pattern => {
          if (pattern.startsWith('/')) {
            return pattern.slice(1);
          }
          if (!pattern.includes('/')) {
            return `**/${pattern}`;
          }
          return pattern;
        });
      patterns.push(...gitignorePatterns);
    } catch {
      // Ignore read errors
    }
  }

  // Read tsconfig.json exclude
  const tsconfigPath = path.join(rootPath, 'tsconfig.json');
  if (fs.existsSync(tsconfigPath)) {
    try {
      const content = fs.readFileSync(tsconfigPath, 'utf-8');
      const tsconfig = JSON.parse(content);
      if (tsconfig.exclude && Array.isArray(tsconfig.exclude)) {
        patterns.push(...tsconfig.exclude);
      }
    } catch {
      // Ignore parse errors
    }
  }

  // Remove duplicates
  return [...new Set(patterns)];
}

/**
 * Scan AutoBE project structure
 */
async function scanProjectStructure(rootPath: string): Promise<AutoBEProjectStructure> {
  const structure: AutoBEProjectStructure = {
    rootPath,
  };

  const analysisDir = path.join(rootPath, 'docs', 'analysis');
  if (fs.existsSync(analysisDir)) {
    structure.analysisDir = analysisDir;
  }

  const erdPath = path.join(rootPath, 'docs', 'ERD.md');
  if (fs.existsSync(erdPath)) {
    structure.erdPath = erdPath;
  }

  const prismaSchemaDir = path.join(rootPath, 'prisma', 'schema');
  if (fs.existsSync(prismaSchemaDir)) {
    structure.prismaSchemaDir = prismaSchemaDir;
  }

  const structuresDir = path.join(rootPath, 'src', 'api', 'structures');
  if (fs.existsSync(structuresDir)) {
    structure.structuresDir = structuresDir;
  }

  const controllersDir = path.join(rootPath, 'src', 'controllers');
  if (fs.existsSync(controllersDir)) {
    structure.controllersDir = controllersDir;
  }

  const providersDir = path.join(rootPath, 'src', 'providers');
  if (fs.existsSync(providersDir)) {
    structure.providersDir = providersDir;
  }

  const testDir = path.join(rootPath, 'test', 'features', 'api');
  if (fs.existsSync(testDir)) {
    structure.testDir = testDir;
  }

  return structure;
}

/**
 * Load package.json dependencies
 */
async function loadDependencies(rootPath: string): Promise<ProjectDependencies> {
  const packageJsonPath = path.join(rootPath, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    return {
      dependencies: {},
      devDependencies: {},
    };
  }

  try {
    const content = fs.readFileSync(packageJsonPath, 'utf-8');
    const pkg = JSON.parse(content);

    return {
      packageJsonPath,
      dependencies: pkg.dependencies || {},
      devDependencies: pkg.devDependencies || {},
    };
  } catch {
    return {
      dependencies: {},
      devDependencies: {},
    };
  }
}

/**
 * Discover source files - ONLY AutoBE generated folders
 */
async function discoverSourceFiles(
  rootPath: string,
  project: AutoBEProjectStructure,
  ignorePatterns: string[]
): Promise<SourceFiles> {
  const files: SourceFiles = {
    typescript: [],
    controllers: [],
    providers: [],
    structures: [],
    tests: [],
    prismaSchemas: [],
  };

  // Controllers - src/controllers/
  if (project.controllersDir) {
    files.controllers = await glob('**/*.ts', {
      cwd: project.controllersDir,
      ignore: ignorePatterns,
      absolute: true,
      nodir: true,
    });
  }

  // Providers - src/providers/
  if (project.providersDir) {
    files.providers = await glob('**/*.ts', {
      cwd: project.providersDir,
      ignore: ignorePatterns,
      absolute: true,
      nodir: true,
    });
  }

  // Structures (DTOs) - src/api/structures/
  if (project.structuresDir) {
    files.structures = await glob('**/*.ts', {
      cwd: project.structuresDir,
      ignore: ignorePatterns,
      absolute: true,
      nodir: true,
    });
  }

  // Tests - test/features/api/
  if (project.testDir) {
    files.tests = await glob('**/*.ts', {
      cwd: project.testDir,
      ignore: ignorePatterns,
      absolute: true,
      nodir: true,
    });
  }

  // Prisma schemas - prisma/schema/
  if (project.prismaSchemaDir) {
    files.prismaSchemas = await glob('**/*.prisma', {
      cwd: project.prismaSchemaDir,
      absolute: true,
      nodir: true,
    });
  }

  // Combine all TypeScript files (only AutoBE generated)
  files.typescript = [
    ...files.controllers,
    ...files.providers,
    ...files.structures,
    ...files.tests,
  ];

  return files;
}

/**
 * Load requirements from docs/analysis/
 */
async function loadRequirements(analysisDir?: string): Promise<string[] | undefined> {
  if (!analysisDir || !fs.existsSync(analysisDir)) {
    return undefined;
  }

  const requirements: string[] = [];

  const mdFiles = await glob('**/*.md', {
    cwd: analysisDir,
    absolute: true,
    nodir: true,
  });

  for (const file of mdFiles) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      requirements.push(content);
    } catch {
      // Skip unreadable files
    }
  }

  return requirements.length > 0 ? requirements : undefined;
}
