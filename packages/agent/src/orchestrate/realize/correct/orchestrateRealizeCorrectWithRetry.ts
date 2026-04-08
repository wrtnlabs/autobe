import { AutoBeRealizeFunction } from "@autobe/interface";

import { AutoBeConfigConstant } from "../../../constants/AutoBeConfigConstant";
import { IAutoBeRealizeFunctionResult } from "../structures/IAutoBeRealizeFunctionResult";

export async function orchestrateRealizeCorrectWithRetry<
  Func extends AutoBeRealizeFunction,
>(props: {
  write: () => Promise<Func[]>;
  rewrite: (failed: Func[]) => Promise<Func[]>;
  correctCasting: (functions: Func[]) => Promise<Func[]>;
  correctOverall: (
    functions: Func[],
  ) => Promise<IAutoBeRealizeFunctionResult<Func>[]>;
  addProgress: (count: number) => void;
}): Promise<Func[]> {
  const process = async (
    functions: Func[],
  ): Promise<IAutoBeRealizeFunctionResult<Func>[]> => {
    props.addProgress(functions.length);

    const casted: Func[] = await props.correctCasting(functions);
    return await props.correctOverall(casted);
  };

  const partition = (
    results: IAutoBeRealizeFunctionResult<Func>[],
  ): IPartition<Func> => ({
    success: results.filter((r) => r.success).map((r) => r.function),
    failures: results.filter((r) => !r.success).map((r) => r.function),
  });

  // first attempt
  const initial: IPartition<Func> = partition(
    await process(await props.write()),
  );
  const success: Func[] = initial.success;
  let failures: Func[] = initial.failures;

  // retry loop
  const limit: number = Math.max(
    Math.floor(AutoBeConfigConstant.COMPILER_RETRY / 2),
    1,
  );
  for (let i: number = 0; failures.length !== 0 && i < limit; i++) {
    const retry: IPartition<Func> = partition(
      await process(await props.rewrite(failures)),
    );
    success.push(...retry.success);
    failures = retry.failures;
  }

  // remaining failures are included as-is
  return [...success, ...failures];
}

interface IPartition<Func extends AutoBeRealizeFunction> {
  success: Func[];
  failures: Func[];
}
