// import { IAgenticaController } from "@agentica/core";
// import { ILlmApplication, ILlmSchema, IValidation } from "@samchon/openapi";
// import typia from "typia";

// import { AutoBeContext } from "../context/AutoBeContext";
// import { assertSchemaModel } from "../context/assertSchemaModel";
// import { IAutoBeDescribeImagesCompletionApplication } from "./image/structures/IAutoBeDescribeImagesCompletionApplication";

// export const orchestrateDescribeImagesCompletion = async <
//   Model extends ILlmSchema.Model,
// >(
//   ctx: AutoBeContext<Model>,
// ): Promise<AutoBeDescribeImageCompletionEvent> => {};

// function createController<Model extends ILlmSchema.Model>(props: {
//   model: Model;
//   build: (next: IAutoBeDescribeImagesCompletionApplication.IProps) => void;
// }): IAgenticaController.IClass<Model> {
//   assertSchemaModel(props.model);

//   const validate: Validator = (next: unknown) => {
//     const result: IValidation<IAutoBeDescribeImagesCompletionApplication.IProps> =
//       typia.validate<IAutoBeDescribeImagesCompletionApplication.IProps>(next);
//     if (result.success === false) return result;
//     return result;
//   };

//   const application: ILlmApplication<Model> = collection[
//     props.model === "chatgpt"
//       ? "chatgpt"
//       : props.model === "gemini"
//         ? "gemini"
//         : "claude"
//   ](
//     validate,
//   ) satisfies ILlmApplication<any> as unknown as ILlmApplication<Model>;
//   return {
//     protocol: "class",
//     name: "image",
//     application,
//     execute: {
//       complete: (next) => {
//         props.build(next);
//       },
//     } satisfies IAutoBeDescribeImagesCompletionApplication,
//   };
// }

// const collection = {
//   chatgpt: (validate: Validator) =>
//     typia.llm.application<
//       IAutoBeDescribeImagesCompletionApplication,
//       "chatgpt"
//     >({
//       validate: {
//         complete: validate,
//       },
//     }),
//   claude: (validate: Validator) =>
//     typia.llm.application<IAutoBeDescribeImagesCompletionApplication, "claude">(
//       {
//         validate: {
//           complete: validate,
//         },
//       },
//     ),
//   gemini: (validate: Validator) =>
//     typia.llm.application<IAutoBeDescribeImagesCompletionApplication, "gemini">(
//       {
//         validate: {
//           complete: validate,
//         },
//       },
//     ),
// };

// type Validator = (
//   input: unknown,
// ) => IValidation<IAutoBeDescribeImagesCompletionApplication.IProps>;
