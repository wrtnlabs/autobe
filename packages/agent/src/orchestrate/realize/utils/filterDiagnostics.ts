import { IAutoBeRealizeFunctionFailure } from "../structures/IAutoBeRealizeFunctionFailure";

/**
 * Filter diagnostic failures to only include those matching the given
 * locations.
 *
 * @param failures - Array of function failures with diagnostic information
 * @param locations - Array of file locations to filter by
 * @returns Filtered array of failures matching the specified locations
 * @warning This function assumes f.function and f.function.location are always defined.
 *          If f.function is undefined, this will throw a runtime error.
 *          Consider using optional chaining: f.function?.location
 */
export function filterDiagnostics(
  failures: IAutoBeRealizeFunctionFailure[],
  locations: string[],
): IAutoBeRealizeFunctionFailure[] {
  return failures
    .filter((f) => f.function.location.startsWith("src/providers"))
    .filter((f) => locations.includes(f.function.location));
}
