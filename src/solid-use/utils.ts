import type { Accessor } from "solid-js"
import type { EventTarget } from "./useEventListener"

export type Ref<T extends EventTarget> = Accessor<T | undefined>
type NotAccessor<T> = T extends Accessor<any> ? never : T
export type MaybeAccessor<T> = Accessor<T> | NotAccessor<T>
// export type MaybeAccessor<T> = T | Accessor<T>
export const isAccessor = <T>(arg: MaybeAccessor<T>): arg is Accessor<T> =>
  typeof arg === "function"
export const makeAccessor = <T>(arg: MaybeAccessor<T>) =>
  isAccessor(arg) ? arg : () => arg

export const isClient = typeof window !== "undefined"
export const defaultWindow = isClient ? window : undefined

export const isString = (arg: any): arg is string => typeof arg === "string"

export const noop = () => {}
export const asArray = (arg: any) => (Array.isArray(arg) ? arg : [arg])

type PushFront<TailT extends any[], HeadT> = ((
  head: HeadT,
  ...tail: TailT
) => void) extends (...arr: infer ArrT) => void
  ? ArrT
  : never

export type UnionToUniqueArrayConst<
  U extends string,
  ResultT extends any[] = []
> = Readonly<
  {
    [k in U]: [Exclude<U, k>] extends [never]
      ? PushFront<ResultT, k>
      : UnionToUniqueArrayConst<Exclude<U, k>, PushFront<ResultT, k>>
  }[U]
>

export interface ConfigurableWindow {
  /*
   * Specify a custom `window` instance, e.g. working with iframes or in testing environments.
   */
  window?: Window
}
