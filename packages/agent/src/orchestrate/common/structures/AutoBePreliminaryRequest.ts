import { AutoBePreliminaryKind } from "@autobe/interface";

import { IAutoBePreliminaryGetAnalysisFiles } from "./IAutoBePreliminaryGetAnalysisFiles";
import { IAutoBePreliminaryGetInterfaceOperations } from "./IAutoBePreliminaryGetInterfaceOperations";
import { IAutoBePreliminaryGetInterfaceSchemas } from "./IAutoBePreliminaryGetInterfaceSchemas";
import { IAutoBePreliminaryGetPreviousAnalysisFiles } from "./IAutoBePreliminaryGetPreviousAnalysisFiles";
import { IAutoBePreliminaryGetPreviousInterfaceOperations } from "./IAutoBePreliminaryGetPreviousInterfaceOperations";
import { IAutoBePreliminaryGetPreviousInterfaceSchemas } from "./IAutoBePreliminaryGetPreviousInterfaceSchemas";
import { IAutoBePreliminaryGetPreviousPrismaSchemas } from "./IAutoBePreliminaryGetPreviousPrismaSchemas";
import { IAutoBePreliminaryGetPrismaSchemas } from "./IAutoBePreliminaryGetPrismaSchemas";
import { IAutoBePreliminaryGetRealizeCollectors } from "./IAutoBePreliminaryGetRealizeCollectors";
import { IAutoBePreliminaryGetRealizeTransformers } from "./IAutoBePreliminaryGetRealizeTransformers";

export interface IAutoBePreliminaryRequest<Kind extends AutoBePreliminaryKind> {
  thinking: string;
  request: Mapper[Kind];
}

type Mapper = {
  analysisFiles: IAutoBePreliminaryGetAnalysisFiles;
  prismaSchemas: IAutoBePreliminaryGetPrismaSchemas;
  interfaceOperations: IAutoBePreliminaryGetInterfaceOperations;
  interfaceSchemas: IAutoBePreliminaryGetInterfaceSchemas;
  realizeCollectors: IAutoBePreliminaryGetRealizeCollectors;
  realizeTransformers: IAutoBePreliminaryGetRealizeTransformers;
  previousAnalysisFiles: IAutoBePreliminaryGetPreviousAnalysisFiles;
  previousPrismaSchemas: IAutoBePreliminaryGetPreviousPrismaSchemas;
  previousInterfaceSchemas: IAutoBePreliminaryGetPreviousInterfaceSchemas;
  previousInterfaceOperations: IAutoBePreliminaryGetPreviousInterfaceOperations;
};
