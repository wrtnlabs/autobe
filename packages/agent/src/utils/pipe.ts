import { FAILED } from "../orchestrate/realize/structures/IAutoBeRealizeFailedSymbol";

export function pipe<A, B>(
  a: A,
  ab: (a: A) => Promise<B | FAILED>,
): Promise<B | FAILED>;

export function pipe<A, B, C>(
  a: A,
  ab: (a: A) => Promise<B | FAILED>,
  bc: (b: B) => Promise<C | FAILED>,
): Promise<C | FAILED>;

export function pipe<A, B, C, D>(
  a: A,
  ab: (a: A) => Promise<B | FAILED>,
  bc: (b: B) => Promise<C | FAILED>,
  cd: (c: C) => Promise<D | FAILED>,
): Promise<D | FAILED>;

export function pipe<A, B, C, D, E>(
  a: A,
  ab: (a: A) => Promise<B | FAILED>,
  bc: (b: B) => Promise<C | FAILED>,
  cd: (c: C) => Promise<D | FAILED>,
  de: (d: D) => Promise<E | FAILED>,
): Promise<E | FAILED>;

export function pipe(
  a: any,
  ...fns: Array<(arg: any) => Promise<any>>
): Promise<any> {
  return fns.reduce((prev, fn) => {
    return prev.then((result) => {
      if (result === FAILED) return FAILED;
      return fn(result);
    });
  }, Promise.resolve(a));
}
