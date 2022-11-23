import type { LiteralUnion, UnionToIntersection } from "type-fest"
import { createSignal, onCleanup, createEffect } from "solid-js"
import { type Ref, noop, defaultWindow, isString } from "./utils"

export type EventTarget = Pick<
  HTMLElement,
  "addEventListener" | "removeEventListener"
> &
  Pick<Document, "addEventListener" | "removeEventListener"> &
  Pick<Window, "addEventListener" | "removeEventListener">

type EventMap = HTMLElementEventMap | DocumentEventMap | WindowEventMap

type EventListener<EM extends EventMap | string> =
  EM extends HTMLElementEventMap
    ? <K extends keyof HTMLElementEventMap>(
        this: HTMLElement,
        ev: HTMLElementEventMap[K]
      ) => any
    : EM extends DocumentEventMap
    ? <K extends keyof DocumentEventMap>(
        this: Document,
        ev: DocumentEventMap[K]
      ) => any
    : EM extends WindowEventMap
    ? <K extends keyof WindowEventMap>(
        this: Window,
        ev: WindowEventMap[K]
      ) => any
    : EM extends string
    ? EventListenerOrEventListenerObject
    : never

interface InferEventTarget<Events> {
  addEventListener(event: Events, fn?: any, options?: any): any
  removeEventListener(event: Events, fn?: any, options?: any): any
}

export type WindowEventName = keyof WindowEventMap
export type DocumentEventName = keyof DocumentEventMap
export type HTMLElementEventName = keyof HTMLElementEventMap

export interface GeneralEventListener<E extends Event = Event> {
  (evt: E): void
}

type Arrayable<T> = T[] | T
type Fn = () => void

/**
 * Register using addEventListener on mounted, and removeEventListener automatically on unmounted.
 *
 * Overload 1: Omitted Window target
 *
 * @see https://vueuse.org/useEventListener
 * @param event
 * @param listener
 * @param options
 */
export function useEventListener<E extends keyof WindowEventMap>(
  event: Arrayable<E>,
  listener: Arrayable<EventListener<WindowEventMap>>,
  options?: boolean | AddEventListenerOptions
): Fn

/**
 * Register using addEventListener on mounted, and removeEventListener automatically on unmounted.
 *
 * Overload 2: Explicitly Window target
 *
 * @see https://vueuse.org/useEventListener
 * @param target
 * @param event
 * @param listener
 * @param options
 */
export function useEventListener<E extends keyof WindowEventMap>(
  target: Window,
  event: Arrayable<E>,
  listener: Arrayable<EventListener<WindowEventMap>>,
  options?: boolean | AddEventListenerOptions
): Fn

/**
 * Register using addEventListener on mounted, and removeEventListener automatically on unmounted.
 *
 * Overload 3: Explicitly Document target
 *
 * @see https://vueuse.org/useEventListener
 * @param target
 * @param event
 * @param listener
 * @param options
 */
export function useEventListener<E extends keyof DocumentEventMap>(
  target: Document,
  event: Arrayable<E>,
  listener: Arrayable<EventListener<DocumentEventMap>>,
  options?: boolean | AddEventListenerOptions
): Fn

/**
 * Register using addEventListener on mounted, and removeEventListener automatically on unmounted.
 *
 * Overload 4: Explicitly HTMLElement target
 *
 * @see https://vueuse.org/useEventListener
 * @param target
 * @param event
 * @param listener
 * @param options
 */
export function useEventListener<E extends keyof HTMLElementEventMap>(
  target: HTMLElement,
  event: Arrayable<E>,
  listener: Arrayable<EventListener<HTMLElementEventMap>>,
  options?: boolean | AddEventListenerOptions
): Fn

/**
 * Register using addEventListener on mounted, and removeEventListener automatically on unmounted.
 *
 * Overload 5: Custom event target with event type infer
 *
 * @see https://vueuse.org/useEventListener
 * @param target
 * @param event
 * @param listener
 * @param options
 */
export function useEventListener<
  Names extends string,
  EventType extends Event = Event
>(
  target: InferEventTarget<Names>,
  event: Arrayable<Names>,
  listener: Arrayable<GeneralEventListener<EventType>>,
  options?: boolean | AddEventListenerOptions
): Fn

/**
 * Register using addEventListener on mounted, and removeEventListener automatically on unmounted.
 *
 * Overload 6: Custom event target fallback
 *
 * @see https://vueuse.org/useEventListener
 * @param target
 * @param event
 * @param listener
 * @param options
 */
export function useEventListener(
  target: Ref<EventTarget>,
  event: Arrayable<string>,
  listener: Arrayable<EventListenerOrEventListenerObject>,
  options?: boolean | AddEventListenerOptions
): Fn

export function useEventListener(...args: any[]) {
  const [target, setTarget] = createSignal<EventTarget>()
  let events: LiteralUnion<keyof UnionToIntersection<EventMap>, string>[]
  let listeners: EventListenerOrEventListenerObject[]
  let options: boolean | AddEventListenerOptions | undefined

  if (isString(args[0]) || Array.isArray(args[0])) {
    setTarget(defaultWindow)
    ;[events, listeners, [options]] = args.map(v => [v].flatMap(v => v))
  } else {
    setTarget(args[0])
    ;[, events, listeners, [options]] = args.map(v => [v].flatMap(v => v))
  }

  if (!target()) return noop

  const cleanups: Function[] = []
  const cleanup = () => {
    cleanups.forEach(fn => fn())
    cleanups.length = 0
  }

  const register = (
    el: EventTarget,
    event: string,
    listener: EventListenerOrEventListenerObject
  ) => {
    el.addEventListener(event, listener, options)
    return () => el.removeEventListener(event, listener, options)
  }

  createEffect(() => {
    if (!events.length) return
    const el = target()!

    cleanups.push(
      ...events.flatMap(event =>
        listeners.map(listener => register(el, event, listener))
      )
    )

    onCleanup(cleanup)
  })

  return () => {
    cleanup()
    events.length = 0
  }
}
