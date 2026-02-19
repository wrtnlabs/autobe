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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VERSION = exports.createProgram = exports.runCLI = exports.generateMarkdownReport = exports.generateJsonReport = exports.EvaluationPipeline = exports.buildContext = void 0;
__exportStar(require("./types"), exports);
var core_1 = require("./core");
Object.defineProperty(exports, "buildContext", { enumerable: true, get: function () { return core_1.buildContext; } });
Object.defineProperty(exports, "EvaluationPipeline", { enumerable: true, get: function () { return core_1.EvaluationPipeline; } });
__exportStar(require("./evaluators"), exports);
var reporters_1 = require("./reporters");
Object.defineProperty(exports, "generateJsonReport", { enumerable: true, get: function () { return reporters_1.generateJsonReport; } });
Object.defineProperty(exports, "generateMarkdownReport", { enumerable: true, get: function () { return reporters_1.generateMarkdownReport; } });
var cli_1 = require("./cli");
Object.defineProperty(exports, "runCLI", { enumerable: true, get: function () { return cli_1.runCLI; } });
Object.defineProperty(exports, "createProgram", { enumerable: true, get: function () { return cli_1.createProgram; } });
exports.VERSION = '0.2.0';
//# sourceMappingURL=index.js.map