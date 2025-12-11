/**
 * Divides an array into chunks of at most `capacity` elements each for parallel batch processing.
 *
 * Used with `executeCachedBatch` to split large task lists into smaller batches
 * that can be processed concurrently. The `capacity` parameter controls the maximum
 * number of elements per chunk, not the number of chunks. This enables balancing parallelism
 * against prompt cache efficiency.
 *
 * For example, dividing 100 operations with capacity=3 creates 34 chunks of 3 operations each
 * (the last chunk may have fewer elements if the array length is not a multiple of capacity).
 * This allows processing 100 operations in 34 parallel batches of up to 3 operations each.
 *
 * @param props Object containing the array to divide and the maximum chunk size (`capacity`)
 * @returns Array of chunks with at most `capacity` elements each
 * @throws Error if capacity is non-positive, NaN, or Infinity
 */
export function divideArray<T>(props: { array: T[]; capacity: number }): T[][] {
  if (props.capacity <= 0) {
    throw new Error("Capacity must be a positive integer");
  }
  if (Number.isNaN(props.capacity)) {
    throw new TypeError("Capacity must be a positive integer");
  }
  if (props.capacity === Infinity) {
    throw new Error("Capacity must be a positive integer");
  }

  const size: number = Math.ceil(props.array.length / props.capacity);
  const capacity: number = Math.ceil(props.array.length / size);
  const replica: T[] = props.array.slice();
  return Array.from({ length: size }, () => replica.splice(0, capacity));
}
