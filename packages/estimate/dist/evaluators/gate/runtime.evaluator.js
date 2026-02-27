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
exports.RuntimeEvaluator = void 0;
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const types_1 = require("../../types");
const base_1 = require("../base");
const golden_1 = require("../golden");
const HEALTH_CHECK_TIMEOUT_MS = 60000;
const HEALTH_CHECK_INTERVAL_MS = 2000;
const DEFAULT_API_PORT = 37001;
const DOCKER_HEALTH_PORT = 3000;
const BUILD_TIMEOUT_MS = 120000;
class RuntimeEvaluator extends base_1.GateEvaluator {
    name = "RuntimeEvaluator";
    description = "Starts the server with Docker or direct execution and runs e2e tests";
    serverProcess = null;
    async checkGate(context) {
        const rootPath = context.project.rootPath;
        const composeFile = path.join(rootPath, "docker-compose.yml");
        const hasDocker = fs.existsSync(composeFile);
        const mode = hasDocker ? "docker" : "direct";
        const issues = [];
        try {
            let apiPort;
            let healthCheckUrl;
            if (mode === "docker") {
                this.composeDown(rootPath);
                this.composeUp(rootPath);
                apiPort = DOCKER_HEALTH_PORT;
                healthCheckUrl = `http://localhost:${DOCKER_HEALTH_PORT}/health`;
            }
            else {
                apiPort = this.detectApiPort(rootPath);
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
                issues.push((0, types_1.createIssue)({
                    severity: "critical",
                    category: "runtime",
                    code: "RT002",
                    message: `Server did not respond within ${HEALTH_CHECK_TIMEOUT_MS / 1000}s`,
                }));
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
                const goldenEvaluator = new golden_1.GoldenSetEvaluator();
                const goldenResult = await goldenEvaluator.evaluate(context, context.options.project, apiPort);
                context.goldenResult = goldenResult;
            }
            const testResults = await this.runTests(rootPath);
            context.runtimeResult = {
                serverStarted: true,
                healthCheckUrl,
                testResults: testResults ?? undefined,
            };
            if (testResults && testResults.failed > 0) {
                issues.push((0, types_1.createIssue)({
                    severity: "warning",
                    category: "runtime",
                    code: "RT003",
                    message: `${testResults.failed}/${testResults.total} e2e tests failed`,
                }));
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
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Unknown runtime error";
            issues.push((0, types_1.createIssue)({
                severity: "critical",
                category: "runtime",
                code: "RT004",
                message: `Runtime error: ${message}`,
            }));
            context.runtimeResult = {
                serverStarted: false,
                error: message,
            };
            return {
                passed: false,
                issues,
                metrics: { serverStarted: false, mode },
            };
        }
        finally {
            this.cleanup(rootPath, mode);
        }
    }
    // ── Docker methods ──────────────────────────────────────────
    composeUp(rootPath) {
        (0, child_process_1.execSync)("docker compose up -d --build", {
            cwd: rootPath,
            stdio: "pipe",
        });
    }
    composeDown(rootPath) {
        try {
            (0, child_process_1.execSync)("docker compose down -v", {
                cwd: rootPath,
                stdio: "pipe",
            });
        }
        catch {
            // ignore cleanup failures
        }
    }
    // ── Direct execution methods ────────────────────────────────
    detectApiPort(rootPath) {
        const envPaths = [
            path.join(rootPath, ".env.local"),
            path.join(rootPath, ".env"),
        ];
        for (const envPath of envPaths) {
            if (!fs.existsSync(envPath))
                continue;
            const content = fs.readFileSync(envPath, "utf-8");
            const match = content.match(/^API_PORT\s*=\s*(\d+)/m);
            if (match)
                return parseInt(match[1], 10);
        }
        return DEFAULT_API_PORT;
    }
    buildProject(rootPath) {
        const issues = [];
        // 1. prisma generate
        try {
            const schemaDir = path.join(rootPath, "prisma", "schema");
            const schemaArg = fs.existsSync(schemaDir)
                ? "--schema prisma/schema"
                : "";
            (0, child_process_1.execSync)(`npx prisma generate ${schemaArg}`, {
                cwd: rootPath,
                stdio: "pipe",
                timeout: BUILD_TIMEOUT_MS,
            });
        }
        catch (e) {
            issues.push((0, types_1.createIssue)({
                severity: "critical",
                category: "runtime",
                code: "RT010",
                message: `prisma generate failed: ${e instanceof Error ? e.message : "unknown"}`,
            }));
            return { success: false, issues };
        }
        // 2. build:sdk (ignore failure, create stub if missing)
        try {
            (0, child_process_1.execSync)("npm run build:sdk", {
                cwd: rootPath,
                stdio: "pipe",
                timeout: BUILD_TIMEOUT_MS,
            });
        }
        catch {
            issues.push((0, types_1.createIssue)({
                severity: "suggestion",
                category: "runtime",
                code: "RT011",
                message: "build:sdk failed (ignored, using build:main fallback)",
            }));
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
        const tsconfigPath = path.join(rootPath, "tsconfig.json");
        let tsconfigRestored = false;
        let originalTsconfig = "";
        if (fs.existsSync(tsconfigPath)) {
            originalTsconfig = fs.readFileSync(tsconfigPath, "utf-8");
            try {
                const tsconfig = JSON.parse(originalTsconfig);
                if (tsconfig.compilerOptions?.noEmitOnError !== false) {
                    tsconfig.compilerOptions = tsconfig.compilerOptions || {};
                    tsconfig.compilerOptions.noEmitOnError = false;
                    fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
                    tsconfigRestored = true;
                }
            }
            catch {
                // malformed tsconfig, skip
            }
        }
        // 4. build:main (allow type errors, check lib/ output)
        try {
            (0, child_process_1.execSync)("npm run build:main", {
                cwd: rootPath,
                stdio: "pipe",
                timeout: BUILD_TIMEOUT_MS,
            });
        }
        catch {
            // build:main may exit non-zero due to type errors,
            // but with noEmitOnError:false it still emits lib/
        }
        finally {
            // Restore original tsconfig
            if (tsconfigRestored) {
                fs.writeFileSync(tsconfigPath, originalTsconfig);
            }
        }
        // Check if lib/ was actually produced
        const libDir = path.join(rootPath, "lib");
        if (!fs.existsSync(libDir)) {
            issues.push((0, types_1.createIssue)({
                severity: "critical",
                category: "runtime",
                code: "RT012",
                message: "build:main failed: lib/ directory was not created",
            }));
            return { success: false, issues };
        }
        return { success: true, issues };
    }
    setupDatabase(rootPath) {
        const schemaDir = path.join(rootPath, "prisma", "schema");
        const schemaArg = fs.existsSync(schemaDir) ? "--schema prisma/schema" : "";
        try {
            (0, child_process_1.execSync)(`npx prisma db push --force-reset --accept-data-loss ${schemaArg}`, {
                cwd: rootPath,
                stdio: "pipe",
                timeout: BUILD_TIMEOUT_MS,
            });
        }
        catch {
            // SQLite might not need db push, try migrate reset
            try {
                (0, child_process_1.execSync)(`npx prisma migrate reset --force ${schemaArg}`, {
                    cwd: rootPath,
                    stdio: "pipe",
                    timeout: BUILD_TIMEOUT_MS,
                });
            }
            catch {
                // If both fail, server start will catch the error
            }
        }
    }
    startServer(rootPath) {
        const serverEntry = path.join(rootPath, "lib", "executable", "server.js");
        if (!fs.existsSync(serverEntry)) {
            throw new Error(`Server entry not found: ${serverEntry}`);
        }
        this.serverProcess = (0, child_process_1.spawn)("node", [serverEntry], {
            cwd: rootPath,
            stdio: "pipe",
            detached: false,
            env: {
                ...process.env,
                NODE_ENV: "test",
            },
        });
        this.serverProcess.on("error", (err) => {
            throw new Error(`Server process error: ${err.message}`);
        });
    }
    killServer() {
        if (this.serverProcess && !this.serverProcess.killed) {
            this.serverProcess.kill("SIGTERM");
            // Give it a moment, then force kill
            setTimeout(() => {
                if (this.serverProcess && !this.serverProcess.killed) {
                    this.serverProcess.kill("SIGKILL");
                }
            }, 5000);
            this.serverProcess = null;
        }
    }
    // ── Shared methods ──────────────────────────────────────────
    cleanup(rootPath, mode) {
        if (mode === "docker") {
            this.composeDown(rootPath);
        }
        else {
            this.killServer();
        }
    }
    async waitForServer(url) {
        const deadline = Date.now() + HEALTH_CHECK_TIMEOUT_MS;
        while (Date.now() < deadline) {
            try {
                const res = await fetch(url);
                if (res.status < 500)
                    return true;
            }
            catch {
                // server not ready yet
            }
            await this.sleep(HEALTH_CHECK_INTERVAL_MS);
        }
        return false;
    }
    async runTests(rootPath) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            let output = "";
            const child = (0, child_process_1.spawn)("npm", ["test"], {
                cwd: rootPath,
                stdio: "pipe",
            });
            child.stdout.on("data", (data) => {
                output += data.toString();
            });
            child.stderr.on("data", (data) => {
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
    parseTestOutput(output, durationMs) {
        if (output.includes("Success") && !output.includes("Failed")) {
            return { passed: 1, failed: 0, total: 1, durationMs };
        }
        const passedMatch = output.match(/(\d+)\s+passed/i);
        const failedMatch = output.match(/(\d+)\s+failed/i);
        const passed = passedMatch ? parseInt(passedMatch[1]) : 0;
        const failed = failedMatch ? parseInt(failedMatch[1]) : 0;
        return { passed, failed, total: passed + failed, durationMs };
    }
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
exports.RuntimeEvaluator = RuntimeEvaluator;
//# sourceMappingURL=runtime.evaluator.js.map