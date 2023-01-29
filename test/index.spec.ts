import {
  compose,
  pipe,
  queue,
  beat,
  curry,
  aim,
  fork,
  guard,
  exploit,
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
    const isInRange = beat(is2, is3, is4)
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
    const add2 = curry(add, 2)
    type cases = [Expect<Eq<typeof add2, (x: number) => number>>]
    expect(add2(3)).toEqual(5)
  })
})
describe("aim", () => {
  it("same as curry but in different arguments order the later comes first", () => {
    const sub1 = aim(subtract, 1)
    const sub3 = aim(subtract, 3)
    const fun = (s: string, n: number, o: object) => s + n
    // @ts-expect-error
    aim(fun, "hello")
    // @ts-expect-error
    aim(fun, 1)
    // correct
    const f = aim(fun, {})

    type cases = [
      Expect<Eq<typeof sub1, (x: number) => number>>,
      Expect<Eq<typeof sub3, (x: number) => number>>,
      Expect<Eq<typeof f, (a1: string, a2: number) => string>>
    ]
    expect(sub1(5)).toEqual(4)
    expect(sub3(5)).toEqual(2)
    expect(f("hello", 10)).toEqual("hello10")
  })
})
describe("fork", () => {
  it("executes an array of functions against some arguments", () => {
    const x2 = (x: number) => x * 2
    const is3 = (x: number) => x === 3
    const toStr = (x: number, format: string) => x.toString()
    const fun = fork(x2, is3, toStr)
    const reverseFun = fork(toStr, is3, x2)
    const isN = (x: number, condition: number) => x === condition
    // @ts-expect-error
    const fun2 = fork(x2, isN, toStr)
    type cases = [
      Expect<
        Eq<typeof fun, (x: number, s: string) => [number, boolean, string]>
      >,
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
  it("creates a function with a condition function that each time will only execute if args met the condition", () => {
    const not2 = (x: number) => x !== 2
    const isEven = (x: number) => x % 2 === 0
    const half = (x: number) => x / 2
    const halfTill2 = guard(half, not2, isEven)
    expect(halfTill2(2)).toEqual(null)
    expect(halfTill2(3)).toEqual(null)
    expect(halfTill2(4)).toEqual(2)
    expect(halfTill2(12)).toEqual(6)
    const toStr = (x: string) => x.toString()
    // @ts-expect-error
    const f1 = guard(half, not2, toStr)
    // @ts-expect-error
    const f2 = guard(half, toStr, not2)
    // @ts-expect-error
    const f22 = guard(add, toStr, not2)

    const f3 = guard(add, not2)
    expect(f3(2, 4)).toEqual(null)
    expect(f3(3, 4)).toEqual(7)

    const notAdd10 = (x: number, y: number) => x + y !== 10
    const f4 = guard(add, notAdd10)
    expect(f4(3, 5)).toEqual(8)
    expect(f4(3, 7)).toEqual(null)
    expect(f4(5, 5)).toEqual(null)
  })
})
describe("exploit", () => {
  it("call function if any of conditions met", () => {
    const isEven = (x: number) => x % 2 === 0
    const retTrue = (x: number) => true
    const retEven = exploit(retTrue, isEven)
    expect(retEven(2)).toEqual(true)
    expect(retEven(3)).toEqual(null)
    expect(retEven(4)).toEqual(true)
    expect(retEven(12)).toEqual(true)
    expect(retEven(13)).toEqual(null)

    const is2 = (x: number) => x === 2
    const is3 = (x: number) => x === 3
    const is2Or3 = exploit(retTrue, is2, is3)

    expect(is2Or3(2)).toEqual(true)
    expect(is2Or3(3)).toEqual(true)
    expect(is2Or3(4)).toEqual(null)
    expect(is2Or3(12)).toEqual(null)
    expect(is2Or3(13)).toEqual(null)

    const toStr = (x: string) => x.toString()
    // @ts-expect-error
    const f1 = exploit(is2Or3, is2, toStr)
    // @ts-expect-error
    const f2 = exploit(is2Or3, toStr, is2)
    // @ts-expect-error
    const f22 = exploit(add, toStr, is2)

    const f3 = exploit(add, is2)
    expect(f3(2, 4)).toEqual(6)
    expect(f3(3, 4)).toEqual(null)

    const notAdd10 = (x: number, y: number) => x + y !== 10
    const f4 = exploit(add, notAdd10)
    expect(f4(3, 5)).toEqual(8)
    expect(f4(3, 7)).toEqual(null)
    expect(f4(5, 5)).toEqual(null)
  })
})
