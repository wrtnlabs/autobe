// import {
//   AutoBeProgressEventBase,
//   AutoBeTestValidateEvent,
// } from "@autobe/interface";
// import { ILlmController, ILlmSchema } from "@samchon/openapi";
// import { IPointer } from "tstl";
// import { v7 } from "uuid";

// import { AutoBeContext } from "../../../context/AutoBeContext";
// import { IAutoBeOrchestrateHistory } from "../../../structures/IAutoBeOrchestrateHistory";
// import { executeCachedBatch } from "../../../utils/executeCachedBatch";
// import { IAutoBeTestAuthorizeProcedure } from "../structures/IAutoBeTestAuthorizeWriteResult";
// import { IAutoBeTestCorrectRequestApplication } from "../structures/IAutoBeTestCorrectRequestApplication";
// import { IAutoBeTestFunctionFailure } from "../structures/IAutoBeTestFunctionFailure";
// import { IAutoBeTestGenerateProcedure } from "../structures/IAutoBeTestGenerateProcedure";
// import { IAutoBeTestOperationProcedure } from "../structures/IAutoBeTestOperationProcedure";

// interface IProgrammer<
//   Model extends ILlmSchema.Model,
//   Procedure extends
//     | IAutoBeTestAuthorizeProcedure
//     | IAutoBeTestGenerateProcedure
//     | IAutoBeTestOperationProcedure,
// > {
//   controller(next: {
//     model: Model;
//     procedure: Procedure;
//     build: (next: IAutoBeTestCorrectRequestApplication.IProps | false) => void;
//   }): ILlmController<Model, IAutoBeTestCorrectRequestApplication>;
//   histories(props: {
//     procedure: Procedure;
//     failures: IAutoBeTestFunctionFailure<Procedure>[];
//   }): Promise<IAutoBeOrchestrateHistory>;
//   replaceImportStatements(procedure: Procedure): Promise<string>;
//   compile(
//     procedure: Procedure,
//   ): Promise<AutoBeTestValidateEvent<Procedure["function"]>>;
// }

// export async function orchestrateTestCorrectRequest<
//   Model extends ILlmSchema.Model,
//   Procedure extends
//     | IAutoBeTestAuthorizeProcedure
//     | IAutoBeTestGenerateProcedure
//     | IAutoBeTestOperationProcedure,
// >(
//   ctx: AutoBeContext<Model>,
//   props: {
//     programmer: IProgrammer<Model, Procedure>;
//     instruction: string;
//     procedures: Procedure[];
//     progress: AutoBeProgressEventBase;
//   },
// ): Promise<Procedure[]> {
//   const results: Array<Procedure | null> = await executeCachedBatch(
//     ctx,
//     props.procedures.map((procedure) => async (promptCacheKey) => {
//       try {
//         const event: AutoBeTestValidateEvent<Procedure["function"]> =
//           await predicate(
//             ctx,
//             {
//               programmer: props.programmer,
//               procedure,
//               failures: [],
//               validate: await props.programmer.compile(procedure),
//               promptCacheKey,
//               instruction: props.instruction,
//             },
//             ctx.retry,
//           );
//         return {
//           ...procedure,
//           function: event.function,
//         };
//       } catch {
//         return null;
//       }
//     }),
//   );
//   return results.filter((r) => r !== null);
// }

// async function predicate<
//   Model extends ILlmSchema.Model,
//   Procedure extends
//     | IAutoBeTestAuthorizeProcedure
//     | IAutoBeTestGenerateProcedure
//     | IAutoBeTestOperationProcedure,
// >(
//   ctx: AutoBeContext<Model>,
//   props: {
//     programmer: IProgrammer<Model, Procedure>;
//     procedure: Procedure;
//     failures: IAutoBeTestFunctionFailure<Procedure>[];
//     validate: AutoBeTestValidateEvent<Procedure["function"]>;
//     promptCacheKey: string;
//     instruction: string;
//   },
//   life: number,
// ): Promise<AutoBeTestValidateEvent<Procedure["function"]>> {
//   if (props.validate.result.type === "failure") {
//     ctx.dispatch(props.validate);
//     return await correct(ctx, props, life - 1);
//   }
//   return props.validate;
// }

// async function correct<
//   Model extends ILlmSchema.Model,
//   Procedure extends
//     | IAutoBeTestAuthorizeProcedure
//     | IAutoBeTestGenerateProcedure
//     | IAutoBeTestOperationProcedure,
// >(
//   ctx: AutoBeContext<Model>,
//   props: {
//     programmer: IProgrammer<Model, Procedure>;
//     procedure: Procedure;
//     failures: IAutoBeTestFunctionFailure<Procedure>[];
//     validate: AutoBeTestValidateEvent<Procedure["function"]>;
//     promptCacheKey: string;
//     instruction: string;
//   },
//   life: number,
// ): Promise<AutoBeTestValidateEvent<Procedure["function"]>> {
//   if (props.validate.result.type !== "failure") return props.validate;
//   else if (life < 0) return props.validate;

//   const pointer: IPointer<
//     IAutoBeTestCorrectRequestApplication.IProps | false | null
//   > = {
//     value: null,
//   };
//   const { metric, tokenUsage } = await ctx.conversate({
//     source: "testCorrect",
//     controller: props.programmer.controller({
//       model: ctx.model,
//       procedure: props.procedure,
//       build: (next) => {
//         pointer.value = next;
//       },
//     }),
//     enforceFunctionCall: true,
//     promptCacheKey: props.promptCacheKey,
//     ...(await props.programmer.histories({
//       procedure: props.procedure,
//       failures: [
//         ...props.failures,
//         {
//           procedure: props.procedure,
//           failure: props.validate.result,
//         },
//       ],
//     })),
//   });
//   if (pointer.value === null) throw new Error("Failed to correct test code.");
//   else if (pointer.value === false) return props.validate; // other's responsibility

//   const newProcedure: Procedure = {
//     ...props.procedure,
//     function: {
//       ...props.procedure.function,
//       content: await props.programmer.replaceImportStatements({
//         ...props.procedure,
//         function: {
//           ...props.procedure.function,
//           content: pointer.value.revise.final ?? pointer.value.draft,
//         },
//       }),
//     },
//   };
//   const newValidate: AutoBeTestValidateEvent<Procedure["function"]> =
//     await props.programmer.compile(newProcedure);

//   ctx.dispatch({
//     type: "testCorrect",
//     kind: "request",
//     id: v7(),
//     created_at: new Date().toISOString(),
//     function: newProcedure.function,
//     result: props.validate.result,
//     metric,
//     tokenUsage,
//     step: ctx.state().analyze?.step ?? 0,
//   });

//   return await predicate(
//     ctx,
//     {
//       programmer: props.programmer,
//       procedure: newProcedure,
//       failures: [
//         ...props.failures,
//         {
//           procedure: props.procedure,
//           failure: props.validate.result,
//         },
//       ],
//       validate: newValidate,
//       promptCacheKey: props.promptCacheKey,
//       instruction: props.instruction,
//     },
//     life,
//   );
// }
