import { Show, createSignal } from "solid-js"
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

  return (
    <main>
      <h1>Login</h1>
      <Form>
        <input
          type="hidden"
          name="redirectTo"
          value={params.redirectTo ?? "/"}
        />
        <fieldset>
          <legend>Login or Register?</legend>
          <label>
            <input
              type="radio"
              name="loginType"
              value="login"
              checked={loginType() === "login"}
              onChange={() => setLoginType("login")}
            />
            Login
          </label>
          <label>
            <input
              type="radio"
              name="loginType"
              value="register"
              checked={loginType() === "register"}
              onChange={() => setLoginType("register")}
            />
            Register
          </label>
        </fieldset>
        <div>
          <label for="username">Username</label>
          <input id="username" name="username" placeholder="kody" />
        </div>
        <Show when={loggingIn.error?.fieldErrors?.username}>
          <p role="alert">{loggingIn.error.fieldErrors.username}</p>
        </Show>
        <div>
          <label for="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="twixrox"
          />
        </div>
        <Show when={loggingIn.error?.fieldErrors?.password}>
          <p role="alert">{loggingIn.error.fieldErrors.password}</p>
        </Show>
        <Show when={loggingIn.error?.message}>
          <p role="alert" id="error-message">
            {loggingIn.error.message}
          </p>
        </Show>
        <button type="submit" style="text-transform: capitalize">
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
