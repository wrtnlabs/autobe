import { AutoBeAnalyzeRole } from "@autobe/interface";

import { AutoBeAnalyzeFile } from "./AutoBeAnalyzeFile";

export interface AutoBeAnalyzeWriteProps {
  totalFiles: Pick<AutoBeAnalyzeFile, "filename" | "reason">[];
  file: AutoBeAnalyzeFile;
  roles: AutoBeAnalyzeRole[];
  progress: { total: number; completed: number };
  prevReview?: string;
  language?: string;
}
