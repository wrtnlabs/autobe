import { AutoBeRealizeFunction } from "@autobe/interface";

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

  //----
  // FIRST ATTEMPT
  //----
  // write functions
  const results: IAutoBeRealizeFunctionResult<Func>[] = await process(
    await props.write(),
  );

  // filter success and failures
  const filter = (v: boolean) =>
    results.filter((r) => r.success === v).map((r) => r.function);
  const success: Func[] = filter(true);
  const failures: Func[] = filter(false);

  // no failures, return success
  if (failures.length === 0) return success;

  //----
  // RETRY
  //----
  const retryResults: IAutoBeRealizeFunctionResult<Func>[] = await process(
    await props.rewrite(failures),
  );
  return [...success, ...retryResults.map((r) => r.function)];
}
