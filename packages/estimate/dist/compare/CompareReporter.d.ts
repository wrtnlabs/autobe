import type { CompareResult } from './types';
export declare class CompareReporter {
    generateMarkdown(result: CompareResult): string;
    generateJson(result: CompareResult): string;
    printToTerminal(result: CompareResult): void;
    private printSection;
    saveReports(result: CompareResult, outputPath: string): {
        mdPath: string;
        jsonPath: string;
    };
}
//# sourceMappingURL=CompareReporter.d.ts.map