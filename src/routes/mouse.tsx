import { createSignal, For } from "solid-js"
import { useMouse } from "~/solid-use"

export default function mouse() {
  const [divEl, setDivEl] = createSignal<HTMLDivElement>()

  const mouse = useMouse(divEl)

  return (
    <div ref={setDivEl} class="prose rounded-lg border p-8 shadow-md">
      <For each={Object.keys(mouse)}>
        {key => (
          <div>
            <span class="inline-block w-[144px] text-right pr-2">{key}:</span>
            <span>{key === "isOutside" ? `${mouse[key]()}` : mouse[key]}</span>
          </div>
        )}
      </For>
    </div>
  )
}
