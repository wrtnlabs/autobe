import { IPage } from "./IPage";

export interface IAutoBePlaygroundReplay {
  vendor: string;
  project: string;
  step: "analyze" | "prisma" | "interface" | "test" | "realize";
}
export namespace IAutoBePlaygroundReplay {
  export interface IRequest extends IPage.IRequest {
    search?: IRequest.ISearch;
    sort?: IPage.Sort<IRequest.SortableColumns>;
  }
  export namespace IRequest {
    export interface ISearch {
      vendor?: string;
      project?: string;
    }
    export type SortableColumns = "vendor" | "project";
  }
}
