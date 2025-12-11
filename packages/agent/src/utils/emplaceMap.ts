/**
 * Gets existing value from Map or lazily creates it if missing.
 *
 * Implements the lazy initialization pattern: returns existing value if key
 * exists, otherwise calls generator function to create new value, stores it,
 * and returns it. Ensures generator is only called when necessary, avoiding
 * wasteful computation.
 *
 * Used throughout AutoBE for caching event listeners, validation state, and
 * other expensive-to-create objects that should be initialized on first
 * access.
 *
 * @param dict Map to query and potentially update
 * @param key Key to look up or create
 * @param generator Function to create value if key doesn't exist
 * @returns Existing or newly created value
 */
export function emplaceMap<Key, T>(
  dict: Map<Key, T>,
  key: Key,
  generator: () => T,
): T {
  const oldbie: T | undefined = dict.get(key);
  if (oldbie !== undefined) {
    return oldbie;
  }

  const value: T = generator();
  dict.set(key, value);
  return value;
}
