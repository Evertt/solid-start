import { useRouteData } from "solid-start"
import {
  createServerAction$,
  createServerData$,
  redirect,
} from "solid-start/server"
import { getUser, logout } from "~/db/session"

export function routeData() {
  return createServerData$(async (_, { request }) => {
    const user = await getUser(request)

    if (!user) {
      throw redirect("/login")
    }

    return user
  })
}

export default function Home() {
  const user = useRouteData<typeof routeData>()
  const [, { Form }] = createServerAction$((f: FormData, { request }) =>
    logout(request)
  )

  return (
    <main class="w-full space-y-2 p-4">
      <h1 class="text-3xl font-bold">Hello {user()?.username}</h1>
      <h3 class="text-xl font-bold">Message board</h3>
      <Form>
        <button name="logout" type="submit">
          Logout
        </button>
      </Form>
    </main>
  )
}
