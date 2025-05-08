import { IAutoBePrismaProps } from "./IAutoBePrismaProps";
import { IAutoBePrismaResult } from "./IAutoBePrismaResult";

export interface IAutoBePrisma {
  build(props: IAutoBePrismaProps): Promise<IAutoBePrismaResult>;
}
