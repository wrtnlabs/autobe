/**
 * Converts an array of key-value pairs (entries) into a Record.
 *
 * @param entries - Array of [key, value] tuples
 * @returns Record object from the entries
 */
export function arrayToRecord<V>(
  entries: Array<[string, V]>,
): Record<string, V>;

/**
 * Converts an array of objects into a Record using specified key and value
 * properties.
 *
 * @param items - Array of items to convert
 * @param keyProp - Property name to use as the key
 * @param valueProp - Property name to use as the value
 * @returns Record object with the extracted key-value pairs
 */
export function arrayToRecord<T, K extends keyof T, V extends keyof T>(
  items: T[],
  keyProp: K,
  valueProp: V,
): Record<string, T[V]>;

export function arrayToRecord<T, K extends keyof T, V extends keyof T>(
  items: T[] | Array<[string, any]>,
  keyProp?: K,
  valueProp?: V,
): Record<string, any> {
  // Handle entries format [string, value][]
  if (items.length > 0 && Array.isArray(items[0]) && items[0].length === 2) {
    return (items as Array<[string, any]>).reduce(
      (acc, [key, value]) => Object.assign(acc, { [key]: value }),
      {},
    );
  }

  // Handle object array format with key and value properties
  if (keyProp !== undefined && valueProp !== undefined) {
    return (items as T[])
      .map((item) => ({
        [String(item[keyProp])]: item[valueProp],
      }))
      .reduce((acc, cur) => Object.assign(acc, cur), {});
  }

  throw new Error("Invalid arguments for arrayToRecord");
}
