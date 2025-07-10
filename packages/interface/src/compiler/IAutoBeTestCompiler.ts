import { IValidation } from "typia";

import { IAutoBeTestValidateProps } from "./IAutoBeTestValidateProps";
import { IAutoBeTestWriteProps } from "./IAutoBeTestWriteProps";
import { IAutoBeTypeScriptCompileProps } from "./IAutoBeTypeScriptCompileProps";
import { IAutoBeTypeScriptCompileResult } from "./IAutoBeTypeScriptCompileResult";

export interface IAutoBeTestCompiler {
  compile(
    props: IAutoBeTypeScriptCompileProps,
  ): Promise<IAutoBeTypeScriptCompileResult>;
  validate(
    props: IAutoBeTestValidateProps,
  ): Promise<IValidation.IError[] | null>;
  write(props: IAutoBeTestWriteProps): Promise<string>;
  getExternal(): Promise<Record<string, string>>;
}
