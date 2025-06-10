import { IPointer } from "tstl";

type Filename = string;
type FileContent = string;

export interface AutoBEAnalyzeFileMap extends Record<Filename, FileContent> {}

export type AutoBeAnalyzePointer = IPointer<{
  files: AutoBEAnalyzeFileMap;
} | null>;
