import { type Accessor, createSignal, createEffect, batch } from "solid-js"
import { useEventListener } from "./useEventListener"
import {
  type Ref,
  defaultWindow,
  ConfigurableWindow,
  UnionToUniqueArrayConst,
  MaybeAccessor,
  makeAccessor,
} from "./utils"

type TrackedEventTypes = keyof Pick<
  GlobalEventHandlersEventMap,
  "mousemove" | "dragover" | "touchstart" | "touchmove" | "touchend"
>

const trackedEventTypes: UnionToUniqueArrayConst<TrackedEventTypes> = [
  "mousemove",
  "dragover",
  "touchstart",
  "touchmove",
  "touchend",
]

type EventHandler = (this: Window, ev: MouseEvent | TouchEvent) => any
type EventHandlerMap = Record<TrackedEventTypes, EventHandler | false>

type Position = {
  x: number
  y: number
}

export interface UseMouseOptions extends ConfigurableWindow {
  /**
   * Mouse position based by page or client
   *
   * @default "page"
   */
  type?: "page" | "client"

  /**
   * Listen to `touchmove` events
   *
   * @default true
   */
  touch?: boolean

  /**
   * Reset to initial value when `touchend` event fired
   *
   * @default false
   */
  resetOnTouchEnds?: boolean

  /**
   * Initial position
   *
   * @default { x: 0, y: 0 }
   */
  initialValue?: Position

  /**
   * Determines whether mouse position
   * should be tracked when it's outside the target
   *
   * @default true
   */
  handleOutside?: boolean
}

type MouseSourceType = "mouse" | "touch"

export function useMouse<T extends HTMLElement>(
  target?: Ref<T>,
  options: MaybeAccessor<UseMouseOptions> = {}
) {
  const optionsFn = makeAccessor(options)

  const element: Ref<T> = () => {
    const { window = defaultWindow } = optionsFn()
    return target ? target() : (window?.document.body as T)
  }

  let eventHandlerIsAttached = false

  const elementIsMounted = (element: Ref<T>): element is Accessor<T> =>
    !!element()

  const [sourceType, setSourceType] = createSignal<MouseSourceType>()

  const { initialValue = { x: 0, y: 0 } } = optionsFn()
  const [bodyX, setBodyX] = createSignal(initialValue.x)
  const [bodyY, setBodyY] = createSignal(initialValue.y)

  const [elementX, setElementX] = createSignal(0)
  const [elementY, setElementY] = createSignal(0)

  const [elementPositionX, setElementPositionX] = createSignal(0)
  const [elementPositionY, setElementPositionY] = createSignal(0)

  const [elementWidth, setElementWidth] = createSignal(0)
  const [elementHeight, setElementHeight] = createSignal(0)

  const [isOutside, setIsOutside] = createSignal(!!target?.())

  const reset = () => {
    const { initialValue = { x: 0, y: 0 } } = optionsFn()

    setBodyX(initialValue.x)
    setBodyY(initialValue.y)
  }

  const eventHandler = (event: MouseEvent | TouchEvent | Touch) => {
    let sourceType: MouseSourceType = "mouse"
    const { type = "page" } = optionsFn()

    if (event instanceof TouchEvent) {
      if (!event.touches.length) return
      event = event.touches[0]
      sourceType = "touch"
    }

    batch(() => {
      setBodyX(event[`${type}X`])
      setBodyY(event[`${type}Y`])
      setSourceType(sourceType)
    })
  }

  const attachEventHandler = () => {
    if (eventHandlerIsAttached) return
    if (!elementIsMounted(element)) return

    const {
      touch = true,
      resetOnTouchEnds = false,
      window = defaultWindow,
    } = optionsFn()

    if (!window) return

    const eventHandlerMap: EventHandlerMap = {
      mousemove: eventHandler,
      dragover: eventHandler,
      touchstart: touch && eventHandler,
      touchmove: touch && eventHandler,
      touchend: touch && resetOnTouchEnds && reset,
    }

    for (const key of trackedEventTypes) {
      const handler = eventHandlerMap[key]
      if (!handler) continue
      useEventListener(window, key, handler, { passive: true })
    }

    eventHandlerIsAttached = true
  }

  createEffect(() => {
    const { handleOutside = true, window = defaultWindow } = optionsFn()

    if (!window) return
    if (!target || !target()) return
    if (!elementIsMounted(element)) return

    const [x, y] = [bodyX(), bodyY()]
    const { left, top, width, height } = element().getBoundingClientRect()

    const elPosX = left + window.scrollX
    const elPosY = top + window.scrollY
    const elX = x - elPosX
    const elY = y - elPosY
    const isOutside =
      width === 0 ||
      height === 0 ||
      elX < 0 ||
      elY < 0 ||
      elX > width ||
      elY > height

    batch(() => {
      setElementPositionX(Math.round(elPosX))
      setElementPositionY(Math.round(elPosY))
      setElementWidth(Math.round(width))
      setElementHeight(Math.round(height))
      setIsOutside(isOutside)

      if (handleOutside || !isOutside) {
        setElementX(Math.round(elX))
        setElementY(Math.round(elY))
      }
    })
  })

  return {
    get x() {
      attachEventHandler()
      return bodyX
    },
    get y() {
      attachEventHandler()
      return bodyY
    },
    get sourceType() {
      attachEventHandler()
      return sourceType
    },
    get elementX() {
      attachEventHandler()
      return elementX
    },
    get elementY() {
      attachEventHandler()
      return elementY
    },
    get elementPositionX() {
      attachEventHandler()
      return elementPositionX
    },
    get elementPositionY() {
      attachEventHandler()
      return elementPositionY
    },
    get elementWidth() {
      attachEventHandler()
      return elementWidth
    },
    get elementHeight() {
      attachEventHandler()
      return elementHeight
    },
    get isOutside() {
      attachEventHandler()
      return isOutside
    },
  }
}
