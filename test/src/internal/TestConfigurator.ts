import { ArgumentParser } from "./ArgumentParser";

export namespace TestConfigurator {
  export const getVendorModel = async (): Promise<string> => {
    interface IVendorModel {
      vendorModel: string;
    }
    const result: IVendorModel = await ArgumentParser.parse<IVendorModel>(
      async (command, prompt, action) => {
        command.option("--vendor <model>", "Vendor model to use");
        return action(async (options) => {
          command.option("--vendor <model>", "Vendor model to use");
          options.vendorModel ??= await prompt.select("model")(
            "Select vendor model",
          )([
            "openai/gpt-4.1",
            "openai/gpt-4.1-mini",
            "qwen/qwen3-235b-a22b-2507",
            "qwen/qwen3-next-80b-a3b-instruct",
          ]);
          return options as IVendorModel;
        });
      },
    );
    return result.vendorModel;
  };
}
