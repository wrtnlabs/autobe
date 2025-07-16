import {
  IAutoBeRealizeCompiler,
  IAutoBeRealizeCompilerListener,
  IAutoBeRealizeTestProps,
  IAutoBeRealizeTestResult,
} from "@autobe/interface";

import { AutoBeCompilerInterfaceTemplate } from "../raw/AutoBeCompilerInterfaceTemplate";
import { AutoBeCompilerRealizeTemplate } from "../raw/AutoBeCompilerRealizeTemplate";
import { AutoBeCompilerTestTemplate } from "../raw/AutoBeCompilerTestTemplate";
import { testRealizeProject } from "./testRealizeProject";

export class AutoBeRealizeCompiler implements IAutoBeRealizeCompiler {
  public constructor(
    private readonly listener: IAutoBeRealizeCompilerListener,
  ) {}

  public test(
    props: IAutoBeRealizeTestProps,
  ): Promise<IAutoBeRealizeTestResult> {
    return testRealizeProject(
      {
        ...props,
        files: {
          ...props.files,
          ...AutoBeCompilerRealizeTemplate,
        },
      },
      this.listener.test,
    );
  }

  public async getTemplate(): Promise<Record<string, string>> {
    return {
      ...AutoBeCompilerInterfaceTemplate,
      ...AutoBeCompilerTestTemplate,
      ...AutoBeCompilerRealizeTemplate,
    };
  }
}
