import { AutoBePreliminaryKind } from "@autobe/interface";

import { IAutoBePreliminaryGetAnalysisFiles } from "./IAutoBePreliminaryGetAnalysisFiles";
import { IAutoBePreliminaryGetInterfaceOperations } from "./IAutoBePreliminaryGetInterfaceOperations";
import { IAutoBePreliminaryGetInterfaceSchemas } from "./IAutoBePreliminaryGetInterfaceSchemas";
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
};
