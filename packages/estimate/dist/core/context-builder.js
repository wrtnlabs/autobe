"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildContext = buildContext;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const glob_1 = require("glob");
/**
 * Build evaluation context by scanning AutoBE generated project structure
 */
async function buildContext(rootPath) {
    const project = await scanProjectStructure(rootPath);
    const [dependencies, ignorePatterns] = await Promise.all([
        loadDependencies(rootPath),
        loadIgnorePatterns(rootPath),
    ]);
    const files = await discoverSourceFiles(project, ignorePatterns);
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
async function loadIgnorePatterns(rootPath) {
    const patterns = [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/.git/**',
        '**/coverage/**',
        '**/*.d.ts',
    ];
    const gitignorePath = path.join(rootPath, '.gitignore');
    const tsconfigPath = path.join(rootPath, 'tsconfig.json');
    // Read both files in parallel
    const [gitignoreContent, tsconfigContent] = await Promise.all([
        fs.existsSync(gitignorePath)
            ? fs.promises.readFile(gitignorePath, 'utf-8').catch(() => null)
            : Promise.resolve(null),
        fs.existsSync(tsconfigPath)
            ? fs.promises.readFile(tsconfigPath, 'utf-8').catch(() => null)
            : Promise.resolve(null),
    ]);
    // Parse .gitignore
    if (gitignoreContent) {
        const gitignorePatterns = gitignoreContent
            .split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('#'))
            .map(pattern => {
            if (pattern.startsWith('/'))
                return pattern.slice(1);
            if (!pattern.includes('/'))
                return `**/${pattern}`;
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
        }
        catch {
            // Ignore parse errors
        }
    }
    return [...new Set(patterns)];
}
/**
 * Scan AutoBE project structure using declarative mapping
 */
async function scanProjectStructure(rootPath) {
    const dirMap = {
        analysisDir: path.join('docs', 'analysis'),
        erdPath: path.join('docs', 'ERD.md'),
        prismaSchemaDir: path.join('prisma', 'schema'),
        structuresDir: path.join('src', 'api', 'structures'),
        controllersDir: path.join('src', 'controllers'),
        providersDir: path.join('src', 'providers'),
        testDir: path.join('test', 'features', 'api'),
    };
    const structure = { rootPath };
    for (const [key, relativePath] of Object.entries(dirMap)) {
        const fullPath = path.join(rootPath, relativePath);
        if (fs.existsSync(fullPath)) {
            structure[key] = fullPath;
        }
    }
    return structure;
}
/**
 * Load package.json dependencies
 */
async function loadDependencies(rootPath) {
    const packageJsonPath = path.join(rootPath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
        return {
            dependencies: {},
            devDependencies: {},
        };
    }
    try {
        const content = await fs.promises.readFile(packageJsonPath, 'utf-8');
        const pkg = JSON.parse(content);
        return {
            packageJsonPath,
            dependencies: pkg.dependencies || {},
            devDependencies: pkg.devDependencies || {},
        };
    }
    catch {
        return {
            dependencies: {},
            devDependencies: {},
        };
    }
}
/**
 * Discover source files using Promise.all for parallel execution
 */
async function discoverSourceFiles(project, ignorePatterns) {
    const globTargets = {
        controllers: { dir: project.controllersDir, pattern: '**/*.ts', ignore: ignorePatterns },
        providers: { dir: project.providersDir, pattern: '**/*.ts', ignore: ignorePatterns },
        structures: { dir: project.structuresDir, pattern: '**/*.ts', ignore: ignorePatterns },
        tests: { dir: project.testDir, pattern: '**/*.ts', ignore: ignorePatterns },
        prismaSchemas: { dir: project.prismaSchemaDir, pattern: '**/*.prisma', ignore: [] },
    };
    const entries = await Promise.all(Object.entries(globTargets).map(async ([key, { dir, pattern, ignore }]) => [
        key,
        dir
            ? await (0, glob_1.glob)(pattern, { cwd: dir, ignore, absolute: true, nodir: true })
            : [],
    ]));
    const files = Object.fromEntries(entries);
    return {
        ...files,
        typescript: [
            ...files.controllers,
            ...files.providers,
            ...files.structures,
            ...files.tests,
        ],
    };
}
/**
 * Load requirements from docs/analysis/
 */
async function loadRequirements(analysisDir) {
    if (!analysisDir || !fs.existsSync(analysisDir)) {
        return undefined;
    }
    const mdFiles = await (0, glob_1.glob)('**/*.md', {
        cwd: analysisDir,
        absolute: true,
        nodir: true,
    });
    const requirements = await Promise.all(mdFiles.map(async (file) => {
        try {
            return await fs.promises.readFile(file, 'utf-8');
        }
        catch {
            return null;
        }
    }));
    const validRequirements = requirements.filter((r) => r !== null);
    return validRequirements.length > 0 ? validRequirements : undefined;
}
//# sourceMappingURL=context-builder.js.map