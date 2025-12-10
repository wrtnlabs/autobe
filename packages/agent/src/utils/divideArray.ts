/**
 * Divides array into evenly-sized chunks for parallel batch processing.
 *
 * Used with `executeCachedBatch` to split large task lists into smaller batches
 * that can be processed concurrently. The capacity parameter controls how many
 * chunks to create, not the chunk size - this enables balancing parallelism
 * against prompt cache efficiency.
 *
 * For example, dividing 100 operations with capacity=3 creates 3 chunks of 34,
 * 33, 33 operations each. This allows processing 100 operations in 3 parallel
 * batches instead of sequentially.
 *
 * @param props Array to divide and target number of chunks
 * @returns Array of chunks with evenly distributed elements
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
