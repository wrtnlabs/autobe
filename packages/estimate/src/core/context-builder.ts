import * as fs from "fs";
import { glob } from "glob";
import * as path from "path";

import type {
  AutoBEProjectStructure,
  EvaluationContext,
  ProjectDependencies,
  SourceFiles,
} from "../types";

/** Glob target definition for file discovery */
interface GlobTarget {
  dir: string | undefined;
  pattern: string;
  ignore: string[];
}

/** Build evaluation context by scanning AutoBE generated project structure */
export async function buildContext(
  rootPath: string,
): Promise<EvaluationContext> {
  const project = await scanProjectStructure(rootPath);
  const [dependencies, ignorePatterns] = await Promise.all([
    loadDependencies(rootPath),
    loadIgnorePatterns(rootPath),
  ]);
  const files = await discoverSourceFiles(project, ignorePatterns);
  const requirements = await loadRequirements(project.analysisDir);

  const tsconfigPath = fs.existsSync(path.join(rootPath, "tsconfig.json"))
    ? path.join(rootPath, "tsconfig.json")
    : undefined;

  return {
    project,
    dependencies,
    files,
    requirements,
    tsconfigPath,
  };
}

/** Load ignore patterns from .gitignore and tsconfig.json */
async function loadIgnorePatterns(rootPath: string): Promise<string[]> {
  const patterns: string[] = [
    "**/node_modules/**",
    "**/dist/**",
    "**/build/**",
    "**/.git/**",
    "**/coverage/**",
    "**/*.d.ts",
  ];

  const gitignorePath = path.join(rootPath, ".gitignore");
  const tsconfigPath = path.join(rootPath, "tsconfig.json");

  // Read both files in parallel
  const [gitignoreContent, tsconfigContent] = await Promise.all([
    fs.existsSync(gitignorePath)
      ? fs.promises.readFile(gitignorePath, "utf-8").catch(() => null)
      : Promise.resolve(null),
    fs.existsSync(tsconfigPath)
      ? fs.promises.readFile(tsconfigPath, "utf-8").catch(() => null)
      : Promise.resolve(null),
  ]);

  // Parse .gitignore
  if (gitignoreContent) {
    const gitignorePatterns = gitignoreContent
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((pattern) => {
        if (pattern.startsWith("/")) return pattern.slice(1);
        if (!pattern.includes("/")) return `**/${pattern}`;
        return pattern;
      });
    patterns.push(...gitignorePatterns);
  }

  // Parse tsconfig.json exclude
  if (tsconfigContent) {
    try {
      const tsconfig = JSON.parse(tsconfigContent);
      if (tsconfig.exclude && Array.isArray(tsconfig.exclude)) {
        patterns.push(...tsconfig.exclude);
      }
    } catch {
      // Ignore parse errors
    }
  }

  return [...new Set(patterns)];
}

/** Scan AutoBE project structure using declarative mapping */
async function scanProjectStructure(
  rootPath: string,
): Promise<AutoBEProjectStructure> {
  const dirMap = {
    analysisDir: path.join("docs", "analysis"),
    erdPath: path.join("docs", "ERD.md"),
    prismaSchemaDir: path.join("prisma", "schema"),
    structuresDir: path.join("src", "api", "structures"),
    controllersDir: path.join("src", "controllers"),
    providersDir: path.join("src", "providers"),
    testDir: path.join("test", "features", "api"),
  } as const satisfies Partial<Record<keyof AutoBEProjectStructure, string>>;

  const structure: AutoBEProjectStructure = { rootPath };

  for (const [key, relativePath] of Object.entries(dirMap)) {
    const fullPath = path.join(rootPath, relativePath);
    if (fs.existsSync(fullPath)) {
      structure[key as keyof typeof dirMap] = fullPath;
    }
  }

  return structure;
}

/** Load package.json dependencies */
async function loadDependencies(
  rootPath: string,
): Promise<ProjectDependencies> {
  const packageJsonPath = path.join(rootPath, "package.json");

  if (!fs.existsSync(packageJsonPath)) {
    return {
      dependencies: {},
      devDependencies: {},
    };
  }

  try {
    const content = await fs.promises.readFile(packageJsonPath, "utf-8");
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

/** Discover source files using Promise.all for parallel execution */
async function discoverSourceFiles(
  project: AutoBEProjectStructure,
  ignorePatterns: string[],
): Promise<SourceFiles> {
  const globTargets = {
    controllers: {
      dir: project.controllersDir,
      pattern: "**/*.ts",
      ignore: ignorePatterns,
    },
    providers: {
      dir: project.providersDir,
      pattern: "**/*.ts",
      ignore: ignorePatterns,
    },
    structures: {
      dir: project.structuresDir,
      pattern: "**/*.ts",
      ignore: ignorePatterns,
    },
    tests: { dir: project.testDir, pattern: "**/*.ts", ignore: ignorePatterns },
    prismaSchemas: {
      dir: project.prismaSchemaDir,
      pattern: "**/*.prisma",
      ignore: [],
    },
  } as const satisfies Record<string, GlobTarget>;

  const entries = await Promise.all(
    Object.entries(globTargets).map(
      async ([key, { dir, pattern, ignore }]) =>
        [
          key,
          dir
            ? await glob(pattern, {
                cwd: dir,
                ignore,
                absolute: true,
                nodir: true,
              })
            : [],
        ] as const,
    ),
  );

  const files = Object.fromEntries(entries) as Record<
    keyof typeof globTargets,
    string[]
  >;

  // Discover ALL TypeScript files under src/ (includes decorators, utils, guards, etc.)
  const srcDir = path.join(project.rootPath, "src");
  const allTypescript = fs.existsSync(srcDir)
    ? await glob("**/*.ts", {
        cwd: srcDir,
        ignore: ignorePatterns,
        absolute: true,
        nodir: true,
      })
    : [
        ...files.controllers,
        ...files.providers,
        ...files.structures,
        ...files.tests,
      ];

  return {
    ...files,
    typescript: allTypescript,
  };
}

/** Load requirements from docs/analysis/ */
async function loadRequirements(
  analysisDir?: string,
): Promise<string[] | undefined> {
  if (!analysisDir || !fs.existsSync(analysisDir)) {
    return undefined;
  }

  const mdFiles = await glob("**/*.md", {
    cwd: analysisDir,
    absolute: true,
    nodir: true,
  });

  const requirements = await Promise.all(
    mdFiles.map(async (file) => {
      try {
        return await fs.promises.readFile(file, "utf-8");
      } catch {
        return null;
      }
    }),
  );

  const validRequirements = requirements.filter((r): r is string => r !== null);
  return validRequirements.length > 0 ? validRequirements : undefined;
}
