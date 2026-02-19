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
exports.BaseAgent = void 0;
const llm_client_1 = require("./llm-client");
/** Base class for AI evaluation agents */
class BaseAgent {
    client;
    config;
    constructor(config) {
        this.config = config;
        this.client = new llm_client_1.LLMClient(config);
    }
    /** Parse JSON response from LLM */
    parseResponse(content) {
        try {
            let jsonStr = content;
            if (jsonStr.includes("```json")) {
                jsonStr = jsonStr.replace(/```json\n?/g, "").replace(/```\n?/g, "");
            }
            else if (jsonStr.includes("```")) {
                jsonStr = jsonStr.replace(/```\n?/g, "");
            }
            const parsed = JSON.parse(jsonStr.trim());
            return {
                issues: parsed.issues || [],
                score: typeof parsed.score === "number" ? parsed.score : 100,
                summary: parsed.summary || "No summary provided",
            };
        }
        catch (_error) {
            console.error("Failed to parse agent response:", _error);
            console.error("Raw content:", content);
            return {
                issues: [],
                score: 100,
                summary: "Failed to parse agent response",
            };
        }
    }
    /** Read file contents for evaluation */
    async readFiles(filePaths) {
        const fs = await Promise.resolve().then(() => __importStar(require("fs/promises")));
        const contents = new Map();
        for (const filePath of filePaths) {
            try {
                const content = await fs.readFile(filePath, "utf-8");
                contents.set(filePath, content);
            }
            catch (_error) {
                console.error(`Failed to read file: ${filePath}`);
            }
        }
        return contents;
    }
    /** Load prompt from file in prompts/ directory */
    async loadPrompt(filename) {
        const fs = await Promise.resolve().then(() => __importStar(require("fs/promises")));
        const path = await Promise.resolve().then(() => __importStar(require("path")));
        const promptPath = path.resolve(__dirname, "../../prompts", filename);
        return fs.readFile(promptPath, "utf-8");
    }
    /** Truncate content if too long */
    truncateContent(content, maxChars = 50000) {
        if (content.length <= maxChars) {
            return content;
        }
        return content.slice(0, maxChars) + "\n\n... [truncated due to length]";
    }
}
exports.BaseAgent = BaseAgent;
//# sourceMappingURL=base-agent.js.map