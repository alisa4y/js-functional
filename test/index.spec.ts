import {
  compose,
  pipe,
  queue,
  some,
  curry,
  aim,
  map,
  guard,
  ifSome,
  ifEvery,
} from "../src"

type Eq<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y
  ? 1
  : 2
  ? true
  : false
type Expect<T extends true> = T

const add: (x: number, y: number) => number = (x, y) => x + y
const x2 = (x: number): number => x * 2
const toStr = (x: any): string => x.toString()
const subtract = (x: number, y: number) => x - y
const numToStr = (n: number) => n.toString()

describe("compose", () => {
  it("composes 2 functions", () => {
    const addX2 = compose(x2, add)
    expect(addX2(2, 3)).toEqual(10)
    type retType = [Expect<Eq<ReturnType<typeof addX2>, number>>]
  })
  it("will trigger error on typescript if functions aren't chainable", () => {
    // @ts-expect-error
    const strX2 = compose(add, toStr)
    // @ts-expect-error
    const x2Add = compose(add, x2)
  })
})
describe("pipe", () => {
  it("it pipe 2 functions", () => {
    const addX2 = pipe(add, x2)
    const addToS = pipe(add, x2, numToStr)
    expect(addX2(2, 3)).toEqual(10)
    type types = [
      Expect<Eq<typeof addX2, (...args: Parameters<typeof add>) => number>>,
      Expect<Eq<typeof addToS, (...args: Parameters<typeof add>) => string>>
    ]
  })
  it("will trigger error on typescript if functions aren't chainable", () => {
    // @ts-expect-error
    const strX2 = pipe(toStr, add)
    // @ts-expect-error
    const x2Add = pipe(x2, add)
  })
})
describe("queue", () => {
  it("takes multiple functions then returns a function that takes arguments and execute them against the passed parameters", () => {
    let outX = 0,
      outY = 0
    const setX = () => (outX = 1)
    const setY = () => (outY = 2)
    const setZ = () => 3
    const exFns = queue(setX, setY, setZ)
    type cases = [Expect<Eq<ReturnType<typeof exFns>, number>>]
    const ret = exFns()
    expect(outX).toEqual(1)
    expect(outY).toEqual(2)
    expect(ret).toEqual(3)
  })
})
describe("beat", () => {
  it("executes functions till gets true from a function", () => {
    const is2 = (n: number) => n === 2
    const is3 = (n: number) => n === 3
    const is4 = (n: number) => n === 4
    const isInRange = some(is2, is3, is4)
    type cases = [Expect<Eq<typeof isInRange, (n: number) => boolean>>]
    console.log(isInRange(2))
    expect(isInRange(2)).toEqual(true)
    expect(isInRange(3)).toEqual(true)
    expect(isInRange(4)).toEqual(true)
    expect(isInRange(5)).toEqual(false)
  })
})
describe("curry", () => {
  it("do curry concept in functional paradigm", () => {
    const fun = (s: string, n: number, o: object) => s + n
    const mparam = (n?: number, s?: string, ar?: any[]) => n

    const add2 = curry(add, 2)
    const mp = curry(mparam, 1)
    const f = curry(fun, "s", 1)
    const f2 = curry(fun, "s")
    const sub1 = curry(subtract, 1)
    // @ts-expect-error
    curry(fun, 1)
    // @ts-expect-error
    curry(mp, {})
    // correct
    type cases = [
      Expect<Eq<typeof add2, (x: number) => number>>,
      Expect<Eq<typeof mp, (s?: string, o?: any[]) => number | undefined>>,
      Expect<Eq<typeof f, (o: object) => string>>,
      Expect<Eq<typeof f2, (n: number, o: object) => string>>,
      Expect<Eq<typeof sub1, (x: number) => number>>
    ]
    expect(add2(3)).toEqual(5)
  })
})
describe("aim", () => {
  it("same as curry but in different arguments order the later comes first", () => {
    const fun = (s: string, n: number, o: object) => s + n
    const mparam = (n: number, s?: string, ar?: any[]) => n

    const mp = aim(mparam, [])
    const mp2 = aim(mparam, "hel", [])
    const f = aim(fun, {} as object)
    const f2 = aim(fun, 1, {} as object)
    const f3 = aim(fun, 1)
    const f4 = aim(fun, "hello")
    const sub1 = aim(subtract, 1)
    const sub3 = aim(subtract, 3)

    type cases = [
      Expect<Eq<typeof sub1, (x: number) => number>>,
      Expect<Eq<typeof sub3, (x: number) => number>>,
      Expect<Eq<typeof f, (a1: string, a2: number) => string>>,
      Expect<Eq<typeof f2, (a1: string) => string>>,
      Expect<Eq<typeof f3, (a1: string) => string>>,
      Expect<Eq<typeof f4, () => string>>,
      Expect<Eq<typeof mp, (a1: number, a2: string) => number>>,
      Expect<Eq<typeof mp2, (a1: number) => number>>
    ]
    expect(sub1(5)).toEqual(4)
    expect(sub3(5)).toEqual(2)
    expect(f("hello", 10)).toEqual("hello10")
    expect(f2("hello")).toEqual("hello1")
    expect(mp(11, "hello")).toEqual(11)
    expect(mp2(13)).toEqual(13)
  })
})
describe("fork", () => {
  it("executes an array of functions against some arguments", () => {
    const x2 = (x: number) => x * 2
    const is3 = (x: number) => x === 3
    const toStr = (x: number, format: string) => x.toString()
    const isN = (x: number, condition: number) => x === condition
    const isN2 = (x: number, condition?: number) => x === condition
    const toStr2 = (x: number, format?: string) => x.toString()

    const fun = map(x2, is3, toStr)
    const reverseFun = map(toStr, is3, x2)

    // @ts-expect-error
    const fun2 = map(x2, isN, toStr)

    const fun3 = map(x2, isN, toStr2)
    const fun4 = map(x2, isN2, toStr)
    const fun5 = map(x2, isN2)

    type cases = [
      Expect<
        Eq<typeof fun, (x: number, s: string) => [number, boolean, string]>
      >,
      Expect<
        Eq<typeof fun3, (x: number, s: number) => [number, boolean, string]>
      >,
      Expect<
        Eq<typeof fun4, (x: number, s: string) => [number, boolean, string]>
      >,
      Expect<Eq<typeof fun5, (x: number, s?: number) => [number, boolean]>>,
      Expect<
        Eq<
          typeof reverseFun,
          (x: number, s: string) => [string, boolean, number]
        >
      >
    ]
  })
})
describe("guard", () => {
  it("you can use guard with typescript to distinguish and filter type", () => {
    type TA = { value: number }
    type TB = { value: string }
    type T = TA | TB
    const add2 = ({ value }: TA) => value + 2
    const greet = ({ value }: TB) => "greeting " + value

    const doAdd = guard(add2, (t: T): t is TA => typeof t.value === "number")
    const doGreet = guard(greet, (t: T): t is TB => typeof t.value === "string")
    type cases = [
      Expect<Eq<typeof doAdd, (x: T) => number | null>>,
      Expect<Eq<typeof doGreet, (x: T) => string | null>>
    ]
    expect(doAdd({ value: 4 })).toBe(6)
    expect(doAdd({ value: 10 })).toBe(12)
    expect(doAdd({ value: "ali" })).toBeNull()

    expect(doGreet({ value: "ali" })).toBe("greeting ali")
    expect(doGreet({ value: "Mr. smith" })).toBe("greeting Mr. smith")
    expect(doGreet({ value: 10 })).toBeNull()
  })
})
describe("ifSome", () => {
  it("call function if any of conditions met", () => {
    const isEven = (x: number) => x % 2 === 0
    const retTrue = (x: number) => true
    const retEven = ifSome(retTrue, isEven)
    expect(retEven(2)).toEqual(true)
    expect(retEven(3)).toEqual(null)
    expect(retEven(4)).toEqual(true)
    expect(retEven(12)).toEqual(true)
    expect(retEven(13)).toEqual(null)

    const is2 = (x: number) => x === 2
    const is3 = (x: number) => x === 3
    const is2Or3 = ifSome(retTrue, is2, is3)
    expect(is2Or3(2)).toEqual(true)
    expect(is2Or3(3)).toEqual(true)
    expect(is2Or3(4)).toEqual(null)
    expect(is2Or3(12)).toEqual(null)
    expect(is2Or3(13)).toEqual(null)

    const toStr = (x: string) => x.toString()
    // @ts-expect-error
    const f1 = ifSome(is2Or3, is2, toStr)
    // @ts-expect-error
    const f2 = ifSome(is2Or3, toStr, is2)
    // @ts-expect-error
    const f22 = ifSome(add, toStr, is2)

    const f3 = ifSome(add, is2)
    expect(f3(2, 4)).toEqual(6)
    expect(f3(3, 4)).toEqual(null)

    const notAdd10 = (x: number, y: number) => x + y !== 10
    const f4 = ifSome(add, notAdd10)
    expect(f4(3, 5)).toEqual(8)
    expect(f4(3, 7)).toEqual(null)
    expect(f4(5, 5)).toEqual(null)
  })
})
describe("ifEvery", () => {
  it("call function if any of conditions met", () => {
    const isEven = (x: number) => x % 2 === 0
    const retTrue = (x: number) => true
    const retEven = ifEvery(retTrue, isEven)
    expect(retEven(2)).toEqual(true)
    expect(retEven(3)).toEqual(null)
    expect(retEven(4)).toEqual(true)
    expect(retEven(12)).toEqual(true)
    expect(retEven(13)).toEqual(null)

    const isBGT3 = (x: number) => x > 3
    const is2Or3 = ifEvery(retTrue, isEven, isBGT3)
    expect(is2Or3(2)).toEqual(null)
    expect(is2Or3(3)).toEqual(null)
    expect(is2Or3(4)).toEqual(true)
    expect(is2Or3(12)).toEqual(true)
    expect(is2Or3(13)).toEqual(null)

    const toStr = (x: string) => x.toString()
    // @ts-expect-error
    const f1 = ifEvery(is2Or3, isEven, toStr)
    // @ts-expect-error
    const f2 = ifEvery(is2Or3, toStr, isEven)
    // @ts-expect-error
    const f22 = ifEvery(add, toStr, isEven)

    const f3 = ifEvery(add, isEven)
    expect(f3(2, 4)).toEqual(6)
    expect(f3(3, 4)).toEqual(null)

    const notAdd10 = (x: number, y: number) => x + y !== 10
    const f4 = ifEvery(add, notAdd10)
    expect(f4(3, 5)).toEqual(8)
    expect(f4(3, 7)).toEqual(null)
    expect(f4(5, 5)).toEqual(null)
  })
})
