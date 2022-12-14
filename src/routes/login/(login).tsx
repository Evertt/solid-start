import { Show, For, createSignal } from "solid-js"
import { useParams, useRouteData } from "solid-start"
import { FormError } from "solid-start/data"
import {
  createServerAction$,
  createServerData$,
  redirect,
} from "solid-start/server"
import { db } from "~/db"
import { createUserSession, getUser, login, register } from "~/db/session"

const loginTypes = ["login", "register"] as const
type LoginType = typeof loginTypes[number]

type LoginFormFields = {
  loginType: LoginType
  username: string
  password: string
}

export function routeData() {
  return createServerData$(async (_, { request }) => {
    if (await getUser(request)) {
      throw redirect("/")
    }

    return {}
  })
}

export default function Login() {
  const data = useRouteData<typeof routeData>()
  const params = useParams()

  const [loggingIn, { Form }] = createServerAction$(async (form: FormData) => {
    const { fields, redirectTo } = validateLoginFormSubmission(form)

    switch (fields.loginType) {
      case "login":
        return tryLogginInUser(fields, redirectTo)
      case "register":
        return tryRegisteringUser(fields, redirectTo)
      default:
        assertLoginTypeIsNever(fields.loginType, fields)
    }
  })

  const [loginType, setLoginType] = createSignal<LoginType>("login")

  const fields = [
    {
      field: "username",
      type: "text",
      placeholder: "kody",
    },
    {
      field: "password",
      type: "password",
      placeholder: "twixrox",
    },
  ] as const

  return (
    <main class="prose rounded-lg border p-8 shadow-md">
      <h1>Login</h1>
      <Form>
        <input
          type="hidden"
          name="redirectTo"
          value={params.redirectTo ?? "/"}
        />

        <fieldset>
          <legend class="inline-block w-full text-center">
            Login or Register?
          </legend>
          <div class="mb-2 flex justify-around">
            <For each={loginTypes}>
              {type => (
                <label class="h-7">
                  <input
                    type="radio"
                    name="loginType"
                    value={type}
                    class="mr-2"
                    checked={loginType() === type}
                    onChange={() => setLoginType(type)}
                  />
                  <span class="inline-block h-7 align-middle">{type}</span>
                </label>
              )}
            </For>
          </div>
        </fieldset>

        <For each={fields}>
          {({ field, ...rest }) => (
            <>
              <div class="my-2">
                <label for={field} class="inline-block w-20 capitalize">
                  {field}
                </label>
                <input
                  id={field}
                  class={`
                    mt-1
                    block
                    w-full
                    rounded-md
                    border-gray-300
                    shadow-sm
                    focus:border-indigo-300
                    focus:ring
                    focus:ring-indigo-200
                    focus:ring-opacity-50
                  `}
                  name={field}
                  {...rest}
                />
              </div>
              <Show when={loggingIn.error?.fieldErrors?.[field]}>
                <p role="alert">{loggingIn.error.fieldErrors[field]}</p>
              </Show>
            </>
          )}
        </For>

        <Show when={loggingIn.error?.message}>
          <p role="alert" id="error-message">
            {loggingIn.error.message}
          </p>
        </Show>

        <button
          type="submit"
          class={`
            mt-8
            block
            w-full
            rounded-md
            border-gray-300
            bg-blue-500
            py-1
            capitalize
            text-white
            shadow-sm
            focus:border-indigo-300
            focus:ring
            focus:ring-indigo-200
            focus:ring-opacity-50
          `}
        >
          {data() ? loginType() : ""}
        </button>
      </Form>
    </main>
  )
}

function validateLoginFormSubmission(form: FormData) {
  const loginType = form.get("loginType")
  const username = form.get("username")
  const password = form.get("password")
  const redirectTo = form.get("redirectTo") || "/"

  if (
    !isLoginType(loginType) ||
    typeof username !== "string" ||
    typeof password !== "string" ||
    typeof redirectTo !== "string"
  )
    throw new FormError(`Form not submitted correctly.`)

  const fields: LoginFormFields = { loginType, username, password }

  const fieldErrors = {
    username: validateUsername(username),
    password: validatePassword(password),
  }

  if (Object.values(fieldErrors).some(Boolean))
    throw new FormError("Fields invalid", { fieldErrors, fields })

  return { fields, redirectTo }
}

function isLoginType(arg: any): arg is LoginType {
  return loginTypes.includes(arg)
}

function assertLoginTypeIsNever(_loginType: never, fields: LoginFormFields) {
  throw new FormError('Login type can only be "login" or "register".', {
    fields,
  })
}

function validateUsername(username: unknown) {
  if (typeof username !== "string" || username.length < 3) {
    return `Usernames must be at least 3 characters long`
  }
}

function validatePassword(password: unknown) {
  if (typeof password !== "string" || password.length < 6) {
    return `Passwords must be at least 6 characters long`
  }
}

async function tryLogginInUser(fields: LoginFormFields, redirectTo: string) {
  const user = await login(fields)

  if (!user)
    throw new FormError(`Username/Password combination is incorrect`, {
      fields,
    })

  return createUserSession(user.id, redirectTo)
}

async function tryRegisteringUser(fields: LoginFormFields, redirectTo: string) {
  const userExists = await db.user.findUnique({
    where: { username: fields.username },
  })

  if (userExists)
    throw new FormError(
      `User with username ${fields.username} already exists`,
      { fields }
    )

  const user = await register(fields)

  if (!user)
    throw new FormError(`Something went wrong trying to create a new user.`, {
      fields,
    })

  return createUserSession(user.id, redirectTo)
}
