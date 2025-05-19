import { AutoBeOpenApi } from "@autobe/interface";

import { IAutoBeApplicationResult } from "../../context/IAutoBeApplicationResult";

export interface IAutoBeInterfaceApplication {
  /**
   * Generate OpenAPI interface.
   *
   * @param props Properties for interface generation
   * @returns Generation result
   */
  interface(
    props: IAutoBeInterfaceApplication.IProps,
  ): Promise<IAutoBeApplicationResult>;
}
export namespace IAutoBeInterfaceApplication {
  export interface IProps {
    /**
     * Document to be generated.
     */
    document: AutoBeOpenApi.IDocument;
  }
}
