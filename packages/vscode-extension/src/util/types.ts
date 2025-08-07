export type UnionToIntersection<U> = (
  U extends any ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;

export type LastOf<T> =
  UnionToIntersection<T extends any ? () => T : never> extends () => infer R
    ? R
    : never;

export type Push<T extends any[], V> = [...T, V];

export type TuplifyUnion<
  T,
  L = LastOf<T>,
  N = [T] extends [never] ? true : false,
> = true extends N ? [] : Push<TuplifyUnion<Exclude<T, L>>, L>;

export type Tuple<
  T,
  A extends T[] = [],
> = TuplifyUnion<T>["length"] extends A["length"]
  ? [...A]
  : Tuple<T, [T, ...A]>;

export type AllUnionMembersIncluded<
  T extends string,
  A extends readonly string[],
> = Exclude<T, A[number]> extends never ? true : false;

export type IsTrue<T extends true> = T;
