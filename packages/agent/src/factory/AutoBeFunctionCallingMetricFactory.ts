import { AutoBeFunctionCallingMetric } from "@autobe/interface";

export namespace AutoBeFunctionCallingMetricFactory {
  export const create = (): AutoBeFunctionCallingMetric => ({
    attempt: 0,
    success: 0,
    consent: 0,
    validationFailure: 0,
    invalidJson: 0,
  });

  export const increment = (
    x: AutoBeFunctionCallingMetric,
    y: AutoBeFunctionCallingMetric,
  ): void => {
    x.attempt += y.attempt;
    x.success += y.success;
    x.consent += y.consent;
    x.validationFailure += y.validationFailure;
    x.invalidJson += y.invalidJson;
  };

  export const plus = (
    x: AutoBeFunctionCallingMetric,
    y: AutoBeFunctionCallingMetric,
  ): AutoBeFunctionCallingMetric => ({
    attempt: x.attempt + y.attempt,
    success: x.success + y.success,
    consent: x.consent + y.consent,
    validationFailure: x.validationFailure + y.validationFailure,
    invalidJson: x.invalidJson + y.invalidJson,
  });

  export const minus = (
    x: AutoBeFunctionCallingMetric,
    y: AutoBeFunctionCallingMetric,
  ): AutoBeFunctionCallingMetric => ({
    attempt: x.attempt - y.attempt,
    success: x.success - y.success,
    consent: x.consent - y.consent,
    validationFailure: x.validationFailure - y.validationFailure,
    invalidJson: x.invalidJson - y.invalidJson,
  });
}
