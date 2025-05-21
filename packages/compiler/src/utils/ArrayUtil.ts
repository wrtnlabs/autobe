export namespace ArrayUtil {
  export async function asyncMap<T, U>(
    array: T[],
    callback: (value: T, index: number, array: T[]) => Promise<U>,
  ): Promise<U[]> {
    const result: U[] = new Array(array.length);
    for (let i = 0; i < array.length; i++)
      result[i] = await callback(array[i], i, array);
    return result;
  }
}
