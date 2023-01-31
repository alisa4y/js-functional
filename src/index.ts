type Fn = (...args: any[]) => any
type LastT<T extends any[], R = any> = T extends [infer a, ...infer tRest]
  ? LastT<tRest, a>
  : R
type ComposedFns<T extends any[]> = T extends [
  infer t,
  infer next,
  ...infer tRest
]
  ? next extends Fn
    ? t extends (args: ReturnType<next>) => any
      ? [t, ...ComposedFns<[next, ...tRest]>]
      : never
    : never
  : T extends [infer t]
  ? [t]
  : never

export function compose<T extends Fn[]>(
  ...fns: [...T] extends ComposedFns<[...T]> ? [...T] : never
) {
  const lastFn = fns.pop() as Fn
  return (...args: Parameters<LastT<T>>) =>
    fns.reduceRight((acc, v: Fn) => v(acc), lastFn(...args)) as ReturnType<T[0]>
}
type Shift<T extends any[]> = Eq<T, []> extends true
  ? []
  : T extends [(infer t)?, ...infer tRest]
  ? tRest
  : []
type PipeFns<T extends any[]> = T extends [
  (...args: any[]) => infer t,
  (...args: infer p) => any,
  ...infer rest
]
  ? t extends p[0]
    ? Shift<p> extends []
      ? [T[0], ...PipeFns<Shift<T>>]
      : never
    : never
  : T

export function pipe<T extends Fn, U extends Fn[]>(
  fn1: T,
  ...fns: U extends Shift<PipeFns<[T, ...U]>> ? U : never
) {
  return (...args: Parameters<T>) =>
    fns.reduce((v, f: Fn) => f(v), fn1(...args)) as ReturnType<LastT<U>>
}

type Eq<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y
  ? 1
  : 2
  ? true
  : false

type IsSuperset<T1, T2> = T1 extends [infer t1, ...infer t1Rest]
  ? T2 extends [infer t2, ...infer t2Rest]
    ? Eq<t1, t2> extends true
      ? IsSuperset<t1Rest, t2Rest>
      : false
    : true
  : [T2] extends [never]
  ? false
  : T2 extends []
  ? true
  : false
type Expect<T extends true> = T
type testIsSuperset = [
  // @ts-expect-error
  Expect<IsSuperset<[], never>>,
  Expect<IsSuperset<[], []>>,
  Expect<IsSuperset<[string], []>>,
  Expect<IsSuperset<[number], []>>,
  Expect<IsSuperset<[number], never>>,
  Expect<IsSuperset<[number], [number]>>,
  Expect<IsSuperset<[number, string], [number]>>,
  // Expect<IsSuperset<[number, string], [string]>>,
  // @ts-expect-error
  Expect<IsSuperset<[number], [number, string]>>,
  // @ts-expect-error
  Expect<IsSuperset<[], [string]>>
]
type FindSuperset<T extends any[], S extends any = []> = T extends [
  infer a,
  infer b,
  ...infer rest
]
  ? IsSuperset<a, b> extends true
    ? FindSuperset<[a, ...rest], a>
    : IsSuperset<b, a> extends true
    ? FindSuperset<[b, ...rest], b>
    : never
  : S
type GetFnsParams<T extends any[], P extends any[] = []> = T extends [
  infer f,
  ...infer rest
]
  ? f extends Fn
    ? GetFnsParams<rest, [...P, Parameters<f>]>
    : never
  : P
type GetRetTypes<T extends any[], R extends any[] = []> = T extends [
  infer a,
  ...infer rest
]
  ? a extends Fn
    ? GetRetTypes<rest, [...R, ReturnType<a>]>
    : never
  : R
export function queue<T extends Fn[]>(...fns: T) {
  const lastFn = fns.pop() as Fn
  return (...args: any) => {
    fns.forEach(f => f(...args))
    return lastFn(...args) as ReturnType<LastT<T>>
  }
}
export function beat<T extends Fn[]>(...fns: [...T]) {
  return (...args: Parameters<T[0]>): boolean =>
    fns.some(fn => fn.apply(null, args))
}
type RemainingTuple<
  Provided extends any[],
  Params extends any[]
> = Provided extends [infer a, ...infer pRest]
  ? Params extends [(infer b)?, ...infer eRest]
    ? RemainingTuple<pRest, eRest>
    : never
  : Params

export function curry<T extends Fn, U extends any[]>(
  f: T,
  ...args: U extends Partial<Parameters<T>> ? U : never
) {
  return (...args2: RemainingTuple<U, Parameters<T>>): ReturnType<T> =>
    f(...args, ...args2)
}

type Is1stMatch<T extends any[], P extends any[]> = T extends [
  infer a,
  ...infer rest
]
  ? P extends [(infer b)?, ...infer pRest]
    ? Eq<a, b> extends true
      ? Is1stMatch<rest, pRest>
      : false
    : false
  : true

type IsPartialMatch<T extends any[], P extends any[]> = P extends []
  ? false
  : Is1stMatch<T, P> extends true
  ? true
  : IsPartialMatch<T, Shift<P>>

type IsAimArgs<T extends any[], P extends any[]> = IsPartialMatch<
  T,
  P
> extends true
  ? T
  : never

type UnPartial1st<T extends any[]> = T extends [(infer a)?, ...infer r]
  ? a
  : never

type AimArgs<
  T extends any[],
  P extends any[],
  Args extends any[] = [],
  Found = never
> = P extends []
  ? Found
  : Is1stMatch<T, P> extends true
  ? AimArgs<T, Shift<P>, [...Args, UnPartial1st<P>], Args>
  : AimArgs<T, Shift<P>, [...Args, UnPartial1st<P>], Found>

type t0 = [n: number, s?: string, ar?: any[]]
type t1 = [s?: string, ar?: any[]]
type t11 = [s: string, ar: any[]]
type t2 = [s?: string]
type t22 = [s: string]
type t3 = [] extends [(infer a)?, ...infer rest]
  ? Eq<rest, unknown[]> extends true
    ? "is unknown"
    : "nooo"
  : false
type t4 = Is1stMatch<t11, Shift<t0>>
type t5 = AimArgs<[ar: any[]], t0>
type t6 = Eq<[], unknown[]>

export function aim<T extends Fn, U extends any[]>(
  f: T,
  ...args2: U extends IsAimArgs<U, Parameters<T>> ? U : never
) {
  return (...args: [...AimArgs<U, Parameters<T>>]): ReturnType<T> =>
    f(...args, ...args2)
}

export function fork<T extends Fn[]>(
  ...fns: FindSuperset<GetFnsParams<T>> extends never ? never : [...T]
) {
  return (...args: FindSuperset<GetFnsParams<T>>) =>
    fns.map(f => f(...args)) as GetRetTypes<T>
}

export function guard<T extends Fn>(
  f: T,
  ...gFns: ((...args: Parameters<T>) => boolean)[]
) {
  return (...args: [...Parameters<T>]): ReturnType<T> | null =>
    (gFns.every(gfn => gfn(...args)) && f(...args)) || null
}
export function exploit<T extends Fn>(
  f: T,
  ...gFns: ((...args: Parameters<T>) => boolean)[]
) {
  return (...args: [...Parameters<T>]): ReturnType<T> | null =>
    (gFns.some(gfn => gfn(...args)) && f(...args)) || null
}

// ----------------  renaming for better coding ----------------

export const $C = compose
export const $L = pipe
export const $I = queue
export const $B = beat
export const $P = curry
export const $X = aim
export const $E = fork
export const $G = guard
export const $T = exploit
