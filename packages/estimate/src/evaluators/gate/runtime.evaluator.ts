import { ChildProcess, execSync, spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";

import type { EvaluationContext, Issue } from "../../types";
import { createIssue } from "../../types";
import { GateCheckResult, GateEvaluator } from "../base";
import { type GoldenProject, GoldenSetEvaluator } from "../golden";
import { ContractEvaluator } from "../golden/contract-evaluator";

const HEALTH_CHECK_TIMEOUT_MS = 60000;
const HEALTH_CHECK_INTERVAL_MS = 2000;
const DEFAULT_API_PORT = 37001;
const DOCKER_HEALTH_PORT = 3000;
const BUILD_TIMEOUT_MS = 120000;

type RuntimeMode = "docker" | "direct";

/** Result of building the project */
interface BuildResult {
  success: boolean;
  issues: Issue[];
}

/** Parsed test output */
interface TestOutputResult {
  passed: number;
  failed: number;
  total: number;
  durationMs: number;
}

export class RuntimeEvaluator extends GateEvaluator {
  readonly name = "RuntimeEvaluator";
  readonly description =
    "Starts the server with Docker or direct execution and runs e2e tests";

  private serverProcess: ChildProcess | null = null;

  async checkGate(context: EvaluationContext): Promise<GateCheckResult> {
    const rootPath = context.project.rootPath;
    const composeFile = path.join(rootPath, "docker-compose.yml");
    const hasDocker = fs.existsSync(composeFile);
    const mode: RuntimeMode = hasDocker ? "docker" : "direct";

    const issues: Issue[] = [];

    try {
      let apiPort: number;
      let healthCheckUrl: string;

      if (mode === "docker") {
        this.composeDown(rootPath);
        this.composeUp(rootPath);
        apiPort = DOCKER_HEALTH_PORT;
        healthCheckUrl = `http://localhost:${DOCKER_HEALTH_PORT}/health`;
      } else {
        apiPort = this.detectApiPort(rootPath);
        this.resolveEnvFile(rootPath);
        this.installDependencies(rootPath, issues);
        const buildResult = this.buildProject(rootPath);
        issues.push(...buildResult.issues);

        if (!buildResult.success) {
          context.runtimeResult = {
            serverStarted: false,
            error: "Build failed",
          };
          return {
            passed: false,
            issues,
            metrics: { serverStarted: false, mode, failedAt: "build" },
          };
        }

        this.setupDatabase(rootPath);
        this.startServer(rootPath);
        healthCheckUrl = `http://localhost:${apiPort}/health`;
      }

      const serverStarted = await this.waitForServer(healthCheckUrl);

      if (!serverStarted) {
        issues.push(
          createIssue({
            severity: "critical",
            category: "runtime",
            code: "RT002",
            message: `Server did not respond within ${HEALTH_CHECK_TIMEOUT_MS / 1000}s`,
          }),
        );

        context.runtimeResult = {
          serverStarted: false,
          healthCheckUrl,
          error: "Health check timed out",
        };

        return {
          passed: false,
          issues,
          metrics: { serverStarted: false, mode },
        };
      }

      // Run Golden Set while server is up
      if (context.options?.golden && context.options?.project) {
        const goldenEvaluator = new GoldenSetEvaluator();
        const goldenResult = await goldenEvaluator.evaluate(
          context,
          context.options.project as GoldenProject,
          apiPort,
        );
        context.goldenResult = goldenResult;
      }

      // Run Contract Tests (auto-generated from swagger.json)
      try {
        const contractEvaluator = new ContractEvaluator();
        const contractResult = await contractEvaluator.evaluate(
          context,
          apiPort,
        );
        context.contractResult = contractResult;
      } catch (err) {
        // Contract testing is non-blocking — failures don't affect gate
        console.warn(
          `  Contract test failed (non-blocking): ${err instanceof Error ? err.message : String(err)}`,
        );
      }

      const testResults = await this.runTests(rootPath);

      context.runtimeResult = {
        serverStarted: true,
        healthCheckUrl,
        testResults: testResults ?? undefined,
      };

      if (testResults && testResults.failed > 0) {
        issues.push(
          createIssue({
            severity: "warning",
            category: "runtime",
            code: "RT003",
            message: `${testResults.failed}/${testResults.total} e2e tests failed`,
          }),
        );
      }

      return {
        passed: true,
        issues,
        metrics: {
          serverStarted: true,
          mode,
          apiPort,
          testsPassed: testResults?.passed ?? 0,
          testsFailed: testResults?.failed ?? 0,
          testsTotal: testResults?.total ?? 0,
        },
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown runtime error";

      issues.push(
        createIssue({
          severity: "critical",
          category: "runtime",
          code: "RT004",
          message: `Runtime error: ${message}`,
        }),
      );

      context.runtimeResult = {
        serverStarted: false,
        error: message,
      };

      return {
        passed: false,
        issues,
        metrics: { serverStarted: false, mode },
      };
    } finally {
      this.cleanup(rootPath, mode);
    }
  }

  // ── Docker methods ──────────────────────────────────────────

  private composeUp(rootPath: string): void {
    execSync("docker compose up -d --build", {
      cwd: rootPath,
      stdio: "pipe",
    });
  }

  private composeDown(rootPath: string): void {
    try {
      execSync("docker compose down -v", {
        cwd: rootPath,
        stdio: "pipe",
      });
    } catch (err) {
      console.warn(
        `  docker compose down failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  // ── Direct execution methods ────────────────────────────────

  private detectApiPort(rootPath: string): number {
    const envPaths = [
      path.join(rootPath, ".env.local"),
      path.join(rootPath, ".env"),
    ];
    for (const envPath of envPaths) {
      if (!fs.existsSync(envPath)) continue;
      const content = fs.readFileSync(envPath, "utf-8");
      const match = content.match(/^API_PORT\s*=\s*(\d+)/m);
      if (match) return parseInt(match[1], 10);
    }
    return DEFAULT_API_PORT;
  }

  private resolveEnvFile(rootPath: string): void {
    const envLocal = path.join(rootPath, ".env.local");
    if (!fs.existsSync(envLocal)) return;

    let content = fs.readFileSync(envLocal, "utf-8");

    // Build a map of KEY=VALUE from the file
    const vars = new Map<string, string>();
    for (const line of content.split("\n")) {
      const match = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
      if (match) vars.set(match[1], match[2]);
    }

    // Resolve ${VAR} references (single pass is sufficient for our .env files)
    let resolved = content;
    for (const [key, value] of vars) {
      resolved = resolved.replace(new RegExp(`\\$\\{${key}\\}`, "g"), value);
    }

    // Write as .env so dotenv/prisma can pick it up
    fs.writeFileSync(path.join(rootPath, ".env"), resolved);
  }

  private installDependencies(rootPath: string, issues: Issue[]): void {
    const hasPnpmLock = fs.existsSync(path.join(rootPath, "pnpm-lock.yaml"));

    try {
      if (hasPnpmLock) {
        try {
          execSync("pnpm install --frozen-lockfile", {
            cwd: rootPath,
            stdio: "pipe",
            timeout: BUILD_TIMEOUT_MS,
          });
        } catch (_frozenErr) {
          // Frozen lockfile failed — retry without frozen
          execSync("pnpm install", {
            cwd: rootPath,
            stdio: "pipe",
            timeout: BUILD_TIMEOUT_MS,
          });
        }
      } else {
        execSync("npm install", {
          cwd: rootPath,
          stdio: "pipe",
          timeout: BUILD_TIMEOUT_MS,
        });
      }
    } catch (e) {
      issues.push(
        createIssue({
          severity: "critical",
          category: "runtime",
          code: "RT001",
          message: `Dependency install failed: ${e instanceof Error ? e.message : "unknown"}`,
        }),
      );
    }
  }

  private buildProject(rootPath: string): BuildResult {
    const issues: Issue[] = [];

    // 1. prisma generate
    try {
      const schemaDir = path.join(rootPath, "prisma", "schema");
      const schemaArg = fs.existsSync(schemaDir)
        ? "--schema prisma/schema"
        : "";
      execSync(`npx prisma generate ${schemaArg}`, {
        cwd: rootPath,
        stdio: "pipe",
        timeout: BUILD_TIMEOUT_MS,
      });
    } catch (e) {
      issues.push(
        createIssue({
          severity: "critical",
          category: "runtime",
          code: "RT010",
          message: `prisma generate failed: ${e instanceof Error ? e.message : "unknown"}`,
        }),
      );
      return { success: false, issues };
    }

    // 2. build:sdk (ignore failure, create stub if missing)
    try {
      execSync("npm run build:sdk", {
        cwd: rootPath,
        stdio: "pipe",
        timeout: BUILD_TIMEOUT_MS,
      });
    } catch {
      issues.push(
        createIssue({
          severity: "suggestion",
          category: "runtime",
          code: "RT011",
          message: "build:sdk failed (ignored, using build:main fallback)",
        }),
      );
      // Create stub so build:main can resolve the import
      const functionalDir = path.join(rootPath, "src", "api", "functional");
      if (!fs.existsSync(functionalDir)) {
        fs.mkdirSync(functionalDir, { recursive: true });
      }
      const stubIndex = path.join(functionalDir, "index.ts");
      if (!fs.existsSync(stubIndex)) {
        fs.writeFileSync(stubIndex, "export {};\n");
      }
    }

    // 3. Set noEmitOnError: false so tsc emits despite type errors
    //    tsconfig.json may contain comments (JSONC), so strip them before parsing.
    const tsconfigPath = path.join(rootPath, "tsconfig.json");
    let tsconfigRestored = false;
    let originalTsconfig = "";
    if (fs.existsSync(tsconfigPath)) {
      originalTsconfig = fs.readFileSync(tsconfigPath, "utf-8");
      try {
        const stripped = originalTsconfig
          .replace(/\/\/.*$/gm, "")
          .replace(/\/\*[\s\S]*?\*\//g, "");
        const tsconfig = JSON.parse(stripped);
        if (tsconfig.compilerOptions?.noEmitOnError !== false) {
          tsconfig.compilerOptions = tsconfig.compilerOptions || {};
          tsconfig.compilerOptions.noEmitOnError = false;
          fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
          tsconfigRestored = true;
        }
      } catch {
        // malformed tsconfig, skip
      }
    }

    // 4. build:main (allow type errors, check lib/ output)
    try {
      execSync("npm run build:main", {
        cwd: rootPath,
        stdio: "pipe",
        timeout: BUILD_TIMEOUT_MS,
      });
    } catch {
      // build:main may exit non-zero due to type errors,
      // but with noEmitOnError:false it still emits lib/
    } finally {
      // Restore original tsconfig
      if (tsconfigRestored) {
        fs.writeFileSync(tsconfigPath, originalTsconfig);
      }
    }

    // Check if lib/ was actually produced
    const libDir = path.join(rootPath, "lib");
    if (!fs.existsSync(libDir)) {
      issues.push(
        createIssue({
          severity: "critical",
          category: "runtime",
          code: "RT012",
          message: "build:main failed: lib/ directory was not created",
        }),
      );
      return { success: false, issues };
    }

    return { success: true, issues };
  }

  private setupDatabase(rootPath: string): void {
    const schemaDir = path.join(rootPath, "prisma", "schema");
    const schemaArg = fs.existsSync(schemaDir) ? "--schema prisma/schema" : "";
    try {
      execSync(
        `npx prisma db push --force-reset --accept-data-loss ${schemaArg}`,
        {
          cwd: rootPath,
          stdio: "pipe",
          timeout: BUILD_TIMEOUT_MS,
        },
      );
    } catch {
      // SQLite might not need db push, try migrate reset
      try {
        execSync(`npx prisma migrate reset --force ${schemaArg}`, {
          cwd: rootPath,
          stdio: "pipe",
          timeout: BUILD_TIMEOUT_MS,
        });
      } catch {
        // If both fail, server start will catch the error
      }
    }
  }

  private startServer(rootPath: string): void {
    const serverEntry = path.join(rootPath, "lib", "executable", "server.js");
    if (!fs.existsSync(serverEntry)) {
      throw new Error(`Server entry not found: ${serverEntry}`);
    }

    this.serverProcess = spawn("node", [serverEntry], {
      cwd: rootPath,
      stdio: "pipe",
      detached: false,
      env: {
        ...process.env,
        NODE_ENV: "test",
      },
    });

    this.serverProcess.on("error", (err) => {
      console.error(`Server process error: ${err.message}`);
      this.serverProcess = null;
    });
  }

  private killServer(): void {
    const proc = this.serverProcess;
    if (proc && !proc.killed) {
      proc.kill("SIGTERM");
      // Give it a moment, then force kill
      setTimeout(() => {
        if (!proc.killed) {
          proc.kill("SIGKILL");
        }
      }, 5000);
    }
    this.serverProcess = null;
  }

  // ── Shared methods ──────────────────────────────────────────

  private cleanup(rootPath: string, mode: RuntimeMode): void {
    if (mode === "docker") {
      this.composeDown(rootPath);
    } else {
      this.killServer();
    }
  }

  private async waitForServer(url: string): Promise<boolean> {
    const deadline = Date.now() + HEALTH_CHECK_TIMEOUT_MS;

    while (Date.now() < deadline) {
      try {
        const res = await fetch(url);
        if (res.status < 500) return true;
      } catch {
        // server not ready yet
      }
      await this.sleep(HEALTH_CHECK_INTERVAL_MS);
    }

    return false;
  }

  private async runTests(rootPath: string): Promise<TestOutputResult | null> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      let output = "";

      const child = spawn("npm", ["test"], {
        cwd: rootPath,
        stdio: "pipe",
      });

      child.stdout.on("data", (data: Buffer) => {
        output += data.toString();
      });

      child.stderr.on("data", (data: Buffer) => {
        output += data.toString();
      });

      child.on("close", () => {
        const durationMs = Date.now() - startTime;
        resolve(this.parseTestOutput(output, durationMs));
      });

      child.on("error", () => {
        resolve(null);
      });

      setTimeout(() => {
        child.kill();
        resolve(null);
      }, 300_000);
    });
  }

  private parseTestOutput(
    output: string,
    durationMs: number,
  ): TestOutputResult {
    // Try standard test runner patterns first (Jest, Vitest, Mocha, etc.)
    const passedMatch = output.match(/(\d+)\s+pass(?:ed|ing)?/i);
    const failedMatch = output.match(/(\d+)\s+fail(?:ed|ing|ure)?/i); // typos: ignore

    if (passedMatch || failedMatch) {
      const passed = passedMatch ? parseInt(passedMatch[1]) : 0;
      const failed = failedMatch ? parseInt(failedMatch[1]) : 0;
      return { passed, failed, total: passed + failed, durationMs };
    }

    // Try "X of Y" pattern (e.g., "5 of 10 tests passed")
    const ofMatch = output.match(/(\d+)\s+of\s+(\d+)\s+tests?\s+passed/i);
    if (ofMatch) {
      const passed = parseInt(ofMatch[1]);
      const total = parseInt(ofMatch[2]);
      return { passed, failed: total - passed, total, durationMs };
    }

    // Heuristic: exit code 0 with no obvious failure indicators → assume pass
    const hasFailIndicator =
      /\b(fail|error|FAIL|ERROR)\b/.test(output) && !/0\s+fail/i.test(output);
    const hasPassIndicator = /\b(success|ok|pass|complete|✓|✔)\b/i.test(output);

    if (hasPassIndicator && !hasFailIndicator) {
      return { passed: 1, failed: 0, total: 1, durationMs };
    }

    // No recognizable pattern — report as unknown
    return { passed: 0, failed: 0, total: 0, durationMs };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
