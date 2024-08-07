// --------------------  constants  --------------------
const paramRgx = /\(([^)]*)\)/

// --------------------  functional tools  --------------------
export function compose<T extends Fn[]>(
  ...fns: [...T] extends ComposedFns<[...T]> ? [...T] : never
) {
  const lastFn = fns.pop() as Fn
  return (...args: Parameters<LastT<T>>) =>
    fns.reduceRight((acc, v: Fn) => v(acc), lastFn(...args)) as ReturnType<T[0]>
}
export function pipe<T extends Fn, U extends Fn[]>(
  fn1: T,
  ...fns: U extends Shift<PipeFns<[T, ...U]>> ? U : never
) {
  return (...args: Parameters<T>) =>
    fns.reduce((v, f: Fn) => f(v), fn1(...args)) as ReturnType<LastT<U>>
}
export function queue<T extends Fn[]>(...fns: T) {
  const lastFn = fns.pop() as Fn
  return (...args: any) => {
    fns.forEach(f => f(...args))
    return lastFn(...args) as ReturnType<LastT<T>>
  }
}
export function curry<T extends Fn, U extends any[]>(
  f: T,
  ...args: U extends Partial<Parameters<T>> ? U : never
) {
  return (...args2: RemainingTuple<U, Parameters<T>>): ReturnType<T> =>
    f(...args, ...args2)
}
export function aim<T extends Fn, U extends any[]>(
  f: T,
  ...args2: U extends IsAimArgs<U, Parameters<T>> ? U : never
) {
  const ar: any[] = []
  const fLength = getAllParameters(f).length
  const startArgPosition = fLength - args2.length

  if (startArgPosition < 1) throw new Error(`too much arguments passed to aim`)

  for (let i = startArgPosition; i < fLength; i++)
    ar[i] = args2[i - startArgPosition]

  return (...args: [...AimArgs<U, Parameters<T>>]): ReturnType<T> => {
    for (let i = 0; i < startArgPosition; i++) ar[i] = args[i]

    return f(...ar)
  }
}
export function some<T extends ConditionFn[]>(...fns: HasSuperParams<T>) {
  return (...args: FindSuperParams<T>): boolean =>
    fns.some(fn => fn.apply(null, args))
}
export function every<T extends ConditionFn[]>(...fns: HasSuperParams<T>) {
  return (...args: FindSuperParams<T>): boolean =>
    fns.every(fn => fn.apply(null, args))
}
export function map<T extends Fn[]>(...fns: HasSuperParams<T>) {
  return (...args: FindSuperParams<T>) =>
    fns.map(f => f(...args)) as GetRetTypes<T>
}
export function flatMap<T extends Fn[]>(...fns: HasSuperParams<T>) {
  return (...args: FindSuperParams<T>) =>
    fns.flatMap(f => f(...args)) as any as FlatRetTypes<GetRetTypes<T>>
}
export function guard<T extends Fn, U extends (arg: GuardType<T>) => any>(
  f: U,
  gfn: T
) {
  return (arg: Parameters<T>[0]): ReturnType<U> | null =>
    (gfn(arg) && f(arg)) || null
}
export function ifSome<T extends Fn, U extends ConditionFn[]>(
  mainFn: T,
  ...checks: U extends Rest<HasSuperParams<[T, ...U]>> ? U : never
) {
  const conditionFn: Fn = some(...checks)
  return (...args: FindSuperParams<[T, ...U]>): ReturnType<T> | null =>
    (conditionFn(...args) && mainFn(...args)) || null
}
export function ifEvery<T extends Fn, U extends ConditionFn[]>(
  mainFn: T,
  ...checks: U extends Rest<HasSuperParams<[T, ...U]>> ? U : never
) {
  const condition: Fn = every(...checks)
  return (...args: FindSuperParams<[T, ...U]>): ReturnType<T> | null =>
    (condition(...args) && mainFn(...args)) || null
}

// --------------------  tools  --------------------
function getAllParameters(func: Fn) {
  const funcStr = func.toString()
  const paramsStr = funcStr.match(paramRgx)![1]

  // Split the parameters string to get individual parameters
  const params = paramsStr.split(",").map(param => param.trim())

  return params
}

// ----------------  types ----------------
type Fn = (...args: any[]) => any
type ConditionFn = (...args: any[]) => boolean

type FlatRetTypes<T extends any[], R extends any[] = []> = T extends [
  infer t,
  ...infer rest
]
  ? FlatRetTypes<rest, (R[number] | GetArrayType<t>)[]>
  : R

type GetArrayType<T> = T extends { [key: number]: infer t } ? t : never

type Rest<T> = T extends [any, ...infer rest] ? rest : never

type LastT<T extends any[], R = any> = T extends [infer a, ...infer tRest]
  ? LastT<tRest, a>
  : R

// type ComposedFns<T extends any[]> = T extends [
//   infer t,
//   infer next,
//   ...infer tRest
// ]
//   ? next extends Fn
//     ? t extends (args: ReturnType<next>) => any
//       ? [t, ...ComposedFns<[next, ...tRest]>]
//       : never
//     : never
//   : T extends [infer t]
//   ? [t]
//   : never
type ComposedFns<T extends any[]> = T extends [
  (...args: infer p) => any,
  (...args: any[]) => infer t,
  ...infer rest
]
  ? t extends p[0]
    ? Shift<p> extends []
      ? [T[0], ...ComposedFns<Shift<T>>]
      : never
    : never
  : T
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

type Eq<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y
  ? 1
  : 2
  ? true
  : false

type Expect<T extends true> = T

// type testIsSuperset = [
//   // @ts-expect-error
//   Expect<IsSuperset<[], never>>,
//   Expect<IsSuperset<[], []>>,
//   Expect<IsSuperset<[string], []>>,
//   Expect<IsSuperset<[number], []>>,
//   Expect<IsSuperset<[number], never>>,
//   Expect<IsSuperset<[number], [number]>>,
//   Expect<IsSuperset<[number, string], [number]>>,
//   // Expect<IsSuperset<[number, string], [string]>>,
//   // @ts-expect-error
//   Expect<IsSuperset<[number], [number, string]>>,
//   // @ts-expect-error
//   Expect<IsSuperset<[], [string]>>
// ]
type HasSParamsAndRets<T extends Fn[]> = FindSuperParams<T> extends never
  ? never
  : IsSameRets<T> extends never
  ? never
  : [...T]
type HasSuperParams<T extends Fn[]> = FindSuperParams<T> extends never
  ? never
  : [...T]

type IsSameRets<T extends Fn[]> = IsSameTypes<GetRetTypes<T>>

type FindSuperParams<T extends Fn[]> = FindSuperset<GetFnsParams<T>>
type IsSameTypes<T extends any[]> = T extends [infer a, infer b, ...infer rest]
  ? Eq<a, b> extends true
    ? IsSameTypes<[b, ...rest]>
    : never
  : [...T]

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

type RemainingTuple<
  Provided extends any[],
  Params extends any[]
> = Provided extends [infer a, ...infer pRest]
  ? Params extends [(infer b)?, ...infer eRest]
    ? RemainingTuple<pRest, eRest>
    : never
  : Params

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

type GuardType<TFunc> = TFunc extends (arg: any) => arg is infer R ? R : never
