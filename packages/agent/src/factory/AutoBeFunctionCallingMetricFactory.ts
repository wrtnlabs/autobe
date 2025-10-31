import { AutoBeFunctionCallingMetric } from "@autobe/interface";

export namespace AutoBeFunctionCallingMetricFactory {
  export const create = (): AutoBeFunctionCallingMetric => ({
    total: 0,
    success: 0,
    consent: 0,
    validationFailure: 0,
    invalidJson: 0,
  });

  export const increment = (
    x: AutoBeFunctionCallingMetric,
    y: AutoBeFunctionCallingMetric,
  ): void => {
    x.total += y.total;
    x.success += y.success;
    x.consent += y.consent;
    x.validationFailure += y.validationFailure;
    x.invalidJson += y.invalidJson;
  };
}
