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
