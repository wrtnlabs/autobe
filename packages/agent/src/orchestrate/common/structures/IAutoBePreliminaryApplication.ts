import { AutoBeOpenApi } from "@autobe/interface";

export interface IAutoBePreliminaryApplication {
  getRequirementAnalyses(
    props: IAutoBePreliminaryApplication.IRequiementAnalysesProps,
  ): void;

  gerPrismaSchemas(
    props: IAutoBePreliminaryApplication.IPrismaSchemasProps,
  ): void;

  getInterfaceOperations(
    props: IAutoBePreliminaryApplication.IInterfaceOperationsProps,
  ): void;

  getInterfaceSchemas(
    props: IAutoBePreliminaryApplication.IInterfaceSchemasProps,
  ): void;
}
export namespace IAutoBePreliminaryApplication {
  export interface IRequiementAnalysesProps {
    filenames: string[];
  }

  export interface IPrismaSchemasProps {
    schemas: string[];
  }

  export interface IInterfaceOperationsProps {
    endpoints: AutoBeOpenApi.IEndpoint[];
  }

  export interface IInterfaceSchemasProps {
    typeNames: string[];
  }
}
